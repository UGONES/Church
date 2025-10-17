import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
const MIN_PASSWORD_LENGTH = Number(process.env.MIN_PASSWORD_LENGTH) || 8;
const VALID_ROLES = ["user", "admin", "moderator"];

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/; 
const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;

const userSchema = new Schema(
  {
    name: { type: String, trim: true, minlength: 2 },
    firstName: { type: String, required: true, trim: true, minlength: 2, default: "" },
    lastName: { type: String, required: true, trim: true, minlength: 2, default: "" },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, "Please enter a valid email"],
      index: true,
    },

    password: {
      type: String,
      required: function () {
        // password only required for local auth
        return this.authMethod === "local";
      },
      minlength: MIN_PASSWORD_LENGTH,
      select: false, // never return hash by default
    },

    authMethod: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },

    isActive: { type: Boolean, default: true },

    socialAuth: {
      googleId: { type: String, sparse: true, index: true },
      facebookId: { type: String, sparse: true, index: true },
    },

    emailVerified: { type: Boolean, default: false },

    verificationToken: { type: String, index: true, sparse: true, select: false },
    verificationExpires: Date,

    resetPasswordToken: { type: String, index: true, sparse: true, select: false },
    resetPasswordExpires: Date,

    role: {
      type: String,
      enum: VALID_ROLES,
      default: "user",
      set: (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
      index: true,
    },

    // store adminCode only when assigned internally; never returned
    adminCode: { type: String, select: false, default: undefined },

    avatar: { type: String, default: "" },
    coverPhoto: { type: String, default: "" },

    phone: { type: String, match: [phoneRegex, "Please enter a valid phone number"], default: "" },

    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "" },
    },

    memberSince: { type: Date, default: null },
    membershipStatus: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },

    smallGroup: { type: String, default: "" },

    familyMembers: [
      {
        name: String,
        relationship: String,
        age: Number,
      },
    ],

    communicationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      newsletter: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
      prayerUpdates: { type: Boolean, default: true },
    },

    volunteerProfile: {
      skills: { type: [String], default: [] },
      availability: {
        days: [
          {
            type: String,
            enum: [
              "sunday",
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ],
          },
        ],
        times: [
          {
            type: String,
            enum: ["morning", "afternoon", "evening"],
          },
        ],
      },
      interests: { type: [String], default: [] },
      experience: { type: String, default: "" },
    },

    volunteerStats: {
      totalHours: { type: Number, default: 0 },
      completedTrainings: { type: [String], default: [] },
      activeApplications: { type: Number, default: 0 },
    },

    lastLogin: { type: Date, default: null },
    loginCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        // Map _id to id and remove sensitive/internal fields
        ret.id = ret._id?.toString ? ret._id.toString() : ret._id;
        delete ret._id;
        delete ret.__v;

        // Remove sensitive fields if present
        delete ret.password;
        delete ret.verificationToken;
        delete ret.resetPasswordToken;
        delete ret.adminCode;

        return ret;
      },
    },
  }
);

// -------------------- Indexes --------------------
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ membershipStatus: 1 });

// -------------------- Hooks --------------------
// Enhanced password security in User model
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password') || !this.password) return next();

    // Enhanced password validation
    if (typeof this.password !== 'string' || this.password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
    }

    // Check for common passwords (basic protection)
    const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'church123'];
    if (commonPasswords.includes(this.password.toLowerCase())) {
      throw new Error('Password is too common. Please choose a stronger password.');
    }

    // Check password strength
    const strength = this.calculatePasswordStrength(this.password);
    if (strength < 3) { // 0-4 scale, 3 = good
      throw new Error('Password is too weak. Include uppercase, lowercase, numbers, and special characters.');
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Add password strength calculator
userSchema.methods.calculatePasswordStrength = function (password) {
  let strength = 0;
  
  // Length check
  if (password.length >= 12) strength += 2;
  else if (password.length >= 8) strength += 1;
  
  // Character variety
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  
  return Math.min(strength, 4);
};

// -------------------- Instance Methods --------------------
/**
 * Compare a plain-text candidate password with the stored hash.
 * Returns boolean.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Returns an object safe for public consumption (no sensitive fields).
 * Guarantees `id` field is present as a string.
 */
userSchema.methods.getPublicProfile = function () {
  const profile = {
    id: this._id?.toString ? this._id.toString() : this._id,
    name: this.name,
    firstName: this.firstName || "",
    lastName: this.lastName || "",
    email: this.email,
    role: this.role,
    avatar: this.avatar || "",
    emailVerified: Boolean(this.emailVerified),
    lastLogin: this.lastLogin || null,
    memberSince: this.memberSince || null,
    membershipStatus: this.membershipStatus || "active",
  };
  return profile;
};

/**
 * Dashboard data: merge minimal public profile + additional dashboard fields.
 */
userSchema.methods.getDashboardData = function () {
  return {
    id: this._id?.toString ? this._id.toString() : this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar || "",
    memberSince: this.memberSince || null,
    membershipStatus: this.membershipStatus || "active",
    smallGroup: this.smallGroup || "",
    familyMembers: this.familyMembers || [],
    communicationPreferences: this.communicationPreferences || {},
    volunteerStats: this.volunteerStats || {},
  };
};

userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

userSchema.methods.isModerator = function () {
  return this.role === "moderator" || this.role === "admin";
};

// -------------------- Static Helpers --------------------
/**
 * Find by email (lowercased).
 */
userSchema.statics.findByEmail = function (email) {
  if (!email || typeof email !== "string") return Promise.resolve(null);
  return this.findOne({ email: email.toLowerCase().trim() });
};

/**
 * Create local user with normalized inputs.
 * Returns saved user document.
 */
userSchema.statics.createLocalUser = async function ({ name, email, password, role = "user", extra = {} }) {
  const normalizedEmail = (email || "").toLowerCase().trim();
  const user = new this({
    name: (name || "").trim(),
    email: normalizedEmail,
    password,
    role,
    authMethod: "local",
    ...extra,
  });
  return user.save();
};

/**
 * Safely update last login info (atomic).
 */
userSchema.statics.touchLastLogin = function (userId) {
  return this.findByIdAndUpdate(userId, { $set: { lastLogin: new Date() }, $inc: { loginCount: 1 } }, { new: true }).lean();
};

// -------------------- Export --------------------
export default model("User", userSchema);
