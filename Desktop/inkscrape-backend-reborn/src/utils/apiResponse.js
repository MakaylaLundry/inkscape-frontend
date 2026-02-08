function sendSuccess(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    ok: true,
    data
  });
}

function sendError(res, { statusCode = 500, code = "INTERNAL_SERVER_ERROR", message = "Internal server error", details } = {}) {
  return res.status(statusCode).json({
    ok: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
}

module.exports = {
  sendSuccess,
  sendError
};
