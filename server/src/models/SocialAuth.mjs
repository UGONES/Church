import { Schema, model } from 'mongoose';

const socialAuthSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    enum: ['google', 'facebook'],
    required: true
  },
  providerId: {
    type: String,
    required: true
  },
  accessToken: String,
  refreshToken: String,
  profile: {
    type: Map,
    of: Schema.Types.Mixed
  },
  expiresAt: Date,
  scopes: [String],
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index
socialAuthSchema.index({ provider: 1, providerId: 1 }, { unique: true });
socialAuthSchema.index({ userId: 1 });

// Static methods
socialAuthSchema.statics.findByProviderId = function(provider, providerId) {
  return this.findOne({ provider, providerId });
};

socialAuthSchema.statics.findByUserId = function(userId, provider = null) {
  const query = { userId };
  if (provider) query.provider = provider;
  return this.find(query);
};

// Instance methods
socialAuthSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

socialAuthSchema.methods.updateUsage = function() {
  this.lastUsed = new Date();
  return this.save();
};

export default model('SocialAuth', socialAuthSchema);