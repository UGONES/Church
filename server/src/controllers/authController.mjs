import jwt from 'jsonwebtoken';
const { sign } = jwt;
import { randomBytes } from 'crypto';
import User from '../models/User.mjs';
import Session from '../models/Session.mjs';
import AuthAttempt from '../models/AuthAttempt.mjs';
import AdminCode from '../models/AdminCode.mjs';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.mjs';
import { validationResult } from 'express-validator';

// Generate JWT token
const generateToken = (user) => {
  const normalizedRole = (user.role || "user").trim().toLowerCase();
  user.role = normalizedRole;

  return sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Register new user
export async function register(req, res) {
  try {
    console.log('=== REGISTRATION STARTED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, adminCode } = req.body;
    console.log('Processing email:', email);

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    console.log('Existing user check:', existingUser ? 'found' : 'not found');

    if (existingUser) {
      // If user exists but is a social login user, allow conversion to local auth
      if (existingUser.authMethod !== 'local') {
        existingUser.password = password;
        existingUser.authMethod = 'local';
        existingUser.name = name || existingUser.name;
        await existingUser.save();

        const token = generateToken(existingUser);

        return res.status(200).json({
          success: true,
          message: 'Account setup completed successfully. Please check your email for verification.',
          token,
          user: existingUser.getPublicProfile() ? existingUser.getPublicProfile() : null,
        });
      }
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Handle admin registration
    let role = 'user';
    let isAdminValid = false;

    if (adminCode) {
      isAdminValid = await AdminCode.validateCode(adminCode);
      if (isAdminValid) {
        role = 'admin';
      }
    }

    // Generate verification token FIRST
    console.log('Generating verification token...');
    const verificationToken = randomBytes(32).toString('hex');
    console.log('Generated token:', verificationToken);
    console.log('Token length:', verificationToken.length);

    // Create user WITH verification token
    console.log('Creating new user...');
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      authMethod: 'local',
      role,
      verificationToken: verificationToken, // SET TOKEN HERE
      verificationExpires: Date.now() + 24 * 60 * 60 * 1000 // SET EXPIRATION HERE
    });

    // Save user ONCE with all data
    await user.save();
    console.log('User saved with ID:', user._id);

    // VERIFY THE TOKEN WAS ACTUALLY SAVED
    const savedUser = await User.findById(user._id);
    console.log('Token verification - saved token:', savedUser.verificationToken);
    console.log('Token verification - match:', savedUser.verificationToken === verificationToken);
    console.log('Token verification - expiration:', savedUser.verificationExpires);

    // Use admin code if provided and valid
    if (adminCode && isAdminValid) {
      await AdminCode.useCode(adminCode, user._id);
    }

    // Send verification email
    console.log('Sending verification email...');
    await sendVerificationEmail(user.email, verificationToken);
    console.log('Verification email sent successfully');

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = generateToken(user);
    console.log('JWT token generated');

    // Create session
    console.log('Creating session...');
    const session = new Session({
      userId: user._id,
      token,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await session.save();
    console.log('Session created');

    // Log auth attempt
    console.log('Logging auth attempt...');
    await AuthAttempt.logAttempt({
      email: user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      attemptType: 'register',
      success: true
    });
    console.log('Auth attempt logged');

    console.log('=== REGISTRATION COMPLETED SUCCESSFULLY ===');
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('❌ REGISTRATION ERROR:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Login user
export async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Rate limiting
    const recentAttempts = await AuthAttempt.getRecentAttempts(
      normalizedEmail,
      req.ip,
      15
    );
    if (recentAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many login attempts. Please try again later.",
      });
    }

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      await AuthAttempt.logAttempt({
        email: normalizedEmail,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        attemptType: "login",
        success: false,
        reason: "User not found",
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Wrong auth method
    if (user.authMethod !== "local") {
      await AuthAttempt.logAttempt({
        email: normalizedEmail,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        attemptType: "login",
        success: false,
        reason: `Wrong auth method: ${user.authMethod}`,
      });
      return res.status(401).json({
        success: false,
        message: `Please use ${user.authMethod} login or reset your password`,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await AuthAttempt.logAttempt({
        email: normalizedEmail,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        attemptType: "login",
        success: false,
        reason: "Invalid password",
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Account deactivated
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    // Email not verified
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Email not verified. Please check your email for verification instructions.",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }

    // Generate JWT
    const token = generateToken(user);

    // Save/update session (no duplicate token crash)
    await Session.saveOrUpdateSession({
      token,
      userId: user._id,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
      deviceType: "",
      browser: "",
      os: "",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Update last login
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    // Log successful attempt
    await AuthAttempt.logAttempt({
      email: normalizedEmail,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      attemptType: "login",
      success: true,
    });

    // ✅ Single final response
    return res.status(201).json({
      success: true,
      message: "Login successful",
      token,
      user: user.getPublicProfile(),
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Verify email
export async function verifyEmail(req, res) {
  let cleanToken;

  try {
    console.log('=== VERIFICATION REQUEST ===');
    console.log('Token:', req.params.token);
    console.log('IP:', req.ip);
    console.log('User Agent:', req.get('User-Agent'));

    const { token } = req.params;
    cleanToken = token.trim();

    // ADD: Check if this is a duplicate request
    if (global.pendingVerifications?.has(cleanToken)) {
      console.log('⚠️ Duplicate verification request detected');
      return res.status(429).json({
        success: false,
        message: 'Verification already in progress. Please wait a moment.'
      });
    }

    // Track pending verification
    if (!global.pendingVerifications) global.pendingVerifications = new Set();
    global.pendingVerifications.add(cleanToken);

    console.log('=== VERIFICATION DEBUG START ===');
    console.log('Token received:', req.params.token);
    console.log('Token length:', req.params.token.length);
    console.log('Cleaned token:', cleanToken);
    console.log('Cleaned token length:', cleanToken.length);

    // DEBUG: Check ALL users with verification tokens first
    const allUsersWithTokens = await User.find({
      verificationToken: { $exists: true }
    }, 'email verificationToken verificationExpires');

    console.log('All users with verification tokens:', allUsersWithTokens.map(u => ({
      email: u.email,
      token: u.verificationToken,
      tokenLength: u.verificationToken ? u.verificationToken.length : 0,
      expires: u.verificationExpires,
      isExpired: u.verificationExpires && u.verificationExpires < Date.now()
    })));

    // Find user with valid token
    const user = await User.findOne({
      verificationToken: cleanToken,
      verificationExpires: { $gt: Date.now() }
    });

    console.log('User found with matching token:', user ? {
      id: user._id,
      email: user.email,
      token: user.verificationToken,
      tokenLength: user.verificationToken.length,
      expires: user.verificationExpires,
      isExpired: user.verificationExpires < Date.now()
    } : 'NO USER FOUND');

    if (!user) {
      console.log('❌ No user found with valid token');

      // Check if token exists but expired
      const expiredUser = await User.findOne({ verificationToken: cleanToken });
      if (expiredUser) {
        console.log('❌ Token exists but expired for user:', expiredUser.email);
        console.log('Expiration:', expiredUser.verificationExpires);
        console.log('Current time:', new Date());
        console.log('Time difference:', (new Date() - expiredUser.verificationExpires) / 1000 / 60, 'minutes');
      }

      // Check if token exists with different casing/encoding
      const allUsers = await User.find({});
      const similarTokenUsers = allUsers.filter(u =>
        u.verificationToken && u.verificationToken.includes(cleanToken.substring(0, 20))
      );

      if (similarTokenUsers.length > 0) {
        console.log('⚠️  Similar tokens found:', similarTokenUsers.map(u => ({
          email: u.email,
          token: u.verificationToken,
          match: u.verificationToken === cleanToken
        })));
      }

      // Remove from pending before returning
      if (global.pendingVerifications) {
        global.pendingVerifications.delete(cleanToken);
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    console.log('✅ User found, marking email as verified...');
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;

    await user.save();
    console.log('✅ Email verified successfully for user:', user.email);

    // Log successful verification
    const jwtToken = generateToken(user);

    console.log('=== VERIFICATION DEBUG END ===');

    // Remove from pending after successful completion
    if (global.pendingVerifications) {
      global.pendingVerifications.delete(cleanToken);
    }

    res.json({
      success: true,
      message: 'Email verified successfully',
      token: jwtToken,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('❌ VERIFICATION ERROR:', error.message);
    console.error('Error stack:', error.stack);

    // Clean up on error
    if (global.pendingVerifications && cleanToken) {
      global.pendingVerifications.delete(cleanToken);
    }

    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
}

// Forgot password
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail, authMethod: 'local' });
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If the email exists, password reset instructions will be sent'
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000;
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
}

// Reset password
export async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
      authMethod: 'local'
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
}

// Logout
export async function logout(req, res) {
  try {
    // Invalidate session
    await Session.findOneAndUpdate(
      { token: req.token },
      { isActive: false, loggedOutAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
}

// Get current user
export async function getCurrentUser(req, res) {
  try {
    res.json({
      success: true,
      user: req.user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user data'
    });
  }
}

// Resend verification email
export async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail, authMethod: 'local' });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resending verification email'
    });
  }
}