const mongoose = require("mongoose");

const companyProfileSchema = new mongoose.Schema(
  {
    companyUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    declaredUseCases: {
      type: [String],
      default: []
    },
    description: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("CompanyProfile", companyProfileSchema);
