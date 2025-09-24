import { jwtDecode } from "jwt-decode";

// Configuration constants
export const TOKEN_KEY = "church_auth_token";
export const USER_KEY = "church_user_data";
export const ADMIN_KEY = "church_admin_status";
export const ADMIN_EXPIRY_KEY = "church_admin_expiry";

// Admin codes - Use fallback codes for browser environment
const getValidAdminCodes = () => {
  // Try to get from environment variables (available during build)
  try {
    const envCodes = [
      process.env.REACT_APP_ADMIN_CODE_1,
      process.env.REACT_APP_ADMIN_CODE_2,
      process.env.REACT_APP_ADMIN_CODE_3,
    ].filter(Boolean);

    if (envCodes.length > 0) {
      return new Set(envCodes);
    }
  } catch (error) {
    console.log(
      "Environment variables not available in browser, using fallback codes",
    );
  }

  // Fallback validation (development)
  return new Set(["STMICHAEL2024", "ANGELSCHURCH", "THRONEOFSRACE"]);
};

const VALID_ADMIN_CODES = getValidAdminCodes();

// Admin session duration (24 hours)
const ADMIN_SESSION_DURATION = 24 * 60 * 60 * 1000;

/**
 * Validates if a string is a properly formatted JWT token
 * @param {string} token - The token to validate
 * @returns {boolean} - True if token has proper JWT format
 */
export const isValidTokenFormat = (token) => {
  if (!token || typeof token !== "string") {
    return false;
  }

  // JWT tokens should have 3 parts separated by dots
  const parts = token.split(".");
  return parts.length === 3;
};

/**
 * Validates admin code and sets admin session
 * @param {string} code - The admin code to validate
 * @returns {Promise<boolean>} - True if valid, false otherwise
 */
export const validateAdminCode = async (code) => {
  try {
    if (!code || typeof code !== "string") {
      return false;
    }

    const normalizedCode = code.toUpperCase().trim();

    // Check against valid admin codes
    const isValid = VALID_ADMIN_CODES.has(normalizedCode);
    if (isValid) {
      setAdminSession();
      return true;
    }

    return false;
  } catch (error) {
    console.error("Admin code validation error:", error);
    return false;
  }
};

/**
 * Sets admin session with expiration
 */
const setAdminSession = () => {
  const expiryTime = Date.now() + ADMIN_SESSION_DURATION;
  localStorage.setItem(ADMIN_KEY, "true");
  localStorage.setItem(ADMIN_EXPIRY_KEY, expiryTime.toString());
};

/**
 * Checks if user has valid admin privileges
 * @returns {boolean} - True if user is admin and session is valid
 */
export const isAdmin = () => {
  try {
    const isAdminFlag = localStorage.getItem(ADMIN_KEY) === "true";
    if (!isAdminFlag) return false;

    const expiryTime = localStorage.getItem(ADMIN_EXPIRY_KEY);
    if (!expiryTime) {
      revokeAdminAccess();
      return false;
    }

    const isExpired = Date.now() > parseInt(expiryTime, 10);
    if (isExpired) {
      revokeAdminAccess();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

/**
 * Revokes admin access
 */
export const revokeAdminAccess = () => {
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(ADMIN_EXPIRY_KEY);
};

/**
 * Sets authentication token and extracts user data
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  if (!token || typeof token !== "string" || !isValidTokenFormat(token)) {
    throw new Error("Invalid token provided: Malformed JWT token");
  }

  try {
    localStorage.setItem(TOKEN_KEY, token);

    const userData = getUserFromToken(token);
    if (userData) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
  } catch (error) {
    console.error("Error setting auth token:", error);
    throw new Error("Failed to set authentication token");
  }
};

/**
 * Retrieves authentication token
 * @returns {string|null} - Token or null if not found or invalid
 */
export const getAuthToken = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !isValidTokenFormat(token)) {
      // Clean up invalid token
      if (token) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      return null;
    }
    return token;
  } catch (error) {
    console.error("Error retrieving auth token:", error);
    return null;
  }
};

/**
 * Clears all authentication data
 */
export const removeAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    revokeAdminAccess();
  } catch (error) {
    console.error("Error removing auth token:", error);
  }
};

/**
 * Validates JWT token expiration
 * @param {string} token - JWT token to validate
 * @returns {boolean} - True if token is valid
 */
export const isTokenValid = (token) => {
  if (!token || !isValidTokenFormat(token)) {
    return false;
  }

  try {
    const decoded = jwtDecode(token);

    // Check expiration (with 5-second buffer)
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime + 5;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

/**
 * Extracts user data from JWT token
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded token payload or null
 */
export const getUserFromToken = (token) => {
  if (!token || !isValidTokenFormat(token)) {
    return null;
  }

  try {
    return jwtDecode(token);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Retrieves stored user data
 * @returns {object|null} - Parsed user data or null
 */
export const getStoredUser = () => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) return null;

    return JSON.parse(userData);
  } catch (error) {
    console.error("Error retrieving stored user:", error);
    return null;
  }
};

/**
 * Checks if user is authenticated
 * @returns {boolean} - True if authenticated
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  return token ? isTokenValid(token) : false;
};

/**
 * Generates headers for authenticated requests
 * @returns {object} - Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
  };

  if (token && isTokenValid(token)) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Gets remaining token validity time in seconds
 * @returns {number} - Seconds until expiration
 */
export const getTokenExpiryTime = () => {
  const token = getAuthToken();
  if (!token) return 0;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return Math.max(0, decoded.exp - currentTime);
  } catch (error) {
    console.error("Error calculating token expiry:", error);
    return 0;
  }
};

/**
 * Gets remaining admin session time in milliseconds
 * @returns {number} - Milliseconds until admin session expiry
 */
export const getAdminSessionTime = () => {
  if (!isAdmin()) return 0;

  try {
    const expiryTime = localStorage.getItem(ADMIN_EXPIRY_KEY);
    if (!expiryTime) return 0;

    return Math.max(0, parseInt(expiryTime, 10) - Date.now());
  } catch (error) {
    console.error("Error calculating admin session time:", error);
    return 0;
  }
};

/**
 * Comprehensive cleanup of all auth data
 */
export const clearAllAuthData = () => {
  removeAuthToken();
  revokeAdminAccess();
};

// Optional: Add token refresh mechanism placeholder
export const refreshToken = async () => {
  // Implement token refresh logic based on your backend API
  // This should call your refresh token endpoint and return a new token
  throw new Error("Token refresh not implemented");
};

/**
 * Checks and refreshes token if about to expire
 * @returns {Promise<boolean>} - True if token is valid/refreshed, false if invalid
 */
export const checkAndRefreshAuthToken = async () => {
  try {
    const token = getAuthToken();

    if (!token) {
      return false;
    }

    // Check if token is valid
    if (isTokenValid(token)) {
      const expiryTime = getTokenExpiryTime();

      // Refresh token if it expires in less than 5 minutes
      if (expiryTime < 300) {
        try {
          const newToken = await refreshToken();
          if (newToken) {
            setAuthToken(newToken);
            return true;
          }
          return false;
        } catch (error) {
          console.error("Token refresh failed:", error);
          return false;
        }
      }
      return true;
    }

    // Token is invalid
    removeAuthToken();
    return false;
  } catch (error) {
    console.error("Error checking/refreshing token:", error);
    removeAuthToken();
    return false;
  }
};
