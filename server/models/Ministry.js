// models/Ministry.js
const mongoose = require('mongoose');

const ministrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  missionStatement: String,
  visionStatement: String,
  icon: {
    type: String,
    default: 'users'
  },
  imageUrl: String,
leaders: [{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: String,
  isPrimary: {
    type: Boolean,
    default: false
  }
}],
  programs: [{
    name: String,
    description: String,
    schedule: String,
    location: String
  }],
  volunteerNeeds: [{
    role: String,
    description: String,
    requirements: String,
    timeCommitment: String
  }],
  contactEmail: String,
  contactPhone: String,
  meetingSchedule: String,
  meetingLocation: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'planning'],
    default: 'active'
  },
  tags: [String],
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String
  }
}, {
  timestamps: true
});

// Indexes
ministrySchema.index({ name: 1 });
ministrySchema.index({ status: 1 });
ministrySchema.index({ tags: 1 });

module.exports = mongoose.model('Ministry', ministrySchema);