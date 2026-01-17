const mongoose = require("mongoose");

const ExportLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    exportedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient daily count queries
ExportLogSchema.index({ userId: 1, exportedAt: 1 });

module.exports = mongoose.model("ExportLog", ExportLogSchema);
