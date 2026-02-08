const User = require("../models/User");
const ApiError = require("../errors/ApiError");

function requireRole(...allowedRoles) {
  return async function roleGuard(req, _res, next) {
    try {
      let user = req.user;
      const auth0UserId = req.auth && req.auth.payload ? req.auth.payload.sub : null;
      if (!auth0UserId) {
        return next(new ApiError(401, "UNAUTHORIZED", "Missing authenticated user."));
      }

      if (!user) {
        user = await User.findOne({ auth0UserId }).lean();
      }

      if (!user) {
        return next(new ApiError(403, "USER_NOT_REGISTERED", "User profile not found in database."));
      }

      if (user.role === null || user.role === undefined) {
        return next(new ApiError(403, "ROLE_REQUIRED", "Role must be selected before accessing this route."));
      }

      if (!allowedRoles.includes(user.role)) {
        return next(new ApiError(403, "FORBIDDEN", "User does not have access to this route."));
      }

      req.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  requireRole
};
