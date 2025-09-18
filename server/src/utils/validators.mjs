import { body } from 'express-validator';

// User validation rules
const userValidationRules = () => {
  return [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ];
};

// Login validation rules
const loginValidationRules = () => {
  return [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ];
};

// Donation validation rules
const donationValidationRules = () => {
  return [
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be at least $1'),
    body('paymentMethod')
      .isIn(['card', 'bank', 'paypal', 'cash', 'other'])
      .withMessage('Invalid payment method')
  ];
};

// Event validation rules
const eventValidationRules = () => {
  return [
    body('title')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Title must be between 2 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters long'),
    body('startTime')
      .isISO8601()
      .withMessage('Please provide a valid start time'),
    body('endTime')
      .isISO8601()
      .withMessage('Please provide a valid end time'),
    body('location')
      .trim()
      .notEmpty()
      .withMessage('Location is required')
  ];
};

// Sermon validation rules
const sermonValidationRules = () => {
  return [
    body('title')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Title must be between 2 and 100 characters'),
    body('speaker')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Speaker name must be between 2 and 50 characters'),
    body('description')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters long'),
    body('date')
      .isISO8601()
      .withMessage('Please provide a valid date')
  ];
};

export default {
  userValidationRules,
  loginValidationRules,
  donationValidationRules,
  eventValidationRules,
  sermonValidationRules
};