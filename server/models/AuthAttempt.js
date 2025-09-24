const mongoose = require("mongoose");

const authAttemptSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: String,
    attemptType: {
      type: String,
      enum: ["login", "register", "social_login", "password_reset"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["google", "facebook", null],
      default: null,
    },
    success: {
      type: Boolean,
      required: true,
    },
    reason: String,
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
authAttemptSchema.index({ email: 1 });
authAttemptSchema.index({ ipAddress: 1 });
authAttemptSchema.index({ createdAt: 1 });
authAttemptSchema.index({ attemptType: 1 });

// Static methods for rate limiting
authAttemptSchema.statics.getRecentAttempts = function (
  email,
  ipAddress,
  minutes = 15,
) {
  const timeAgo = new Date(Date.now() - minutes * 60 * 1000);

  return this.countDocuments({
    $or: [{ email }, { ipAddress }],
    createdAt: { $gte: timeAgo },
    success: false,
  });
};

authAttemptSchema.statics.logAttempt = function (data) {
  return this.create(data);
};

// Static method to clean old records
authAttemptSchema.statics.cleanOldRecords = function (days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.deleteMany({ createdAt: { $lt: cutoffDate } });
};

module.exports = mongoose.model("AuthAttempt", authAttemptSchema);
