const mongoose = require("mongoose");

const agreementSchema = new mongoose.Schema(
  {
    companyUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    companyProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfile",
      required: true,
      index: true
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artwork",
      required: true,
      index: true
    },
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
      required: true,
      index: true
    },
    permission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
      index: true
    },
    agreementText: {
      type: String,
      required: true
    },
    provider: {
      type: String,
      default: "fallback"
    },
    model: {
      type: String,
      default: "local-template"
    },
    accepted: {
      type: Boolean,
      default: false
    },
    acceptanceTimestamp: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Agreement", agreementSchema);
