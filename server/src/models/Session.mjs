// models/Session.mjs
import { Schema, model } from 'mongoose';

/**
 * Session model
 * - stores issued tokens (access tokens) and their activity
 * - TTL index on expiresAt ensures old sessions are removed
 *
 * Performance: lean returns for upsert helper
 */

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    userAgent: {
      type: String,
      default: 'unknown'
    },
    ipAddress: {
      type: String,
      default: '0.0.0.0'
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    browser: {
      type: String,
      default: 'unknown'
    },
    os: {
      type: String,
      default: 'unknown'
    },
    location: {
      country: {
        type: String,
        default: 'unknown'
      },
      region: {
        type: String,
        default: 'unknown'
      },
      city: {
        type: String,
        default: 'unknown'
      }
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: true
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true, minimize: true }
);

sessionSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

sessionSchema.methods.updateActivity = async function () {
  this.lastActivity = new Date();
  return this.save();
};

/**
 * Upsert session (atomic). Returns lean document.
 * - Accepts defaults for missing values
 * - Ensures token uniqueness by finding by token
 */
sessionSchema.statics.saveOrUpdateSession = async function ({
  token,
  userId,
  userAgent = 'unknown',
  ipAddress = '0.0.0.0',
  deviceType = 'unknown',
  browser = 'unknown',
  os = 'unknown',
  location = {},
  expiresAt
}) {
  const safeExpiresAt = expiresAt instanceof Date ? expiresAt : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const update = {
    $set: {
      userId,
      userAgent,
      ipAddress,
      deviceType,
      browser,
      os,
      location: {
        country: location.country || 'unknown',
        region: location.region || 'unknown',
        city: location.city || 'unknown'
      },
      isActive: true,
      lastActivity: new Date(),
      expiresAt: safeExpiresAt
    }
  };

  return this.findOneAndUpdate({ token }, update, { upsert: true, new: true, setDefaultsOnInsert: true }).lean().exec();
};

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1, isActive: 1 });

export default model('Session', sessionSchema);
