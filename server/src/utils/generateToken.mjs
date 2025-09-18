import jwt from 'jsonwebtoken';
const { sign, verify } = jwt;
import { randomBytes } from 'crypto';

// Generate JWT token
const generateAuthToken = (userId) => {
  return sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = () => {
  return randomBytes(40).toString('hex');
};

// Generate random token for email verification, password reset, etc.
const generateRandomToken = (length = 32) => {
  return randomBytes(length).toString('hex');
};

// Verify JWT token
const verifyAuthToken = (token) => {
  try {
    return verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Generate admin code
const generateAdminCode = () => {
  return randomBytes(8).toString('hex').toUpperCase();
};

export default {
  generateAuthToken,
  generateRefreshToken,
  generateRandomToken,
  verifyAuthToken,
  generateAdminCode
};