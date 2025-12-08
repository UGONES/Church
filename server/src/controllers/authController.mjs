import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/User.mjs";
import Session from "../models/Session.mjs";
import AuthAttempt from "../models/AuthAttempt.mjs";
import AdminCode from "../models/AdminCode.mjs";
import tokenUtils from "../utils/generateToken.mjs";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/emailService.mjs";

const { generateAuthToken, generateRandomToken } = tokenUtils;

const normalizeEmail = (e = "") => (e || "").trim().toLowerCase();

/**
 * Register
 * - If adminCode provided, validate it and store a pointer (don't give privilege yet)
 */
export async function register(req, res) {
  console.log("➡️ Registration Init");
  try {
    const errors = validationResult(req);
    console.log("🔎 Validation errors:", errors.array());
    if (!errors.isEmpty()) {
      console.log("❌ Validation failed, stopping here");
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { firstName, lastName, email, password, adminCode } = req.body;
    console.log("📥 Incoming register payload:", {
      firstName,
      lastName,
      email,
      hasPassword: !!password,
      adminCode,
    });

    const normalizedEmail = normalizeEmail(email);
    console.log("📧 Normalized email:", normalizedEmail);

    // Rate limiting - keep conservative to avoid spam (adjust as needed)
    const recentRegistrations = await AuthAttempt.countDocuments({
      ipAddress: req.ip,
      attemptType: "register",
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });
    console.log("📊 Recent registrations from this IP:", recentRegistrations);

    if (recentRegistrations >= 50) {
      console.log("⛔ Too many registrations, blocking");
      return res.status(429).json({
        success: false,
        message: "Too many registration attempts. Please try again later.",
      });
    }

    // Check existing user (email OR social IDs)
    const query = [{ email: normalizedEmail }];
    if (req.body.googleId) {
      query.push({ "socialAuth.googleId": req.body.googleId });
    }
    if (req.body.facebookId) {
      query.push({ "socialAuth.facebookId": req.body.facebookId });
    }

    console.log("🔍 Query object:", { $or: query });
    const existing = await User.findOne({ $or: query });
    console.log("📄 Existing user doc:", existing ? existing.email : null);

    if (existing) {
      if (existing.authMethod !== "local") {
        console.log("🔄 Converting social account to local");
        await AuthAttempt.logAttempt({
          email: normalizedEmail,
          ipAddress: req.ip,
          attemptType: "register",
          success: false,
          reason: "User already exists (social)",
        });

        existing.password = password;
        existing.authMethod = "local";
        existing.name =
          existing.name ||
          `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim();
        await existing.save();

        console.log("🛠 Saving converted account, will hash password...");

        const token = generateAuthToken(existing._id.toString(), {
          email: existing.email,
          role: existing.role,
          name: existing.name,
          emailVerified: existing.emailVerified,
        });
        console.log("✅ Converted social → local, returning token");
        return res.status(200).json({
          success: true,
          message: "Account converted to local",
          token,
          user: existing.getPublicProfile(),
        });
      }

      console.log("❌ User already exists as local");
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    // Build user record (ensure name present if model requires it)
    const name =
      `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim();
    const user = new User({
      firstName: firstName?.trim() || "",
      lastName: lastName?.trim() || "",
      name: name || undefined,
      email: normalizedEmail,
      password,
      authMethod: "local",
      role: "user",
    });

    // Admin code handling (store only)
    if (adminCode) {
      const normalizedCode = adminCode.toString().trim().toUpperCase();
      console.log("🔑 Admin code provided:", normalizedCode);

      // ✅ Use correct static method
      const codeDoc = await AdminCode.findValidByCode(normalizedCode);

      if (codeDoc) {
        console.log("✅ Valid code found in DB:", codeDoc);

        // Assign role from codeDoc.role (safer than guessing from prefix)
        user.role =
          codeDoc.role ||
          (normalizedCode.startsWith("MODCODE") ? "moderator" : "admin");

        user.adminCode = normalizedCode;

        // ⚠️ Save user first to generate a real _id
        await user.save();

        // Now atomically consume the code
        // await AdminCode.useCode(normalizedCode, user._id);

        console.log(
          `🎉 User promoted to ${user.role} using code ${normalizedCode}`,
        );
      } else {
        console.warn("⚠️ Invalid or expired code:", normalizedCode);
        await user.save();
      }
    } else {
      await user.save();
    }

    // Create verification token: a JWT which includes id + email
    const verificationToken = jwt.sign(
      { id: user._id?.toString(), email: normalizedEmail },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
    user.verificationToken = verificationToken;
    user.verificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    console.log("📨 Generated verification token (JWT)");

    await user.save();
    console.log("💾 User saved:", user._id.toString(), "Role:", user.role);

    // Send verification email (fire-and-forget, but log outcome)
    try {
      await sendVerificationEmail(user.email, verificationToken);
      console.log("📧 Verification email sent to:", user.email);
    } catch (err) {
      console.error("📛 Email sending failed", err);
    }

    const responseUser = user.getPublicProfile
      ? user.getPublicProfile()
      : { id: user._id.toString(), email: user.email, role: user.role };
    console.log("📤 Public profile prepared:", responseUser);

    // Log registration attempt
    await AuthAttempt.logAttempt({
      email: normalizedEmail,
      ipAddress: req.ip,
      attemptType: "register",
      success: true,
      userAgent: req.get("User-Agent"),
    });
    console.log("📝 Registration attempt logged");

    // Create session token for immediate session (still requires email verification)
    const sessionToken = generateAuthToken(user._id.toString(), {
      email: user.email,
      role: user.role,
      name: user.name,
      emailVerified: user.emailVerified,
    });
    console.log("🔑 Generated session JWT token");

    await Session.saveOrUpdateSession({
      token: sessionToken,
      userId: user._id,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });
    console.log("💾 Session created/updated");

    return res.status(201).json({
      success: true,
      message: "Registered; verify email",
      token: sessionToken,
      user: responseUser,
    });
  } catch (err) {
    console.error("💥 Register error", err);
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }
    await AuthAttempt.logAttempt({
      email: req.body?.email || "unknown",
      ipAddress: req.ip,
      attemptType: "register",
      success: false,
      reason: "Server error",
    }).catch(() => {});
    return res.status(500).json({
      success: false,
      message: "Registration failed due to server error",
    });
  }
}

/**
 * Claim an admin code (for verified users who want to claim a role after verification)
 * - This endpoint allows secure server-side claiming rather than trusting query params
 */
export async function claimAdminCode(req, res) {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ success: false, message: "Code required" });
    }

    // Find valid code
    const valid = await AdminCode.findOne({
      code: code.trim().toUpperCase(),
      expiresAt: { $gt: new Date() },
      $expr: { $lt: ["$usageCount", "$maxUsage"] },
    });

    if (!valid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired code" });
    }

    // Use code atomically
    const used = await AdminCode.useCode(valid.code, userId);
    if (!used) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to use code" });
    }

    // promote user role accordingly
    const role = used.role || "admin";
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { role } },
      { new: true },
    ).select("-password -__v");

    return res.json({
      success: true,
      message: `Promoted to ${role}`,
      user: updatedUser.getPublicProfile(),
    });
  } catch (err) {
    console.error("Claim admin code error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Verify email
 * - If user had a stored adminCode and a matching AdminCode is still valid, consume it and promote role atomically.
 * - Always mark emailVerified true, clear verification tokens.
 */
export async function verifyEmail(req, res) {
  console.log("➡️ Verify email init");
  try {
    const { token } = req.params;
    if (!token || typeof token !== "string") {
      console.log("❌ Missing token param");
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token.trim(), process.env.JWT_SECRET);
      console.log("🔓 JWT decoded:", decoded);
    } catch (err) {
      console.error("❌ JWT verification failed:", err.message);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    // find user with token and not expired (token must match stored token)
    const user = await User.findOne({
      _id: decoded.id,
      verificationToken: token.trim(),
      verificationExpires: { $gt: Date.now() },
    });
    console.log("👤 User found for verification:", !!user);
    if (!user) {
      console.warn(
        "⚠️ No user matched the provided token / token expired or mismatched",
      );
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // If adminCode was stored, try to consume it (atomic model method expected)
    let promotedRole = null;
    if (user.adminCode) {
      try {
        const used = await AdminCode.useCode(user.adminCode, user._id);
        console.log("🔧 AdminCode.useCode result:", !!used);
        if (used && used.canBeUsed === undefined) {
        }
        if (used && (used.role === "admin" || used.role === "moderator")) {
          user.role = used.role;
          promotedRole = used.role;
          console.log(`🎉 User promoted to ${used.role}`);
        }
      } catch (err) {
        console.error("⚠️ AdminCode.consume error (non fatal):", err);
      }
    }

    // Mark verified
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    if (!user.memberSince) user.memberSince = new Date();
    await user.save();
    console.log("✅ Email verified for:", user.email);

    // issue a new JWT reflecting updated role & emailVerified
    const newToken = generateAuthToken(user._id.toString(), {
      email: user.email,
      role: user.role,
      name: user.name,
      emailVerified: user.emailVerified,
    });
    console.log("🎟 New session token issued");

    return res.json({
      success: true,
      message: "Email verified",
      token: newToken,
      user: user.getPublicProfile
        ? user.getPublicProfile()
        : { id: user._id.toString(), email: user.email },
      promotedRole,
    });
  } catch (err) {
    console.error("💥 Verify email error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error during verification" });
  }
}

/**
 * Login / logout / forgot / reset / resend verification / me
 * - Login issues JWT with { userId, email, role }
 */
export async function login(req, res) {
  console.log("➡️ Start login");
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );
    console.log("🔍 User found:", !!user);
    if (!user || user.authMethod !== "local") {
      await AuthAttempt.logAttempt({
        email: normalizedEmail,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        attemptType: "login",
        success: false,
        reason: "User not found or wrong method",
      });
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    console.log("🛠 Stored hash exists:", !!user.password);

    const match = await user.comparePassword(password);
    console.log("🔑 Password match:", match);
    if (!match) {
      await AuthAttempt.logAttempt({
        email: normalizedEmail,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        attemptType: "login",
        success: false,
        reason: "Invalid password",
      });
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Account deactivated" });
    }
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email first",
        email: user.email,
      });
    }

    const token = generateAuthToken(user._id.toString(), {
      email: user.email,
      role: user.role,
      name: user.name,
      emailVerified: user.emailVerified,
    });
    console.log("🎟 Token generated");

    await Session.saveOrUpdateSession({
      token,
      userId: user._id,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });
    console.log("💾 Session saved");

    await User.findByIdAndUpdate(user._id, {
      $set: { lastLogin: new Date() },
      $inc: { loginCount: 1 },
    });
    console.log("📊 User updated");

    await AuthAttempt.logAttempt({
      email: normalizedEmail,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      attemptType: "login",
      success: true,
    });
    console.log("📝 Attempt logged");

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        ...user.getPublicProfile(),
        ...user.getDashboardData(),
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function logout(req, res) {
  try {
    // Extract token from request (middleware should already set req.token, but fallback)
    const token =
      req.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "No token provided for logout" });
    }

    const session = await Session.findOneAndUpdate(
      { token, isActive: true },
      { isActive: false, loggedOutAt: new Date() },
      { new: true },
    );

    if (!session) {
      console.warn("⚠️ Logout attempted with invalid or expired token:", token);
      return res.status(200).json({
        success: true,
        message: "Already logged out or session not found",
      });
    }

    console.log(
      `✅ User ${session.userId} logged out at ${session.loggedOutAt}`,
    );
    return res.json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("❌ Logout error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error during logout" });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
      email: normalizedEmail,
      authMethod: "local",
    });
    if (!user) {
      return res.json({
        success: true,
        message: "If the email exists, reset instructions will be sent",
      });
    }

    const resetToken = generateRandomToken(32);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);
    console.log("📧 Pssword reset sent to email");
    return res.json({
      success: true,
      message: "Password reset instructions sent",
    });
  } catch (err) {
    console.error("💥 Forgot password error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function resetPassword(req, res) {
  console.log("➡️ Reset password init");
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
      authMethod: "local",
    });
    console.log("👤 User found for reset:", !!user);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    console.log("✅ Password updated");

    return res.json({ success: true, message: "Password reset" });
  } catch (err) {
    console.error("💥 Reset password error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function resendVerification(req, res) {
  console.log("➡️ Resend verification init");
  try {
    const { email } = req.body;
    console.log("📧 Resend request for:", email);
    const normalizedEmail = normalizeEmail(email);
    console.log("📧 Normalized:", normalizedEmail);

    const user = await User.findOne({
      email: normalizedEmail,
      authMethod: "local",
    });
    console.log("👤 Resend target user:", !!user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.emailVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Already verified" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: normalizedEmail },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
    user.verificationToken = token;
    user.verificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();
    console.log("📨 New verification token saved");

    await sendVerificationEmail(user.email, token);
    console.log("📧 Verification email resent");

    return res.json({ success: true, message: "✅ Verification email resent" });
  } catch (err) {
    console.error("💥 Resend verification error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function getCurrentUser(req, res) {
  try {
    // req.user provided by auth middleware
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const userProfile =
      typeof req.user.getPublicProfile === "function"
        ? req.user.getPublicProfile()
        : {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role || "user",
            avatar: req.user.avatar || "",
          };

    const responseUser = {
      ...userProfile,
      isLoggedIn: true,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      message: "Authenticated user fetched successfully",
      user: responseUser,
    });
  } catch (err) {
    console.error("Get current user error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
