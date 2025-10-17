import { body, param } from 'express-validator';

// User validation rules
export const userValidation = () => {
  return [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body("password")
      .isLength({ min: 8, max: 100 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[@$!%*?&]/)
      .withMessage("Password must contain at least one special character"),
  ];
};


// Donation validation rules
export const donationValidation = () => {
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
export const eventValidation = () => {
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
export const sermonValidation = () => {
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

export const loginValidation = () => [
  body("email")
    .isString()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email required"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

export const registerValidation = () => [
  body("name")
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2–50 chars long"),
  body("email")
    .isString()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email required"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];



export const forgotPasswordValidation = () => {
  return [
    body("email")
      .normalizeEmail()
      .isEmail()
      .withMessage("Please enter a valid email"),
  ];
};

export const verificationValidation = () => {
  return [
    body("token")
      .isString()
      .withMessage("Invalid verification token")
      .notEmpty()
      .withMessage("Verification token is required"),
  ];
};

export const resendVerificationValidation = () => {
  return [
    body("email")
      .isEmail()
      .withMessage("Invalid email address")
      .normalizeEmail()
  ];
};

export const resetPasswordValidation = () => {
  return [
    body("password")
      .isLength({ min: 8, max: 100 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[@$!%*?&]/)
      .withMessage("Password must contain at least one special character"),
    param("token").isString().withMessage("Invalid reset token"),
  ];
};

export const claimAdminCodeValidation = () => {
  return [
    body('code')
      .isString()
      .notEmpty()
      .withMessage('Admin code is required')
      .isLength({ min: 6, max: 20 })
      .withMessage('Admin code must be between 6 and 20 characters')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Admin code must be alphanumeric and uppercase')

  ];
};

export const generateAdminCodeValidation = () => {
  return [
    body('description')
      .trim()
      .isString()
      .isLength({ min: 10, max: 400 })
      .notEmpty()
      .withMessage('Description required'),
    body('role')
      .isIn(['admin', 'moderator'])
      .withMessage('Role must be admin or moderator'),
    body('maxUsage')
      .optional()
      .isInt({ min: 1 })
      .withMessage('maxUsage must be >=1'),
    body('expiresInDays')
      .optional()
      .isInt({ min: 1 })
      .withMessage('expiresInDays must be >=1')
  ];
};

export const updateUserRoleValidation = () => {
  return [
    body('role')
      .isIn(['user', 'moderator', 'admin'])
      .withMessage('Invalid role')
      .notEmpty()
      .withMessage('Role is required')
  ];
};

export default {
  userValidation,
  loginValidation,
  donationValidation,
  claimAdminCodeValidation,
  eventValidation,
  sermonValidation,
  registerValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verificationValidation,
  resendVerificationValidation,
  generateAdminCodeValidation,
  updateUserRoleValidation
};