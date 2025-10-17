/**
 * Centralized Express error handler
 * Handles validation, MongoDB, JWT, and generic errors consistently.
 * Logs details in development and hides sensitive info in production.
 */
const errorHandler = (err, req, res, next) => {
  // Always log full error for server-side visibility
  console.error("💥 Error caught by middleware:", {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? "hidden" : err.stack,
  });

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = null;

  // 🧩 Mongoose Validation Errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors || {}).map(v => v.message);
  }

  // 🧩 MongoDB Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyValue || {});
    message = `Duplicate value for field${fields.length > 1 ? "s" : ""}: ${fields.join(", ")}`;
    details = err.keyValue;
  }

  // 🧩 Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 404;
    message = `Resource not found (invalid ${err.path})`;
  }

  // 🧩 JWT Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired. Please log in again.";
  }

  // 🧩 Multer or file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "Uploaded file is too large";
  }

  // 🧩 Cloudinary or external service errors
  if (err.http_code && err.message?.includes("Cloudinary")) {
    statusCode = err.http_code || 500;
    message = "Image upload failed. Please try again.";
  }

  // 🧩 Handle rate limiting errors (from express-rate-limit)
  if (err.status === 429) {
    statusCode = 429;
    message = "Too many requests. Please try again later.";
  }

  // ✅ Standardize response structure
  const errorResponse = {
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
