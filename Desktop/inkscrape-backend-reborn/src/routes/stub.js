const express = require("express");
const { verifyJwt } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { ROLES } = require("../constants/roles");
const { sendSuccess } = require("../utils/apiResponse");
const ApiError = require("../errors/ApiError");
const artistRoutes = require("./artist");
const artistComplianceRoutes = require("./artistCompliance");
const companyRoutes = require("./company");

const router = express.Router();

router.get("/auth/me", verifyJwt, (req, res) => {
  return sendSuccess(res, {
    auth0UserId: req.auth.payload.sub
  });
});

router.get("/me", verifyJwt, (req, res) => {
  return res.status(200).json({
    ok: true,
    user: {
      id: String(req.user._id),
      auth0UserId: req.user.auth0UserId,
      role: req.user.role ?? null
    }
  });
});

router.put("/me/role", verifyJwt, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !Object.values(ROLES).includes(role)) {
      return next(new ApiError(400, "INVALID_ROLE", "Role must be 'artist' or 'company'."));
    }
    if (req.user.role !== null) {
      return next(new ApiError(409, "ROLE_ALREADY_SET", "Role has already been assigned."));
    }
    req.user.role = role;
    await req.user.save();
    return sendSuccess(res, {
      id: String(req.user._id),
      auth0UserId: req.user.auth0UserId,
      role: req.user.role
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/artist/stub", verifyJwt, requireRole(ROLES.ARTIST), (req, res) => {
  return sendSuccess(res, {
    message: "Artist route access granted.",
    role: req.user.role
  });
});

router.get("/company/stub", verifyJwt, requireRole(ROLES.COMPANY), (req, res) => {
  return sendSuccess(res, {
    message: "Company route access granted.",
    role: req.user.role
  });
});

router.use("/artist", verifyJwt, requireRole(ROLES.ARTIST), artistRoutes);
router.use("/artist", verifyJwt, requireRole(ROLES.ARTIST), artistComplianceRoutes);
router.use("/company", verifyJwt, requireRole(ROLES.COMPANY), companyRoutes);

module.exports = router;
