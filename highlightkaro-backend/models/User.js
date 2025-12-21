const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    plan: {
      type: String,
      enum: ["free", "basic19", "pro99"],
      default: "free",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
