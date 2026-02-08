const ApiError = require("../errors/ApiError");

const VALID_AI_TRAINING_ALLOWED = new Set(["yes", "no", "conditional"]);

function parseBoolean(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return false;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }

    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }

  throw new ApiError(400, "INVALID_PERMISSION_INPUT", `${fieldName} must be a boolean value.`);
}

function parseAllowedUseCases(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch (_error) {
      // Fall back to comma-separated parsing.
    }

    return trimmed.split(",").map((entry) => entry.trim()).filter(Boolean);
  }

  throw new ApiError(400, "INVALID_PERMISSION_INPUT", "allowed_use_cases must be a string or array.");
}

function parsePermissionPayload(body = {}) {
  const aiTrainingAllowedRaw = body.ai_training_allowed ?? body.aiTrainingAllowed;

  if (typeof aiTrainingAllowedRaw !== "string") {
    throw new ApiError(
      400,
      "INVALID_PERMISSION_INPUT",
      "ai_training_allowed is required and must be one of: yes, no, conditional."
    );
  }

  const aiTrainingAllowed = aiTrainingAllowedRaw.trim().toLowerCase();
  if (!VALID_AI_TRAINING_ALLOWED.has(aiTrainingAllowed)) {
    throw new ApiError(
      400,
      "INVALID_PERMISSION_INPUT",
      "ai_training_allowed must be one of: yes, no, conditional."
    );
  }

  return {
    aiTrainingAllowed,
    allowedUseCases: parseAllowedUseCases(body.allowed_use_cases ?? body.allowedUseCases),
    attributionRequired: parseBoolean(body.attribution_required ?? body.attributionRequired, "attribution_required"),
    notes: typeof body.notes === "string" ? body.notes.trim() : ""
  };
}

module.exports = {
  parsePermissionPayload
};
