import express from 'express';
import { body } from 'express-validator';
import { register, login, verifyEmail, forgotPassword, resetPassword, logout, getCurrentUser } from '../controllers/authController.mjs';
import { auth } from '../middleware/auth.mjs';
import { handleValidationErrors } from '../middleware/validation.mjs';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please enter a valid email')
];

const resetPasswordValidation = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Routes
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPasswordValidation, handleValidationErrors, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, handleValidationErrors, resetPassword);
router.post('/logout', auth, logout);
router.get('/me', auth, getCurrentUser);

export default router;