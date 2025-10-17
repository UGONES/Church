// middleware/auth.mjs
import  connectDB  from "../config/db.mjs";
import { verifyAuthToken } from "../utils/generateToken.mjs";
import User from "../models/User.mjs";
import Session from "../models/Session.mjs";
import AuthAttempt from "../models/AuthAttempt.mjs";

// --- Small helper to ensure DB is connected before queries ---

export const auth = async (req, res, next) => {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_TIME = 15 * 60 * 1000; // 15 min

  try {
    await connectDB(); // ✅ Prevent Mongoose buffering timeout

    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Access denied. No valid token provided.", });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token)
      return res.status(401).json({ success: false, message: "Empty token" });

    let decoded;
    try {
      decoded = verifyAuthToken(token);
    } catch {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // --- Brute Force Protection ---
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

    // --- Validate Session ---
    const session = await Session.findOne({
      token,
      userId: decoded.userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!session) {
      await AuthAttempt.logAttempt({
        email: decoded?.email || "system@internal",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        attemptType: "session_validation",
        success: false,
        reason: "Invalid or expired session",
      }).catch(() => { });
      return res
        .status(401)
        .json({ success: false, message: "Session expired or invalid" });
    }

    // --- Validate User ---
    const user = await User.findById(decoded.userId)
      .select("-password -verificationToken -resetPasswordToken -adminCode -__v")

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
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

    // --- Attach session + user to request ---
    req.user = user;
    req.token = token;
    req.session = session;

    console.log(`✅ Authenticated user: ${user._id} (${user.role})`);


    // --- Update last activity asynchronously ---
    Session.updateOne({ _id: session._id }, { $set: { lastActivity: new Date() } }).catch(() => { });
    AuthAttempt.logAttempt({ email: user.email, ipAddress: req.ip, userAgent: req.get("User-Agent"), attemptType: "session_validation", success: true, }).catch(() => { });

    return next(); // ✅ Always return here

  } catch (err) {
    console.error("Auth middleware error:", err);

    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Authentication failed." });
    }

    AuthAttempt.logAttempt({ email: req.user?.email || "system@internal", ipAddress: req.ip, userAgent: req.get("User-Agent"), attemptType: "session_validation", success: false, reason: "Server error during authentication", }).catch(() => { });
  }
};

// Optional Auth Middleware
export const optionalAuth = async (req, res, next) => {
  try {
    await connectDB(); // ✅ same fix

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

    const user = await User.findById(decoded.userId).select("-password -__v");
    if (user && user.isActive) {
      req.user = user;
      req.token = token;

      const session = await Session.findOne({ token, userId: decoded.userId, isActive: true, }).lean();

      if (session) {
        req.session = session;
        Session.updateOne({ _id: session._id }, { $set: { lastActivity: new Date() } }).catch(() => { });
      }
    }

    return next();
  } catch (err) {
    console.error("Optional auth error:", err);
    return next();
  }
};
