// ====================== AUTH UTILITY ======================
// St. Michael Church — unified, tab-safe, multi-user local auth
// ===========================================================

import axios from "axios";

// ----------------- API Base URL -----------------
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ----------------- CONFIG / PREFIXES -----------------
const STORAGE_PREFIX = "smc_auth_"; // base prefix
const TOKEN_SUFFIX = "_token";
const USER_SUFFIX = "_user";
const ACTIVE_USER_KEY = `${STORAGE_PREFIX}active_user_id`;
const ADMIN_KEY = `${STORAGE_PREFIX}admin_flag`;
const MODERATOR_KEY = `${STORAGE_PREFIX}moderator_flag`;
const ADMIN_EXPIRY_KEY = `${STORAGE_PREFIX}admin_expiry`;

// ----------------- jwt-decode (lazy + fallback) -----------------
let jwtDecodeFn = null;

const loadJwtDecode = async () => {
  if (jwtDecodeFn) return jwtDecodeFn;
  try {
    const mod = await import("jwt-decode");
    jwtDecodeFn = (t) => (mod.default ? mod.default(t) : mod(t));
  } catch {
    jwtDecodeFn = (token) => {
      if (!token || typeof token !== "string") return null;
      try {
        const payload = token.split(".")[1];
        if (!payload) return null;
        const padded = payload
          .replace(/-/g, "+")
          .replace(/_/g, "/")
          .padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
        return JSON.parse(atob(padded));
      } catch (e) {
        console.error("Fallback JWT decode failed:", e);
        return null;
      }
    };
  }
  return jwtDecodeFn;
};

const safeDecodeSync = (token) => {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const padded = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

// ----------------- Key helpers -----------------
const tokenKeyFor = (userId = "global") =>
  `${STORAGE_PREFIX}${userId}${TOKEN_SUFFIX}`;
const userKeyFor = (userId = "global") =>
  `${STORAGE_PREFIX}${userId}${USER_SUFFIX}`;

// ----------------- Active User (per-tab) -----------------
export const setActiveUser = (id) => {
  if (!id) sessionStorage.removeItem(ACTIVE_USER_KEY);
  else sessionStorage.setItem(ACTIVE_USER_KEY, id);
};

export const getActiveUserId = () => sessionStorage.getItem(ACTIVE_USER_KEY);

// ----------------- Token Format -----------------
export const isValidTokenFormat = (token) => {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    parts.forEach((p) => {
      const base64 = p.replace(/-/g, "+").replace(/_/g, "/");
      atob(base64);
    });
    return true;
  } catch {
    return false;
  }
};

// ----------------- Admin / Moderator -----------------
const readCodesFromEnv = () => {
  try {
    const admin = [
      import.meta.env.VITE_ADMIN_CODE_1,
      import.meta.env.VITE_ADMIN_CODE_2,
      import.meta.env.VITE_ADMIN_CODE_3,
    ]
      .filter(Boolean)
      .map((x) => x.toUpperCase().trim());
    const mod = [
      import.meta.env.VITE_MOD_CODE_1,
      import.meta.env.VITE_MOD_CODE_2,
      import.meta.env.VITE_MOD_CODE_3,
    ]
      .filter(Boolean)
      .map((x) => x.toUpperCase().trim());
    return { admin: new Set(admin), moderator: new Set(mod) };
  } catch {
    return { admin: new Set(), moderator: new Set() };
  }
};

const VALID_CODES = readCodesFromEnv();
const ADMIN_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h

export const validateAdminCode = (code, role = "admin") => {
  if (!code || typeof code !== "string") return false;
  const normalized = code.toUpperCase().trim();
  const ok = VALID_CODES[role]?.has(normalized);
  if (ok) setAdminSession(role);
  return ok;
};

const setAdminSession = (role) => {
  const expiry = Date.now() + ADMIN_SESSION_DURATION;
  if (role === "admin") {
    localStorage.setItem(ADMIN_KEY, "true");
    localStorage.removeItem(MODERATOR_KEY);
  } else if (role === "moderator") {
    localStorage.setItem(MODERATOR_KEY, "true");
    localStorage.removeItem(ADMIN_KEY);
  } else {
    return;
  }
  localStorage.setItem(ADMIN_EXPIRY_KEY, expiry.toString());
};

export const isAdminOrModerator = () => {
  try {
    const isAdmin = localStorage.getItem(ADMIN_KEY) === "true";
    const isMod = localStorage.getItem(MODERATOR_KEY) === "true";
    const expiry = parseInt(localStorage.getItem(ADMIN_EXPIRY_KEY) || "0", 10);
    if ((!isAdmin && !isMod) || Date.now() > expiry) {
      revokeAdminAccess();
      return false;
    }
    return true;
  } catch (e) {
    console.error("isAdminOrModerator error:", e);
    return false;
  }
};

export const revokeAdminAccess = (role = null) => {
  try {
    if (!role || role === "admin") localStorage.removeItem(ADMIN_KEY);
    if (!role || role === "moderator") localStorage.removeItem(MODERATOR_KEY);
    localStorage.removeItem(ADMIN_EXPIRY_KEY);
  } catch (e) {
    console.error("revokeAdminAccess error:", e);
  }
};

// ----------------- Token & User (per-user keys) -----------------
export const setAuthToken = async (rawToken, extraUser = {}) => {
  if (!rawToken || typeof rawToken !== "string") {
    throw new Error("Invalid token");
  }
  const token = rawToken.replace(/^"|"$/g, "").trim();
  if (!isValidTokenFormat(token)) throw new Error("Malformed JWT");

  try {
    await loadJwtDecode();
  } catch {}

  const decoded = safeDecodeSync(token) || {};
  const id = (
    decoded.userId ||
    decoded.id ||
    decoded._id ||
    extraUser.id ||
    "global"
  ).toString();
  const user = {
    id,
    userId: id,
    _id: id,
    email: decoded.email || extraUser.email || "",
    role: (decoded.role || extraUser.role || "user").toLowerCase(),
    name: decoded.name || extraUser.name || "",
    emailVerified: decoded.emailVerified || extraUser.emailVerified || false,
    ...extraUser,
  };
  localStorage.setItem(tokenKeyFor(id), token);
  localStorage.setItem(userKeyFor(id), JSON.stringify(user));
  setActiveUser(id);
  console.log("🔑 Saved token for user:", id);
  return { success: true, id, token };
};

export const getAuthToken = (userId = null) => {
  const id = userId || getActiveUserId();
  try {
    if (id) return localStorage.getItem(tokenKeyFor(id)) || null;
    const global = localStorage.getItem(tokenKeyFor("global"));
    if (global) return global;
  } catch (e) {
    console.error("getAuthToken error:", e);
    return null;
  }
};

export const removeAuthToken = (userId = null) => {
  const id = userId || getActiveUserId();
  try {
    if (id) {
      localStorage.removeItem(tokenKeyFor(id));
      localStorage.removeItem(userKeyFor(id));
    } else {
      localStorage.removeItem(tokenKeyFor("global"));
      localStorage.removeItem(userKeyFor("global"));
    }
    revokeAdminAccess();
  } catch (e) {
    console.error("removeAuthToken error:", e);
  }
};

export const getStoredUser = (userId = null) => {
  const id = userId || getActiveUserId();
  if (!id) return null;
  try {
    const raw = id
      ? localStorage.getItem(userKeyFor(id))
      : localStorage.getItem(userKeyFor("global"));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("getStoredUser error:", e);
    return null;
  }
};

export const setStoredUser = (userObj, userId = null) => {
  const id =
    userId || userObj.id || userObj.userId || "global" || getActiveUserId();
  if (!id) return;
  try {
    if (!userObj || !userObj.id) {
      if (id) localStorage.removeItem(userKeyFor(id));
      return;
    }
    localStorage.setItem(userKeyFor(id), JSON.stringify(userObj));
  } catch (e) {
    console.error("setStoredUser error:", e);
  }
};

// ----------------- Token helpers -----------------
export const getUserFromToken = (token) => {
  if (!token || !isValidTokenFormat(token)) return null;
  const decoded = safeDecodeSync(token);
  if (!decoded) return null;
  return {
    userId: decoded.userId || decoded.id || decoded._id,
    id: decoded.userId || decoded.id || decoded._id,
    _id: decoded.userId || decoded.id || decoded._id,
    email: decoded.email,
    role: (decoded.role || "user").toLowerCase(),
    name: decoded.name || "",
    emailVerified: Boolean(decoded.emailVerified),
    exp: decoded.exp,
    iat: decoded.iat,
  };
};

export const isTokenValid = (token) => {
  if (!token || !isValidTokenFormat(token)) return false;
  const decoded = safeDecodeSync(token);
  if (!decoded) return false;
  if (decoded.exp) {
    const now = Math.floor(Date.now() / 1000);
    const buffer = 300; // 5m buffer
    return decoded.exp > now + buffer;
  }
  return true;
};

export const getTokenExpiryTime = (token = null) => {
  const t = token || getAuthToken();
  if (!t) return 0;
  const d = safeDecodeSync(t);
  if (!d?.exp) return Infinity;
  return Math.max(0, d.exp - Date.now() / 1000);
};

// ----------------- Headers -----------------
export const getAuthHeaders = (userId = null) => {
  const token = getAuthToken(userId);
  const headers = { "Content-Type": "application/json" };
  if (token && isTokenValid(token)) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// ----------------- Token Refresh -----------------
export const refreshToken = async (userId = null) => {
  try {
    const oldToken = getAuthToken(userId);
    if (!oldToken) return null;

    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      {
        headers: { Authorization: `Bearer ${oldToken}` },
        withCredentials: true,
      },
    );

    const newToken = response.data?.token || response.data?.accessToken;
    if (!newToken || !isValidTokenFormat(newToken)) {
      console.warn("Invalid refresh token response");
      return null;
    }

    await setAuthToken(newToken, getStoredUser(userId) || {});
    console.log("🔄 Token refreshed successfully");
    return newToken;
  } catch (err) {
    console.error("refreshToken error:", err);
    removeAuthToken(userId);
    return null;
  }
};

// ----------------- Tab Locks -----------------

// Ensure each tab has unique ID
if (!sessionStorage.getItem(`${STORAGE_PREFIX}tab_id`)) {
  try {
    const tid = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(`${STORAGE_PREFIX}tab_id`, tid);
  } catch {
    sessionStorage.setItem(
      `${STORAGE_PREFIX}tab_id`,
      `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    );
  }
}

export const acquireTabFetchLock = (userId = "global", ttlMs = 8000) => {
  try {
    const key = `${STORAGE_PREFIX}tab_lock_${userId}`;
    const now = Date.now();
    const existing = sessionStorage.getItem(key);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed && parsed.expiresAt > now) return false;
    }
    const lock = {
      owner:
        sessionStorage.getItem(`${STORAGE_PREFIX}tab_id`) ||
        (crypto.randomUUID
          ? crypto.randomUUID()
          : `${now}_${Math.random().toString(36).slice(2)}`),
      expiresAt: now + ttlMs,
    };
    sessionStorage.setItem(key, JSON.stringify(lock));
    return true;
  } catch (e) {
    console.warn("acquireTabFetchLock error:", e);
    return true;
  }
};

export const releaseTabFetchLock = (userId = "global") => {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}tab_lock_${userId}`);
  } catch (e) {
    console.warn("releaseTabFetchLock error:", e);
  }
};

// ----------------- Cleanup -----------------
export const clearAllAuthData = () => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(k);
    }
  } catch (e) {
    console.error("clearAllAuthData error:", e);
  }
};

export default {
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  refreshToken,
  getStoredUser,
  setStoredUser,
  getUserFromToken,
  isTokenValid,
  getActiveUserId,
  setActiveUser,
  acquireTabFetchLock,
  releaseTabFetchLock,
  clearAllAuthData,
  validateAdminCode,
  isAdminOrModerator,
  revokeAdminAccess,
};
