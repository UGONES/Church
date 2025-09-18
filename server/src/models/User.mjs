import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
const { genSalt, hash, compare } = bcrypt;

const userSchema = new Schema({
  // Basic information
  name: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function () {
      return this.authMethod === 'local';
    },
    minlength: 6
  },

  // Authentication method
  authMethod: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Social authentication
  socialAuth: {
    googleId: { type: String, sparse: true },
    facebookId: { type: String, sparse: true }
  },

  // Verification
  emailVerified: {
    type: Boolean,
    default: false
  },

  verificationToken: {
    type: String,
    index: true,
    sparse: true
  },

  verificationExpires: Date,

  // Password reset
  resetPasswordToken: {
    type: String,
    index: true,
    sparse: true
  },

  resetPasswordExpires: Date,

  // Roles and permissions
  role: {
    type: String,
    enum: ["user", "admin", "moderator"],
    default: "user",
    set: v => v.trim().toLowerCase()
  },
  adminCode: String,

  // Profile
  avatar: String,
  phone: {
    type: String,
    match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  // Church membership
  memberSince: Date,
  membershipStatus: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  smallGroup: String,
  familyMembers: [{
    name: String,
    relationship: String,
    age: Number
  }],

  // Communication preferences
  communicationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    newsletter: { type: Boolean, default: true },
    eventReminders: { type: Boolean, default: true },
    prayerUpdates: { type: Boolean, default: true }
  },

  // Volunteer preferences
  volunteerProfile: {
    skills: [String],
    availability: {
      days: [{
        type: String,
        enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      }],
      times: [{
        type: String,
        enum: ['morning', 'afternoon', 'evening']
      }]
    },
    interests: [String],
    experience: String
  },
  
  // Volunteer stats
  volunteerStats: {
    totalHours: { type: Number, default: 0 },
    completedTrainings: [String],
    activeApplications: { type: Number, default: 0 }
  },

  // Timestamps
  lastLogin: Date,
  loginCount: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.verificationToken;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.adminCode;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'socialAuth.googleId': 1 }, { sparse: true });
userSchema.index({ 'socialAuth.facebookId': 1 }, { sparse: true });
userSchema.index({ verificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ authMethod: 1 });
userSchema.index({ role: 1 });
userSchema.index({ membershipStatus: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await genSalt(12);
    this.password = await hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await compare(candidatePassword, this.password);
};

// Check if user is admin
userSchema.methods.isAdmin = function () {
  return this.role === 'admin';
};

// Check if user is moderator
userSchema.methods.isModerator = function () {
  return this.role === 'moderator' || this.role === 'admin';
};

//  Check if user is User
userSchema.methods.isUser = function () {
  return this.role === 'user';
};

// Virtual for full address
userSchema.virtual('fullAddress').get(function () {
  if (!this.address) return '';
  const { street, city, state, zipCode, country } = this.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(', ');
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.name;
});

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    name: this.name,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    emailVerified: this.emailVerified,
    lastLogin: this.lastLogin,
    memberSince: this.memberSince,
    membershipStatus: this.membershipStatus
  };
};

// Method to get dashboard data
userSchema.methods.getDashboardData = function () {
  return {
    _id: this._id,
    name: this.name,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    memberSince: this.memberSince,
    membershipStatus: this.membershipStatus,
    smallGroup: this.smallGroup,
    familyMembers: this.familyMembers,
    communicationPreferences: this.communicationPreferences,
    volunteerStats: this.volunteerStats
  };
};

export default model('User', userSchema);