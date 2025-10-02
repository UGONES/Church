// auth.js

let jwtDecode;

// Safe import with fallback handling
try {
  const jwtModule = await import("jwt-decode");
  jwtDecode = jwtModule.jwtDecode;
} catch (error) {
  console.error("Failed to import jwt-decode:", error);
  jwtDecode = (token) => {
    console.warn("jwt-decode not available, using fallback decoder");
    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error("Fallback token decoding failed:", e);
      return null;
    }
  };
}

// ----------------- CONFIG KEYS -----------------
export const TOKEN_KEY = "church_auth_token";
export const USER_KEY = "church_user_data";
export const ADMIN_KEY = "church_admin_status";
export const MODERATOR_KEY = "church_moderator_status";
export const ADMIN_EXPIRY_KEY = "church_admin_expiry";

// ----------------- ADMIN CODES -----------------
const getValidAdminCodes = () => {
  try {
    const envCodes = {
      admin: [
        import.meta.env.VITE_ADMIN_CODE_1,
        import.meta.env.VITE_ADMIN_CODE_2,
        import.meta.env.VITE_ADMIN_CODE_3,
      ].filter(Boolean),
      moderator: [
        import.meta.env.VITE_MOD_CODE_1,
        import.meta.env.VITE_MOD_CODE_2,
        import.meta.env.VITE_MOD_CODE_3,
      ].filter(Boolean),
    };

    return {
      admin: new Set(envCodes.admin.length ? envCodes.admin : envCodes.admin),
      moderator: new Set(envCodes.moderator.length ? envCodes.moderator : envCodes.moderator),
    };
  } catch (err) {
    console.error("⚠️ Error reading admin/mod codes:", err);
    return {
      admin: new Set([]),
      moderator: new Set([]),
    };
  }
};

const VALID_CODES = getValidAdminCodes();
const ADMIN_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h

// ----------------- TOKEN FORMAT -----------------
export const isValidTokenFormat = (token) => {
  if (!token || typeof token !== 'string') return false;

  // Basic JWT format validation (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    // Validate each part can be base64 decoded
    parts.forEach(part => {
      // Handle URL-safe base64
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if necessary
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      atob(padded);
    });
    return true;
  } catch {
    return false;
  }
};

// ----------------- ADMIN / MOD -----------------
export const validateAdminCode = (code, role = "admin") => {
  if (!code || typeof code !== "string") return false;

  const normalizedCode = code.toUpperCase().trim();

  // Server-side codes (should match your server's AdminCode model)
  const SERVER_VALID_CODES = VALID_CODES;

  if (!SERVER_VALID_CODES[role] || SERVER_VALID_CODES[role].size === 0) {
    console.warn(`No codes configured for role: ${role}`);
    return false;
  }

  const isValid = VALID_CODES[role]?.has(normalizedCode) ?? false;
  if (isValid) {
    setAdminSession(role);
    console.log(`✅ Valid ${role} code accepted:`, normalizedCode);
    return true;
  } else {
    console.warn(`❌ Invalid ${role} code:`, normalizedCode);
    return false;
  }
};

const setAdminSession = (role) => {
  const expiryTime = Date.now() + ADMIN_SESSION_DURATION;
  if (role === "admin") {
    localStorage.setItem(ADMIN_KEY, "true");
    localStorage.removeItem(MODERATOR_KEY);
  } else if (role === "moderator") {
    localStorage.setItem(MODERATOR_KEY, "true");
    localStorage.removeItem(ADMIN_KEY);
  }
  localStorage.setItem(ADMIN_EXPIRY_KEY, expiryTime.toString());
};

export const isAdminOrModerator = () => {
  try {
    const isAdminFlag = localStorage.getItem(ADMIN_KEY) === "true";
    const isModeratorFlag = localStorage.getItem(MODERATOR_KEY) === "true";
    if (!isAdminFlag && !isModeratorFlag) return false;

    const expiryTime = localStorage.getItem(ADMIN_EXPIRY_KEY);
    if (!expiryTime || Date.now() > parseInt(expiryTime, 10)) {
      revokeAdminAccess();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

export const revokeAdminAccess = (role = null) => {
  try {
    if (role === "admin") {
      localStorage.removeItem(ADMIN_KEY);
    } else if (role === "moderator") {
      localStorage.removeItem(MODERATOR_KEY);
    } else {
      localStorage.removeItem(ADMIN_KEY);
      localStorage.removeItem(MODERATOR_KEY);
    }
    localStorage.removeItem(ADMIN_EXPIRY_KEY);
  } catch (error) {
    console.error("Error revoking admin access:", error);
  }
};

// ----------------- TOKEN + USER -----------------
export const setAuthToken = (rawToken, extraUserData = {}) => {
  if (!rawToken || typeof rawToken !== "string") {
    throw new Error("Invalid token provided: Not a string");
  }

  // sanitize token
  const token = rawToken.replace(/^"|"$/g, "").trim();

  if (!isValidTokenFormat(token)) {
    console.error("Invalid token format, refusing to store:", token);
    throw new Error("Malformed JWT token");
  }

  try {
    localStorage.setItem(TOKEN_KEY, token);
    const userData = getUserFromToken(token) || {};
    const finalUserData = {
      ...userData,
      ...extraUserData,
      role: userData.role || extraUserData.role || "user",
    };
    localStorage.setItem(USER_KEY, JSON.stringify(finalUserData));
    console.log("🔑 Saving token:", token, "User:", finalUserData);

  } catch (error) {
    console.error("Error setting auth token:", error);
    throw new Error("Failed to set authentication token");
  }

};

export const getUserFromToken = (token) => {
  if (!token || !isValidTokenFormat(token)) return null;
  try {
    const decoded = jwtDecode(token);
    // Map server token fields to client expectations
    return {
      userId: decoded.userId || decoded.id || decoded._id,
      id: decoded.userId || decoded.id || decoded._id,
      _id: decoded.userId || decoded.id || decoded._id,
      email: decoded.email,
      role: (decoded.role || "user").toLowerCase(),
      name: decoded.name || "",
      emailVerified: decoded.emailVerified || false
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const isTokenValid = (token) => {
  if (!token || !isValidTokenFormat(token)) return false;

  try {
    const decoded = jwtDecode(token);

    // Check expiration with buffer
    if (decoded.exp) {
      const currentTime = Date.now() / 1000;
      const buffer = 300; // 5 minutes buffer
      return decoded.exp > currentTime + buffer;
    }

    return true; // Token without exp is considered valid
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};
export const getAuthToken = () => {
  try {
    const rawToken = localStorage.getItem(TOKEN_KEY);
    if (!rawToken) return null;

    const token = rawToken.replace(/^"|"$/g, "").trim();
    if (!isValidTokenFormat(token)) {
      console.warn("Stored token invalid, clearing:", token);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }

    return token;
  } catch (error) {
    console.error("Error retrieving auth token:", error);
    return null;
  }
};

export const removeAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    revokeAdminAccess();
  } catch (error) {
    console.error("Error removing auth token:", error);
  }
};



export const getStoredUser = () => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error retrieving stored user:", error);
    return null;
  }
};

export const setStoredUser = (userData) => {
  try {
    if (userData && typeof userData === "object") {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (error) {
    console.error("Error storing user data:", error);
  }
};

export const isAuthenticated = () => {
  try {
    const token = getAuthToken();
    return token ? isTokenValid(token) : false;
  } catch (error) {
    console.error("Error checking authentication status:", error);
    return false;
  }
};

export const getAuthHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  try {
    const token = getAuthToken();
    if (token && isTokenValid(token)) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error preparing auth headers:", error);
  }
  return headers;
};

// ----------------- EXPIRY + REFRESH -----------------
export const getTokenExpiryTime = (token = null) => {
  try {
    const currentToken = token || getAuthToken();
    if (!currentToken) return 0;
    const decoded = jwtDecode(currentToken);
    if (!decoded.exp) return Infinity;
    const currentTime = Date.now() / 1000;
    return Math.max(0, decoded.exp - currentTime);
  } catch (error) {
    console.error("Error calculating token expiry:", error);
    return 0;
  }
};

export const getAdminSessionTime = () => {
  if (!isAdminOrModerator()) return 0;
  try {
    const expiryTime = localStorage.getItem(ADMIN_EXPIRY_KEY);
    return expiryTime ? Math.max(0, parseInt(expiryTime, 10) - Date.now()) : 0;
  } catch (error) {
    console.error("Error calculating admin session time:", error);
    return 0;
  }
};

export const clearAllAuthData = () => {
  removeAuthToken();
  revokeAdminAccess();
};

export const refreshToken = async () => {
  console.warn("Token refresh not implemented");
  return null;
};

export const checkAndRefreshAuthToken = async () => {
  try {
    const token = getAuthToken();
    if (!token) return false;

    if (isTokenValid(token)) {
      const expiryTime = getTokenExpiryTime(token);
      if (expiryTime < 300) {
        const newToken = await refreshToken();
        if (newToken) {
          setAuthToken(newToken);
          return true;
        }
        return false;
      }
      return true;
    }

    removeAuthToken();
    return false;
  } catch (error) {
    console.error("Error checking/refreshing token:", error);
    removeAuthToken();
    return false;
  }
};

// ----------------- USER HELPERS -----------------
export const getUserRole = () => {
  try {
    const token = getAuthToken();
    if (token && isTokenValid(token)) {
      const userData = getUserFromToken(token);
      return userData?.role || "user";
    }
    const storedUser = getStoredUser();
    return storedUser?.role || "user";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "user";
  }
};

export const hasRole = (role) => getUserRole() === role;

export const getUserId = () => {
  try {
    const token = getAuthToken();
    if (token && isTokenValid(token)) {
      const userData = getUserFromToken(token);
      return userData?.id || userData?.userId || null;
    }
    const storedUser = getStoredUser();
    return storedUser?.id || storedUser?.userId || null;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
};

// ----------------- DEFAULT EXPORT -----------------
export default {
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  isValidTokenFormat,
  isTokenValid,
  getTokenExpiryTime,
  getUserFromToken,
  getStoredUser,
  setStoredUser,
  getUserId,
  getUserRole,
  hasRole,
  isAuthenticated,
  validateAdminCode,
  isAdminOrModerator,
  revokeAdminAccess,
  getAdminSessionTime,
  getAuthHeaders,
  clearAllAuthData,
  checkAndRefreshAuthToken,
  refreshToken,
};
