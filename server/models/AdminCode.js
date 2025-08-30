// models/AdminCode.js - UPDATED
const mongoose = require('mongoose');
const crypto = require('crypto');

const adminCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  role: {
    type: String,
    enum: ['admin', 'moderator'],
    default: 'admin'
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: Date,
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  },
  usageCount: {
    type: Number,
    default: 0
  },
  maxUsage: {
    type: Number,
    default: 1 // Default to single use
  }
}, {
  timestamps: true
});

// Index for efficient lookup
adminCodeSchema.index({ code: 1, isUsed: 1, expiresAt: 1 });

// Pre-save hook to generate code
adminCodeSchema.pre('save', function(next) {
  if (this.isNew && !this.code) {
    this.code = crypto.randomBytes(8).toString('hex').toUpperCase();
  }
  next();
});

// Static methods
adminCodeSchema.statics.validateCode = async function(code) {
  const adminCode = await this.findOne({ 
    code, 
    isUsed: false,
    expiresAt: { $gt: new Date() },
    $expr: { $lt: ['$usageCount', '$maxUsage'] } // Check if usage count is less than max usage
  });
  
  return !!adminCode;
};

adminCodeSchema.statics.useCode = async function(code, userId) {
  return this.findOneAndUpdate(
    { 
      code, 
      isUsed: false, 
      expiresAt: { $gt: new Date() },
      $expr: { $lt: ['$usageCount', '$maxUsage'] }
    },
    { 
      $inc: { usageCount: 1 },
      $set: { 
        assignedTo: userId,
        usedAt: new Date(),
        isUsed: { $gte: ['$usageCount', '$maxUsage'] } // Set isUsed if usageCount reaches maxUsage
      }
    },
    { new: true }
  );
};

// Instance methods
adminCodeSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

adminCodeSchema.methods.canBeUsed = function() {
  return !this.isUsed && !this.isExpired() && this.usageCount < this.maxUsage;
};

module.exports = mongoose.model('AdminCode', adminCodeSchema);