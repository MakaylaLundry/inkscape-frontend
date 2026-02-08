const ApiError = require("../errors/ApiError");
const { sendError } = require("../utils/apiResponse");

function notFoundHandler(req, _res, next) {
  return next(new ApiError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, _req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR");
  const message = statusCode >= 500 ? "Internal server error." : err.message || "Request failed.";

  if (statusCode >= 500) {
    console.error(err);
  }

  return sendError(res, {
    statusCode,
    code,
    message,
    details: err.details
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
