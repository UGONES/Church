const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    userAgent: String,
    ipAddress: String,
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
    },
    browser: String,
    os: String,
    location: {
      country: String,
      region: String,
      city: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
sessionSchema.index({ userId: 1 });
sessionSchema.index({ token: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
sessionSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

sessionSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
  return this.save();
};

module.exports = mongoose.model("Session", SessionSchema);
