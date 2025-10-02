// middleware/errorHandler.mjs
const errorHandler = (err, req, res, next) => {
  console.error(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";

  if (err.name === "ValidationError") {
    message = Object.values(err.errors || {})
      .map((v) => v.message)
      .join(", ");
    statusCode = 400;
  }

  if (err.code === 11000) {
    message = "Duplicate key error";
    statusCode = 409;
  }

  if (err.name === "CastError") {
    message = "Resource not found";
    statusCode = 404;
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
  }

  res.status(statusCode).json({ success: false, message });
};

export default errorHandler;
