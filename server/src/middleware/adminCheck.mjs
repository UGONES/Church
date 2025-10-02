// middleware/adminCheck.mjs
export const adminCheck = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const moderatorCheck = (req, res, next) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "moderator")
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Moderator or admin privileges required.",
      });
    }
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
