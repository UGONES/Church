// models/Ministry.mjs
import { Schema, model } from 'mongoose';

const ministrySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Ministry name is required'],
    trim: true,
    maxLength: [100, 'Ministry name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Ministry description is required'],
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },
  missionStatement: {
    type: String,
    maxLength: [500, 'Mission statement cannot exceed 500 characters']
  },
  visionStatement: {
    type: String,
    maxLength: [500, 'Vision statement cannot exceed 500 characters']
  },
  icon: {
    type: String,
    default: 'users',
    enum: ['users', 'heart', 'book', 'music', 'pray', 'hands', 'star', 'cross']
  },
  imageUrl: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^https?:\/\/.+\..+/.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  leaders: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true,
      trim: true,
      maxLength: [50, 'Role cannot exceed 50 characters']
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  programs: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: [100, 'Program name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: true,
      maxLength: [500, 'Program description cannot exceed 500 characters']
    },
    schedule: {
      type: String,
      required: true,
      maxLength: [100, 'Schedule cannot exceed 100 characters']
    },
    location: {
      type: String,
      required: true,
      maxLength: [100, 'Location cannot exceed 100 characters']
    }
  }],
  volunteerNeeds: [{
    role: {
      type: String,
      required: true,
      trim: true,
      maxLength: [100, 'Role cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: true,
      maxLength: [500, 'Description cannot exceed 500 characters']
    },
    requirements: {
      type: String,
      maxLength: [500, 'Requirements cannot exceed 500 characters']
    },
    timeCommitment: {
      type: String,
      required: true,
      maxLength: [100, 'Time commitment cannot exceed 100 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  contactEmail: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  contactPhone: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^[\+]?[1-9][\d]{0,15}$/.test(v.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please provide a valid phone number'
    }
  },
  meetingSchedule: {
    type: String,
    maxLength: [200, 'Meeting schedule cannot exceed 200 characters']
  },
  meetingLocation: {
    type: String,
    maxLength: [200, 'Meeting location cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'planning'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: [50, 'Tag cannot exceed 50 characters']
  }],
  socialMedia: {
    facebook: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?facebook\.com\/.+/.test(v);
        },
        message: 'Please provide a valid Facebook URL'
      }
    },
    instagram: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?instagram\.com\/.+/.test(v);
        },
        message: 'Please provide a valid Instagram URL'
      }
    },
    twitter: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?twitter\.com\/.+/.test(v);
        },
        message: 'Please provide a valid Twitter URL'
      }
    },
    youtube: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?youtube\.com\/.+/.test(v);
        },
        message: 'Please provide a valid YouTube URL'
      }
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ministrySchema.index({ name: 1 });
ministrySchema.index({ status: 1 });
ministrySchema.index({ tags: 1 });
ministrySchema.index({ 'leaders.user': 1 });
ministrySchema.index({ createdAt: -1 });

// Virtual for active volunteer needs
ministrySchema.virtual('activeVolunteerNeeds').get(function () {
  return this.volunteerNeeds.filter(need => need.isActive);
});

// Method to check if user is a leader
ministrySchema.methods.isLeader = function (userId) {
  return this.leaders.some(leader => leader.user.toString() === userId.toString());
};

// Static method to get ministries by status
ministrySchema.statics.findByStatus = function (status) {
  return this.find({ status }).populate('leaders.user', 'name email avatar');
};

// Static method to get ministries by tags
ministrySchema.statics.findByTags = function (tags) {
  return this.find({ tags: { $in: tags } });
};

export default model('Ministry', ministrySchema);