const express = require("express");
const { randomUUID } = require("crypto");
const ApiError = require("../errors/ApiError");
const Artwork = require("../models/Artwork");
const Tag = require("../models/Tag");
const Permission = require("../models/Permission");
const { upload } = require("../middleware/upload");
const { sendSuccess } = require("../utils/apiResponse");
const { deleteTempFile, hashFileSha256 } = require("../utils/fileProcessing");
const { computeImagePHash } = require("../utils/imageHash");
const { parsePermissionPayload } = require("../utils/permissionPayload");

const router = express.Router();

function normalizeUploadError(error) {
  if (!error || error.name !== "MulterError") {
    return error;
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return new ApiError(400, "UPLOAD_LIMIT_EXCEEDED", "File exceeds upload size limit of 25MB.");
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return new ApiError(400, "INVALID_UPLOAD", "Unexpected file field in upload request.");
  }

  return new ApiError(400, "INVALID_UPLOAD", error.message);
}

function singleUploadMiddleware(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (error) {
      return next(normalizeUploadError(error));
    }

    return next();
  });
}

function batchUploadMiddleware(req, res, next) {
  upload.array("files", 25)(req, res, (error) => {
    if (error) {
      return next(normalizeUploadError(error));
    }

    return next();
  });
}

async function createArtworkRecord(file, artistUserId, permissionPayload) {
  let artwork;
  let tag;

  try {
    const sha256Hash = await hashFileSha256(file.path);
    const perceptualHash = await computeImagePHash(file.path, {
      mimeType: file.mimetype,
      fileName: file.originalname
    });

    artwork = await Artwork.create({
      artist: artistUserId,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      sha256Hash,
      ...(perceptualHash ? { perceptualHash } : {})
    });

    tag = await Tag.create({
      artwork: artwork._id,
      artist: artistUserId,
      tagUuid: randomUUID(),
      status: "active"
    });

    const permission = await Permission.create({
      artwork: artwork._id,
      tag: tag._id,
      artist: artistUserId,
      version: 1,
      aiTrainingAllowed: permissionPayload.aiTrainingAllowed,
      allowedUseCases: permissionPayload.allowedUseCases,
      attributionRequired: permissionPayload.attributionRequired,
      notes: permissionPayload.notes,
      isActive: true
    });

    return {
      artworkId: String(artwork._id),
      tagId: String(tag._id),
      permissionId: String(permission._id),
      securityTag: tag.tagUuid,
      hash: artwork.sha256Hash,
      fileName: artwork.originalFilename,
      mimeType: artwork.mimeType,
      sizeBytes: artwork.sizeBytes,
      permissionVersion: permission.version
    };
  } catch (error) {
    if (tag) {
      await Tag.deleteOne({ _id: tag._id });
    }

    if (artwork) {
      await Artwork.deleteOne({ _id: artwork._id });
    }

    throw error;
  }
}

router.post("/artworks/upload", singleUploadMiddleware, async (req, res, next) => {
  const uploadedFile = req.file;

  try {
    if (!uploadedFile) {
      throw new ApiError(400, "FILE_REQUIRED", "file is required.");
    }

    const permissionPayload = parsePermissionPayload(req.body);
    const artwork = await createArtworkRecord(uploadedFile, req.user._id, permissionPayload);

    return sendSuccess(
      res,
      {
        artwork
      },
      201
    );
  } catch (error) {
    return next(error);
  } finally {
    await deleteTempFile(uploadedFile && uploadedFile.path);
  }
});

router.post("/artworks/upload-batch", batchUploadMiddleware, async (req, res, next) => {
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];

  try {
    if (uploadedFiles.length === 0) {
      throw new ApiError(400, "FILES_REQUIRED", "At least one file is required in files field.");
    }

    const permissionPayload = parsePermissionPayload(req.body);
    const artworks = [];

    for (const file of uploadedFiles) {
      const artwork = await createArtworkRecord(file, req.user._id, permissionPayload);
      artworks.push(artwork);
      await deleteTempFile(file.path);
    }

    return sendSuccess(
      res,
      {
        count: artworks.length,
        artworks
      },
      201
    );
  } catch (error) {
    return next(error);
  } finally {
    for (const file of uploadedFiles) {
      await deleteTempFile(file.path);
    }
  }
});

module.exports = router;
