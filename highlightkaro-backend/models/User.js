const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true, 
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, 
    },

    plan: {
      type: String,
      enum: {
        values: ["free", "basic30", "pro99"],
        message: "Invalid plan value",
      },
      default: "free",
    },

    // When a paid plan lapses; null for free users
    planExpiresAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/**
 * Drop an expired paid plan back to free. Returns true if the user was changed.
 */
UserSchema.methods.expirePlanIfNeeded = async function () {
  if (this.plan !== "free" && this.planExpiresAt && this.planExpiresAt <= new Date()) {
    this.plan = "free";
    this.planExpiresAt = null;
    await this.save();
    return true;
  }
  return false;
};

/**
 * Public shape of a user returned to the frontend
 */
UserSchema.methods.toPublic = function () {
  return {
    name: this.name,
    email: this.email,
    plan: this.plan,
    planExpiresAt: this.planExpiresAt || null,
  };
};

module.exports = mongoose.model("User", UserSchema);
