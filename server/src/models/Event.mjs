import { Schema, model } from 'mongoose';

const eventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  address: {
    line: String,
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  category: {
    type: String,
    enum: ['service', 'bible-study', 'prayer', 'youth', 'children', 'men', 'women', 'fellowship', 'outreach', 'training'],
    default: 'service'
  },
  imageUrl: String,
  capacity: {
    type: Number,
    default: 0
  },
  registered: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'cancelled', 'completed'],
    default: 'draft'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: Number,
    endDate: Date
  },
  requiresRSVP: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  leaders: [{
    name: String,
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      default: ''
    },
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  tags: {
    type: [String],
    default: []
  },
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ startTime: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ requiresRSVP: 1 });

export default model('Event', eventSchema);