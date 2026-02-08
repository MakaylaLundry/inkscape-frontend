const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles");

const userSchema = new mongoose.Schema(
  {
    auth0UserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    role: {
      type: String,
      default: null,
      validate: {
        validator: (value) => value === null || value === undefined || value === ROLES.ARTIST || value === ROLES.COMPANY,
        message: "role must be one of: artist, company, or null."
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
