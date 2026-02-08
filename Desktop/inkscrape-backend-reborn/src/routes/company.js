const express = require("express");
const path = require("path");
const ApiError = require("../errors/ApiError");
const Artwork = require("../models/Artwork");
const Tag = require("../models/Tag");
const Permission = require("../models/Permission");
const CompanyProfile = require("../models/CompanyProfile");
const ComplianceEvent = require("../models/ComplianceEvent");
const Agreement = require("../models/Agreement");
const { upload } = require("../middleware/upload");
const { sendSuccess } = require("../utils/apiResponse");
const { hashFileSha256, deleteTempFile } = require("../utils/fileProcessing");
const {
  HASH_BITS,
  HASH_VERSION,
  computeImagePHash,
  hammingDistanceHex,
  isImageFile,
  similarityPercentFromHamming
} = require("../utils/imageHash");
const { computeOutcome } = require("../utils/compliance");
const { parseUseCaseList, uniqueUseCases } = require("../utils/useCases");
const {
  extractZipToTempDirectory,
  collectFilesRecursively,
  deleteTempDirectory,
  validateZipUpload,
  toPortablePath
} = require("../utils/zipProcessing");
const { generateConditionalAgreement } = require("../services/geminiService");

const router = express.Router();

function normalizeUploadError(error) {
  if (!error || error.name !== "MulterError") {
    return error;
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return new ApiError(400, "UPLOAD_LIMIT_EXCEEDED", "One of the uploaded files exceeds the size limit.");
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return new ApiError(400, "INVALID_UPLOAD", "Only 'files' and 'zip' fields are allowed.");
  }

  return new ApiError(400, "INVALID_UPLOAD", error.message);
}

function companyScanUploadMiddleware(req, res, next) {
  upload.fields([
    { name: "files", maxCount: 25 },
    { name: "zip", maxCount: 1 }
  ])(req, res, (error) => {
    if (error) {
      return next(normalizeUploadError(error));
    }

    return next();
  });
}

function formatCompanyProfile(profile) {
  if (!profile) {
    return null;
  }

  return {
    companyId: String(profile._id),
    companyUserId: String(profile.companyUser),
    companyName: profile.companyName,
    declaredUseCases: profile.declaredUseCases || [],
    description: profile.description || "",
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

function parseCompanyProfilePayload(body) {
  const companyNameRaw = body.company_name ?? body.companyName;
  if (typeof companyNameRaw !== "string" || !companyNameRaw.trim()) {
    throw new ApiError(400, "INVALID_COMPANY_PROFILE", "company_name is required.");
  }

  return {
    companyName: companyNameRaw.trim(),
    declaredUseCases: uniqueUseCases(parseUseCaseList(body.declared_use_cases ?? body.declaredUseCases, "declared_use_cases")),
    description: typeof (body.description ?? body.company_description) === "string"
      ? String(body.description ?? body.company_description).trim()
      : ""
  };
}

function buildArtworkLookup(artworks) {
  const byHash = new Map();

  for (const artwork of artworks) {
    const key = artwork.sha256Hash;
    if (!byHash.has(key)) {
      byHash.set(key, []);
    }

    byHash.get(key).push(artwork);
  }

  return byHash;
}

function buildTagLookup(tags) {
  const byArtwork = new Map();

  for (const tag of tags) {
    const artworkId = String(tag.artwork);
    if (!byArtwork.has(artworkId)) {
      byArtwork.set(artworkId, tag);
    }
  }

  return byArtwork;
}

function buildLatestPermissionLookup(permissions) {
  const byArtwork = new Map();

  for (const permission of permissions) {
    const artworkId = String(permission.artwork);
    if (!byArtwork.has(artworkId)) {
      byArtwork.set(artworkId, permission);
    }
  }

  return byArtwork;
}

function similarityBandFromPercent(similarityPercent) {
  if (!Number.isFinite(similarityPercent)) {
    return null;
  }

  if (similarityPercent >= 80) {
    return "work_at_risk";
  }

  if (similarityPercent >= 65) {
    return "may_be_at_risk";
  }

  return null;
}

router.get("/profile", async (req, res, next) => {
  try {
    const profile = await CompanyProfile.findOne({ companyUser: req.user._id }).lean();

    return sendSuccess(res, {
      profile: formatCompanyProfile(profile)
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/profile", async (req, res, next) => {
  try {
    const payload = parseCompanyProfilePayload(req.body || {});

    const profile = await CompanyProfile.findOneAndUpdate(
      { companyUser: req.user._id },
      {
        $set: {
          companyName: payload.companyName,
          declaredUseCases: payload.declaredUseCases,
          description: payload.description
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).lean();

    return sendSuccess(res, {
      profile: formatCompanyProfile(profile)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/scan", companyScanUploadMiddleware, async (req, res, next) => {
  const fileMap = req.files || {};
  const individualFiles = Array.isArray(fileMap.files) ? fileMap.files : [];
  const zipUpload = Array.isArray(fileMap.zip) ? fileMap.zip[0] : null;

  let extractedZipDirectory = null;

  try {
    if (individualFiles.length === 0 && !zipUpload) {
      throw new ApiError(400, "DATASET_REQUIRED", "Provide at least one file in 'files' or one archive in 'zip'.");
    }

    const companyProfile = await CompanyProfile.findOne({ companyUser: req.user._id }).lean();
    if (!companyProfile) {
      throw new ApiError(400, "COMPANY_PROFILE_REQUIRED", "Create company profile before running a scan.");
    }

    const scanEntries = [];

    for (const file of individualFiles) {
      scanEntries.push({
        sourceType: "individual",
        sourceName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype
      });
    }

    if (zipUpload) {
      validateZipUpload(zipUpload);
      extractedZipDirectory = await extractZipToTempDirectory(zipUpload.path);
      const extractedFiles = await collectFilesRecursively(extractedZipDirectory);

      for (const extractedFilePath of extractedFiles) {
        const relativeName = toPortablePath(path.relative(extractedZipDirectory, extractedFilePath));

        scanEntries.push({
          sourceType: "zip",
          sourceName: relativeName,
          filePath: extractedFilePath,
          mimeType: null
        });
      }
    }

    if (scanEntries.length === 0) {
      throw new ApiError(400, "DATASET_REQUIRED", "No scanable files were found in the request.");
    }

    const hashedEntries = [];
    for (const entry of scanEntries) {
      const fileHash = await hashFileSha256(entry.filePath);
      hashedEntries.push({
        sourceType: entry.sourceType,
        sourceName: entry.sourceName,
        fileHash,
        filePath: entry.filePath,
        mimeType: entry.mimeType
      });
    }

    const uniqueHashes = Array.from(new Set(hashedEntries.map((entry) => entry.fileHash)));
    const artworks = await Artwork.find({ sha256Hash: { $in: uniqueHashes } }).lean();

    const artworkByHash = buildArtworkLookup(artworks);
    const artworkIds = Array.from(new Set(artworks.map((artwork) => String(artwork._id))));

    const tags = artworkIds.length > 0
      ? await Tag.find({ artwork: { $in: artworkIds }, status: "active" }).lean()
      : [];

    const permissions = artworkIds.length > 0
      ? await Permission.find({ artwork: { $in: artworkIds }, isActive: true }).sort({ artwork: 1, version: -1 }).lean()
      : [];

    const tagByArtworkId = buildTagLookup(tags);
    const permissionByArtworkId = buildLatestPermissionLookup(permissions);

    const grouped = {
      allowed: [],
      conditional: [],
      restricted: [],
      unmatched: []
    };
    const similarityFindings = {
      work_at_risk: [],
      may_be_at_risk: []
    };

    const complianceEventDocuments = [];

    for (const entry of hashedEntries) {
      const matchedArtworks = artworkByHash.get(entry.fileHash) || [];

      if (matchedArtworks.length === 0) {
        grouped.unmatched.push({
          sourceType: entry.sourceType,
          sourceName: entry.sourceName,
          fileHash: entry.fileHash
        });

        if (!isImageFile({ mimeType: entry.mimeType, fileName: entry.sourceName })) {
          continue;
        }

        const datasetPHash = await computeImagePHash(entry.filePath, {
          mimeType: entry.mimeType,
          fileName: entry.sourceName
        });
        if (!datasetPHash) {
          continue;
        }

        const candidateArtworks = await Artwork.find({
          "perceptualHash.prefix": datasetPHash.prefix,
          "perceptualHash.version": HASH_VERSION,
          "perceptualHash.bits": HASH_BITS
        })
          .select("_id artist perceptualHash")
          .lean();

        if (candidateArtworks.length === 0) {
          continue;
        }

        const candidateArtworkIds = candidateArtworks.map((candidate) => String(candidate._id));
        const candidateTags = candidateArtworkIds.length > 0
          ? await Tag.find({ artwork: { $in: candidateArtworkIds }, status: "active" }).lean()
          : [];
        const candidateTagByArtworkId = buildTagLookup(candidateTags);

        const scoredMatches = [];
        for (const candidateArtwork of candidateArtworks) {
          const candidateHash = candidateArtwork.perceptualHash && candidateArtwork.perceptualHash.value;
          if (!candidateHash) {
            continue;
          }

          const hammingDistance = hammingDistanceHex(datasetPHash.value, candidateHash);
          const similarityPercent = similarityPercentFromHamming(hammingDistance, HASH_BITS);
          const similarityBand = similarityBandFromPercent(similarityPercent);
          if (!similarityBand) {
            continue;
          }

          const candidateTag = candidateTagByArtworkId.get(String(candidateArtwork._id));
          scoredMatches.push({
            artworkId: String(candidateArtwork._id),
            artistId: String(candidateArtwork.artist),
            securityTag: candidateTag ? candidateTag.tagUuid : null,
            similarityPercent,
            similarityBand
          });
        }

        if (scoredMatches.length === 0) {
          continue;
        }

        scoredMatches.sort((left, right) => right.similarityPercent - left.similarityPercent);
        const findingCategory = scoredMatches[0].similarityBand;
        const topMatches = scoredMatches.slice(0, 5);

        similarityFindings[findingCategory].push({
          sourceType: entry.sourceType,
          sourceName: entry.sourceName,
          fileHash: entry.fileHash,
          datasetPHash: datasetPHash.value,
          bits: HASH_BITS,
          prefix: datasetPHash.prefix,
          topMatches
        });

        const impactedArtistIds = Array.from(new Set(topMatches.map((match) => match.artistId)));
        for (const artistId of impactedArtistIds) {
          const artistMatches = topMatches
            .filter((match) => match.artistId === artistId)
            .map((match) => ({
              artworkId: match.artworkId,
              securityTag: match.securityTag,
              similarityPercent: match.similarityPercent,
              similarityBand: match.similarityBand
            }));

          complianceEventDocuments.push({
            companyUser: req.user._id,
            companyProfile: companyProfile._id,
            artist: artistId,
            artwork: null,
            tag: null,
            permission: null,
            agreement: null,
            securityTag: null,
            sourceType: entry.sourceType,
            sourceName: entry.sourceName,
            fileHash: entry.fileHash,
            eventType: "similarity",
            outcome: null,
            reason: `Similarity flag: ${findingCategory}.`,
            companyDeclaredUseCases: companyProfile.declaredUseCases || [],
            similarityFinding: {
              category: findingCategory,
              datasetPHash: datasetPHash.value,
              bits: HASH_BITS,
              prefix: datasetPHash.prefix,
              topMatches: artistMatches
            },
            scannedAt: new Date()
          });
        }

        continue;
      }

      for (const artwork of matchedArtworks) {
        const artworkId = String(artwork._id);
        const tag = tagByArtworkId.get(artworkId);
        const permission = permissionByArtworkId.get(artworkId);

        let outcome = "restricted";
        let reason = "Artwork matched but missing active tag or active permission.";

        if (tag && permission) {
          const decision = computeOutcome(permission, companyProfile.declaredUseCases || []);
          outcome = decision.outcome;
          reason = decision.reason;
        }

        let agreementDocument = null;
        if (outcome === "conditional" && tag && permission) {
          const agreementPayload = await generateConditionalAgreement({
            securityTag: tag.tagUuid,
            companyName: companyProfile.companyName,
            companyDeclaredUseCases: companyProfile.declaredUseCases || [],
            aiTrainingAllowed: permission.aiTrainingAllowed,
            allowedUseCases: permission.allowedUseCases || [],
            attributionRequired: permission.attributionRequired,
            notes: permission.notes
          });

          agreementDocument = await Agreement.create({
            companyUser: req.user._id,
            companyProfile: companyProfile._id,
            artist: artwork.artist,
            artwork: artwork._id,
            tag: tag._id,
            permission: permission._id,
            agreementText: agreementPayload.agreementText,
            provider: agreementPayload.provider,
            model: agreementPayload.model
          });
        }

        const item = {
          sourceType: entry.sourceType,
          sourceName: entry.sourceName,
          fileHash: entry.fileHash,
          artworkId,
          tagId: tag ? String(tag._id) : null,
          securityTag: tag ? tag.tagUuid : null,
          permissionId: permission ? String(permission._id) : null,
          permissionVersion: permission ? permission.version : null,
          outcome,
          reason,
          agreementId: agreementDocument ? String(agreementDocument._id) : null,
          agreementText: agreementDocument ? agreementDocument.agreementText : null
        };

        grouped[outcome].push(item);

        complianceEventDocuments.push({
          companyUser: req.user._id,
          companyProfile: companyProfile._id,
          artist: artwork.artist,
          artwork: artwork._id,
          tag: tag ? tag._id : null,
          permission: permission ? permission._id : null,
          agreement: agreementDocument ? agreementDocument._id : null,
          securityTag: tag ? tag.tagUuid : null,
          sourceType: entry.sourceType,
          sourceName: entry.sourceName,
          fileHash: entry.fileHash,
          eventType: "compliance",
          outcome,
          reason,
          companyDeclaredUseCases: companyProfile.declaredUseCases || [],
          scannedAt: new Date()
        });
      }
    }

    if (complianceEventDocuments.length > 0) {
      await ComplianceEvent.insertMany(complianceEventDocuments);
    }

    return sendSuccess(res, {
      summary: {
        totalFilesScanned: hashedEntries.length,
        matchedItems: grouped.allowed.length + grouped.conditional.length + grouped.restricted.length,
        unmatchedFiles: grouped.unmatched.length,
        allowed: grouped.allowed.length,
        conditional: grouped.conditional.length,
        restricted: grouped.restricted.length
      },
      report: grouped,
      similarityFindings
    });
  } catch (error) {
    return next(error);
  } finally {
    for (const file of individualFiles) {
      await deleteTempFile(file.path);
    }

    if (zipUpload) {
      await deleteTempFile(zipUpload.path);
    }

    if (extractedZipDirectory) {
      await deleteTempDirectory(extractedZipDirectory);
    }
  }
});

module.exports = router;
