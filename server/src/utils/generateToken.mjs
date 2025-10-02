// utils/generateToken.mjs
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';


// Validate JWT_SECRET
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  } else {
    // Generate a default secret for development if not set
    process.env.JWT_SECRET = 'default-dev-secret-that-is-long-enough-32-chars';
    console.warn('WARNING: Using default JWT secret for development. Set JWT_SECRET for production.');
  }
}

if ( process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

const JWT_CONFIG = {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  algorithm: 'HS256',
  issuer: 'st-michaels-church',
  audience: 'church-members'
};

/**
 * Secure JWT token generation with proper validation
 */
export const generateAuthToken = (userId, extraPayload = {}) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Valid userId is required to generate auth token');
  }

  // Extract user info cleanly
  const {
    email = null,
    role = 'user',
    name = '',
    emailVerified = false,
    ...rest
  } = extraPayload;

  const payload = {
    userId,
    email,
    role: role.toLowerCase(),
    name,
    emailVerified,
    iat: Math.floor(Date.now() / 1000),
    ...rest, 
  };

  return jwt.sign(payload, process.env.JWT_SECRET, JWT_CONFIG);
};

export const verifyAuthToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

export const generateRefreshToken = () => {
  return randomBytes(64).toString('hex'); // 512-bit
};

export const generateRandomToken = (bytes = 32) => {
  const n = Math.max(16, Number(bytes) || 32);
  return randomBytes(n).toString('hex');
};

export const generateAdminCode = () => {
  return randomBytes(8).toString('hex').toUpperCase();
};

export default {
  generateAuthToken,
  verifyAuthToken,
  generateRefreshToken,
  generateRandomToken,
  generateAdminCode
};
