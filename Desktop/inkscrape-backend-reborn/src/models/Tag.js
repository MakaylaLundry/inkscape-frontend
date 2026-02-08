const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema(
  {
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artwork",
      required: true,
      unique: true,
      index: true
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    tagUuid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Tag", tagSchema);
