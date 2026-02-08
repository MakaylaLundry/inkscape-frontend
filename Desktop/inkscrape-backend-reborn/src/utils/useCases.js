const ApiError = require("../errors/ApiError");

function normalizeUseCase(value) {
  return String(value).trim().toLowerCase();
}

function parseUseCaseList(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(normalizeUseCase).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeUseCase).filter(Boolean);
      }
    } catch (_error) {
      // Fall through to comma-separated parser.
    }

    return trimmed.split(",").map(normalizeUseCase).filter(Boolean);
  }

  throw new ApiError(400, "INVALID_INPUT", `${fieldName} must be a string or array.`);
}

function uniqueUseCases(useCases) {
  return Array.from(new Set(useCases));
}

module.exports = {
  normalizeUseCase,
  parseUseCaseList,
  uniqueUseCases
};
