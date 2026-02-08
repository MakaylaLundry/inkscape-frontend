const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3001),
  mongodbUri: process.env.MONGODB_URI || "",
  auth0Domain: process.env.AUTH0_DOMAIN || "",
  auth0Audience: process.env.AUTH0_AUDIENCE || ""
};

const hasAuth0Config = Boolean(env.auth0Domain && env.auth0Audience);

module.exports = {
  env,
  hasAuth0Config
};
