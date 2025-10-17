// middleware/rateLimiter.mjs
import rateLimit from 'express-rate-limit';

// Helper: safely disable limiter in dev
const createLimiter = (options) => {
  if (process.env.NODE_ENV === 'development') return (req, res, next) => next();
  return rateLimit(options);
};

// General rate limiter
export const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (stricter)
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Donation rate limiter
export const donationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: 'Too many donation attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict short limiter (for sensitive routes)
export const strictLimiter = createLimiter({
  windowMs: 15 * 1000, // 15 seconds
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`🚫 Rate limit exceeded for ${req.ip} on ${req.originalUrl}`);
    res.status(429).json({ success: false, message: "Too many requests, slow down." });
  },
});

export default {
  generalLimiter,
  authLimiter,
  donationLimiter,
  strictLimiter,
};
