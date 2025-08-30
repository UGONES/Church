// models/PrayerRequest.js
const mongoose = require('mongoose');

const prayerRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  request: {
    type: String,
    required: true,
    trim: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: String,
  prayerCount: {
    type: Number,
    default: 0
  },
  prayedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    prayedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notifyOnPray: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'answered', 'rejected'],
    default: 'pending'
  },
  category: {
    type: String,
    enum: ['healing', 'guidance', 'financial', 'relationship', 'thanksgiving', 'other'],
    default: 'other'
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'critical'],
    default: 'normal'
  },
  answeredAt: Date,
  answerDetails: String,
  allowSharing: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
prayerRequestSchema.index({ userId: 1 });
prayerRequestSchema.index({ status: 1 });
prayerRequestSchema.index({ category: 1 });
prayerRequestSchema.index({ createdAt: -1 });
prayerRequestSchema.index({ isPrivate: 1 });

module.exports = mongoose.model('PrayerRequest', prayerRequestSchema);