import express from "express";

import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  getCurrentUser,
  resendVerification,
  claimAdminCode,
} from "../controllers/authController.mjs";

import {
  registerValidation,
  loginValidation,
  verificationValidation,
  resendVerificationValidation,
  claimAdminCodeValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../utils/validators.mjs";

import { auth } from "../middleware/auth.mjs";
import { handleValidationErrors } from "../middleware/validation.mjs";

const router = express.Router();

router.post("/logout", auth, logout);
router.get("/me", auth, getCurrentUser);
router.post(
  "/register",
  //  registerValidation,
  //   handleValidationErrors,
  register,
);
router.post(
  "/login",
  //  loginValidation,
  //  handleValidationErrors,
  login,
);
router.get(
  "/verify-email/:token",
  //  verificationValidation,
  //  handleValidationErrors,
  verifyEmail,
);
router.post(
  "/resend-verification",
  //  resendVerificationValidation,
  //  handleValidationErrors,
  resendVerification,
);
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  handleValidationErrors,
  forgotPassword,
);
router.post(
  "/reset-password/:token",
  resetPasswordValidation,
  handleValidationErrors,
  resetPassword,
);
router.post(
  "/claim-code",
  auth,
  claimAdminCodeValidation,
  handleValidationErrors,
  claimAdminCode,
);

export default router;
