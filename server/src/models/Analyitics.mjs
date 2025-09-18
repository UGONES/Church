// models/Analytics.js
import { Schema, model } from 'mongoose';

const analyticsSchema = new Schema({
  type: {
    type: String,
    enum: ['pageview', 'donation', 'event', 'sermon', 'prayer', 'testimonial', 'user'],
    required: true
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
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

export default model('Analytics', analyticsSchema);