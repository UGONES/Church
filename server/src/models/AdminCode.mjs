// models/AdminCode.mjs
import { Schema, model } from "mongoose";
import { randomBytes } from "crypto";

/**
 * Admin / Role Code model
 * - code: uppercase string used to elevate a user to admin/moderator
 * - role: 'admin' | 'moderator'
 * - usageCount & maxUsage allow multi-use codes
 * - assignedTo optional to record who consumed a code
 *
 * Notes:
 * - Codes are generated server-side (16 hex uppercase by default).
 * - For stronger security, you could store a hash of the code instead of the plaintext code.
 */

const adminCodeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    role: {
      type: String,
      enum: ["admin", "moderator"],
      default: "admin",
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    maxUsage: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true },
);

// Indexes for efficient lookup
adminCodeSchema.index({ code: 1, isUsed: 1, expiresAt: 1 });
adminCodeSchema.index({ createdBy: 1 });

// Auto-generate code on create if not provided
adminCodeSchema.pre("validate", function (next) {
  if (this.isNew && !this.code) {
    // 16 hex chars -> 8 bytes -> uppercased
    this.code = randomBytes(8).toString("hex").toUpperCase();
  }
  next();
});

/**
 * Validate a code: returns the adminCode document if valid and usable.
 * Caller should perform an atomic update (useCode) to increment usage.
 */
adminCodeSchema.statics.findValidByCode = function (code) {
  if (!code || typeof code !== "string") return Promise.resolve(null);
  const normalized = code.trim().toUpperCase();
  return this.findOne({
    code: normalized,
    expiresAt: { $gt: new Date() },
    $expr: { $lt: ["$usageCount", "$maxUsage"] },
  }).lean();
};

/**
 * Atomically "use" a code for a given userId.
 * Returns the updated document or null if not usable.
 */
adminCodeSchema.statics.useCode = function (code, userId) {
  const normalized = (code || "").trim().toUpperCase();
  return this.findOneAndUpdate(
    {
      code: normalized,
      expiresAt: { $gt: new Date() },
      $expr: { $lt: ["$usageCount", "$maxUsage"] },
    },
    {
      $inc: { usageCount: 1 },
      $set: {
        assignedTo: userId,
        usedAt: new Date(),
      },
      // isUsed becomes true if usageCount + 1 >= maxUsage
      $setOnInsert: {},
    },
    { new: true },
  ).then((doc) => {
    // If usageCount reached maxUsage, mark isUsed
    if (doc && doc.usageCount >= doc.maxUsage && !doc.isUsed) {
      doc.isUsed = true;
      return doc.save();
    }
    return doc;
  });
};

adminCodeSchema.methods.isExpired = function () {
  return !!this.expiresAt && this.expiresAt < new Date();
};

adminCodeSchema.methods.canBeUsed = function () {
  return !this.isUsed && !this.isExpired() && this.usageCount < this.maxUsage;
};

export default model("AdminCode", adminCodeSchema);
