const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
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
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    version: {
      type: Number,
      required: true,
      min: 1
    },
    aiTrainingAllowed: {
      type: String,
      required: true,
      enum: ["yes", "no", "conditional"]
    },
    allowedUseCases: {
      type: [String],
      default: []
    },
    attributionRequired: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

permissionSchema.index({ artwork: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("Permission", permissionSchema);
