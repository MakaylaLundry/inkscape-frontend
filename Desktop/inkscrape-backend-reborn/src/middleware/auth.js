const { auth } = require("express-oauth2-jwt-bearer");
const { env, hasAuth0Config } = require("../config/env");
const ApiError = require("../errors/ApiError");
const User = require("../models/User");

let hasShownConfigWarning = false;

const auth0JwtMiddleware = hasAuth0Config
  ? auth({
      audience: env.auth0Audience,
      issuerBaseURL: `https://${env.auth0Domain}/`,
      tokenSigningAlg: "RS256"
    })
  : null;

function stubJwtMiddleware(req, _res, next) {
  const subjectFromHeader = req.get("x-dev-user-sub");
  const fallbackSubject = "dev|local-user";

  req.auth = {
    payload: {
      sub: subjectFromHeader || fallbackSubject
    }
  };

  next();
}

async function loadOrCreateUser(req, _res, next) {
  try {
    const auth0UserId = req.auth && req.auth.payload ? req.auth.payload.sub : null;
    if (!auth0UserId) {
      return next(new ApiError(401, "UNAUTHORIZED", "Missing authenticated user."));
    }

    const user = await User.findOneAndUpdate(
      { auth0UserId },
      {
        $setOnInsert: {
          auth0UserId,
          role: null
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function verifyJwt(req, res, next) {
  const finishAuth = (error) => {
    if (error) {
      return next(error);
    }

    return loadOrCreateUser(req, res, next);
  };

  if (process.env.DEV_AUTH === "true") {
    return stubJwtMiddleware(req, res, finishAuth);
  }

  if (auth0JwtMiddleware) {
    return auth0JwtMiddleware(req, res, finishAuth);
  }

  if (!hasShownConfigWarning) {
    console.warn("Authentication is not configured. Set AUTH0_DOMAIN/AUTH0_AUDIENCE or DEV_AUTH=true.");
    hasShownConfigWarning = true;
  }

  return next(new ApiError(500, "AUTH_CONFIGURATION_ERROR", "Authentication is not configured."));
}

module.exports = {
  verifyJwt
};
