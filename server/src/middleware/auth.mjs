// middleware/auth.mjs
import { verifyAuthToken } from "../utils/generateToken.mjs";
import User from "../models/User.mjs";
import Session from "../models/Session.mjs";
import AuthAttempt from "../models/AuthAttempt.mjs";

/**
 * Strict auth middleware
 * - requires header: Authorization: Bearer <token>
 * - verifies token signature & expiry
 * - checks session active & not expired
 * - attaches req.user, req.token, req.session
 */

export const auth = async (req, res, next) => {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No valid token provided.",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return res.status(401).json({ success: false, message: "Empty token" });
    }

    let decoded;
    try {
      decoded = verifyAuthToken(token);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // Check for brute force attempts
    const recentAttempts = await AuthAttempt.countDocuments({
      ipAddress: req.ip,
      createdAt: { $gte: new Date(Date.now() - LOCKOUT_TIME) },
      success: false,
    });

    if (recentAttempts >= MAX_LOGIN_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please try again later.",
      });
    }

    const session = await Session.findOne({
      token,
      userId: decoded.userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).lean();
    if (!session) {
      await AuthAttempt.logAttempt({
        email: decoded?.email || req.user?.email || "system@internal",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        attemptType: "session_validation", // make sure schema supports this
        success: false,
        reason: "Invalid or expired session",
      });
      return res
        .status(401)
        .json({ success: false, message: "Session expired or invalid" });
    }
    const user = await User.findById(decoded.userId)
      .select(
        "-password -verificationToken -resetPasswordToken -adminCode -__v",
      )
      .lean();
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Account deactivated" });
    }

    if (user.authMethod === "local" && !user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email first",
        email: user.email,
      });
    }

    req.user = user;
    req.token = token;
    req.session = session;

    // update lastActivity async (do not block)
    Session.updateOne(
      { _id: session._id },
      { $set: { lastActivity: new Date() } },
    ).catch(() => {});

    // Log successful attempt
    await AuthAttempt.logAttempt({
      email: user.email,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      attemptType: "session_validation",
      success: true,
    });

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(401).json({ success: false, message: "Authentication failed" });

    await AuthAttempt.logAttempt({
      email: req.user?.email || "system@internal",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      attemptType: "session_validation",
      success: false,
      reason: "Server error during authentication",
    }).catch(() => {});

    return res.status(500).json({
      success: false,
      message: "Authentication failed due to server error",
    });
  }
};

/**
 * Optional auth: attach user if token valid; otherwise continue silently
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return next();

    let decoded;
    try {
      decoded = verifyAuthToken(token);
    } catch {
      return next();
    }

    const user = await User.findById(decoded.userId)
      .select("-password -__v")
      .lean();
    if (user && user.isActive) {
      req.user = user;
      req.token = token;
      const session = await Session.findOne({
        token,
        userId: decoded.userId,
        isActive: true,
      }).lean();
      if (session) {
        req.session = session;
        Session.updateOne(
          { _id: session._id },
          { $set: { lastActivity: new Date() } },
        ).catch(() => {});
      }
    }
    next();
  } catch (err) {
    console.error("Optional auth error:", err);
    next();
  }
};
