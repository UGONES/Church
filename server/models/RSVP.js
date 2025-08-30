// models/RSVP.js
const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'waiting', 'cancelled'],
    default: 'confirmed'
  },
  guests: {
    type: Number,
    default: 1,
    min: 1
  },
  guestNames: [String],
  dietaryRestrictions: String,
  specialRequests: String,
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: Date,
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: Date
}, {
  timestamps: true
});

// Compound index to ensure a user can only RSVP once per event
rsvpSchema.index({ userId: 1, eventId: 1 }, { unique: true });

// Index for querying by event
rsvpSchema.index({ eventId: 1, status: 1 });

module.exports = mongoose.model('RSVP', rsvpSchema);