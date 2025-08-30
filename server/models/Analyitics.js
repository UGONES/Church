// models/Analytics.js
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['pageview', 'donation', 'event', 'sermon', 'prayer', 'testimonial', 'user'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: String,
  userAgent: String,
  referrer: String,
  country: String,
  region: String,
  city: String,
  deviceType: {
    type: String,
    enum: ['desktop', 'tablet', 'mobile', 'other']
  },
  browser: String,
  os: String,
  duration: Number, // in seconds
  conversionValue: Number
}, {
  timestamps: true
});

// Indexes
analyticsSchema.index({ type: 1, createdAt: 1 });
analyticsSchema.index({ itemId: 1, type: 1 });
analyticsSchema.index({ userId: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);