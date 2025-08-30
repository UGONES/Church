const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.isSocialLogin; // Password not required for social logins
    }
  },
  
  // Authentication
  isSocialLogin: {
    type: Boolean,
    default: false
  },
  socialAuth: {
    googleId: String,
    facebookId: String
  },
  
  // Verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationExpires: Date,
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Roles and permissions
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  adminCode: String, // For admin registration
  
  // Profile
  avatar: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  
  // Preferences
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false }
  },
  
  // Timestamps
  lastLogin: Date,
  loginCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'socialAuth.googleId': 1 });
userSchema.index({ 'socialAuth.facebookId': 1 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, city, state, zipCode } = this.address;
  return `${street}, ${city}, ${state} ${zipCode}`.trim();
});

// Remove sensitive information when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  delete user.adminCode;
  return user;
};

module.exports = mongoose.model('User', userSchema);