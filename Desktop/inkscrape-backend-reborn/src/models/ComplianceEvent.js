const mongoose = require("mongoose");

const complianceEventSchema = new mongoose.Schema(
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
      default: null,
      index: true
    },
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
      default: null,
      index: true
    },
    permission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      default: null,
      index: true
    },
    agreement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agreement",
      default: null,
      index: true
    },
    securityTag: {
      type: String,
      default: null
    },
    sourceType: {
      type: String,
      enum: ["individual", "zip"],
      required: true
    },
    sourceName: {
      type: String,
      required: true
    },
    fileHash: {
      type: String,
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: ["compliance", "similarity"],
      default: "compliance",
      index: true
    },
    outcome: {
      type: String,
      enum: ["allowed", "conditional", "restricted"],
      default: null,
      index: true
    },
    reason: {
      type: String,
      required: true
    },
    companyDeclaredUseCases: {
      type: [String],
      default: []
    },
    similarityFinding: {
      category: {
        type: String,
        enum: ["work_at_risk", "may_be_at_risk"],
        default: null
      },
      datasetPHash: {
        type: String,
        default: null
      },
      bits: {
        type: Number,
        default: null
      },
      prefix: {
        type: String,
        default: null
      },
      topMatches: {
        type: [
          {
            artworkId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Artwork",
              default: null
            },
            securityTag: {
              type: String,
              default: null
            },
            similarityPercent: {
              type: Number,
              default: null
            },
            similarityBand: {
              type: String,
              enum: ["work_at_risk", "may_be_at_risk"],
              default: null
            }
          }
        ],
        default: []
      }
    },
    scannedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ComplianceEvent", complianceEventSchema);
