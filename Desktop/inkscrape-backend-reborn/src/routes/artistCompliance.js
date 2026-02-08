const express = require("express");
const ApiError = require("../errors/ApiError");
const ComplianceEvent = require("../models/ComplianceEvent");
const CompanyProfile = require("../models/CompanyProfile");
const { sendSuccess } = require("../utils/apiResponse");

const VALID_OUTCOMES = new Set(["allowed", "conditional", "restricted"]);
const router = express.Router();

router.get("/compliance-events", async (req, res, next) => {
  try {
    const limitRaw = Number(req.query.limit || 50);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;

    const filter = {
      artist: req.user._id
    };

    if (req.query.outcome !== undefined) {
      const outcome = String(req.query.outcome).toLowerCase();
      if (!VALID_OUTCOMES.has(outcome)) {
        throw new ApiError(400, "INVALID_FILTER", "outcome must be one of: allowed, conditional, restricted.");
      }

      filter.outcome = outcome;
    }

    const events = await ComplianceEvent.find(filter).sort({ scannedAt: -1, createdAt: -1 }).limit(limit).lean();
    const companyProfileIds = Array.from(
      new Set(events.map((event) => event.companyProfile && String(event.companyProfile)).filter(Boolean))
    );

    const companyProfiles = companyProfileIds.length > 0
      ? await CompanyProfile.find({ _id: { $in: companyProfileIds } }).lean()
      : [];

    const companyNameById = new Map(companyProfiles.map((profile) => [String(profile._id), profile.companyName]));

    return sendSuccess(res, {
      count: events.length,
      events: events.map((event) => ({
        eventId: String(event._id),
        eventType: event.eventType || "compliance",
        scannedAt: event.scannedAt,
        outcome: event.outcome,
        reason: event.reason,
        companyName: event.companyProfile ? companyNameById.get(String(event.companyProfile)) || null : null,
        sourceType: event.sourceType,
        sourceName: event.sourceName,
        fileHash: event.fileHash,
        securityTag: event.securityTag,
        agreementId: event.agreement ? String(event.agreement) : null,
        similarityFinding: event.similarityFinding || null
      }))
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
