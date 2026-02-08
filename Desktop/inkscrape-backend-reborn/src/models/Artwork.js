const mongoose = require("mongoose");

const artworkSchema = new mongoose.Schema(
  {
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      default: "application/octet-stream"
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0
    },
    sha256Hash: {
      type: String,
      required: true,
      index: true
    },
    perceptualHash: {
      value: {
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
      algo: {
        type: String,
        default: null
      },
      version: {
        type: Number,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

artworkSchema.index({
  "perceptualHash.prefix": 1,
  "perceptualHash.version": 1,
  "perceptualHash.bits": 1
});

module.exports = mongoose.model("Artwork", artworkSchema);
