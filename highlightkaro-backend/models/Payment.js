const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    plan: {
      type: String,
      enum: ["basic30", "pro99"],
      required: true,
    },

    amount: {
      type: Number,
      required: true, 
    },

    razorpayPaymentLinkId: {
      type: String,
      required: true,
      unique: true,
    },

    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "expired"],
      default: "pending",
    },

    // Metadata for security and auditing
    processedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for fast lookups

PaymentSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Payment", PaymentSchema);
