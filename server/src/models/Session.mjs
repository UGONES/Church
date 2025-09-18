import { Schema, model } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true, // ensures no duplicates
    },
    userAgent: String,
    ipAddress: String,
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
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
      default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      required: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
sessionSchema.index({ userId: 1 });
sessionSchema.index({ token: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Instance methods
sessionSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

sessionSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
  return this.save();
};

// Static helper for upsert (no duplicate token crash)
sessionSchema.statics.saveOrUpdateSession = async function ({
  token,
  userId,
  userAgent,
  ipAddress,
  deviceType,
  browser,
  os,
  location,
  expiresAt,
}) {
  return this.findOneAndUpdate(
    { token },
    {
      $set: {
        userId,
        userAgent,
        ipAddress,
        deviceType,
        browser,
        os,
        location,
        isActive: true,
        lastActivity: new Date(),
        expiresAt: expiresAt || new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // default 7 days
      },
    },
    { upsert: true, new: true }
  );
};

export default model("Session", sessionSchema);
