// middleware/validation.mjs
import { validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({
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
