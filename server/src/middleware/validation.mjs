// middleware/validation.mjs
import { getConnectionStatus } from "../config/db.mjs";
import { validationResult } from "express-validator";

// Middleware to handle validation errors from express-validator

export const handleValidationErrors = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map(e => ({
          field: e.path,
          message: e.msg,
        })),
      });
    }
    next();
  } catch (err) {
    console.error("Validation middleware error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during validation",
    });
  }
};


// middleware/dbHealthCheck.mjs
export function dbHealthCheck(req, res, next) {
  const dbStatus = getConnectionStatus();

  // If it's a health check endpoint, return health info
  if (req.path === '/health' || req.path === '/api/health') {
    const health = {
      status: dbStatus.isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
    return res.json(health); // ✅ Return here
  }

  // For other endpoints, check database connection
  if (!dbStatus.isConnected && req.method !== 'GET') {
    return res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please try again.',
      error: 'DATABASE_CONNECTION_ERROR'
    });
  }

  next(); 
}
