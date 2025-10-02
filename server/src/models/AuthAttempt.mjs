// models/AuthAttempt.mjs
import { Schema, model } from "mongoose";

const authAttemptSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
    attemptType: {
      type: String,
      enum: [
        "login",
        "register",
        "social_login",
        "password_reset",
        "change_password",
        "session_validation",
      ],
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["google", "facebook", null],
      default: null,
    },
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      default: "",
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

// Static helpers
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

authAttemptSchema.statics.logAttempt = function (data = {}) {
  // sanitize minimal fields
  return this.create({
    email: (data.email || "").toLowerCase(),
    ipAddress: data.ipAddress || "0.0.0.0",
    userAgent: data.userAgent || "",
    attemptType: data.attemptType || "login",
    provider: data.provider || null,
    success: !!data.success,
    reason: data.reason || "",
    metadata: data.metadata || {},
  });
};

authAttemptSchema.statics.cleanOldRecords = function (days = 30) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.deleteMany({ createdAt: { $lt: cutoff } });
};

export default model("AuthAttempt", authAttemptSchema);
