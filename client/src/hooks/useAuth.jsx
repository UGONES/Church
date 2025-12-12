// src/hooks/useAuth.jsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/apiService";
import {
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  isValidTokenFormat,
  isTokenValid,
  getUserFromToken,
  getStoredUser,
  setStoredUser,
  acquireTabFetchLock,
  getActiveUserId,
  setActiveUser,
  releaseTabFetchLock,
} from "../utils/auth";
import User from "../models/User";
import { useAlert } from "../utils/Alert";
import Loader from "../components/Loader";

const AuthContext = createContext(undefined);

const normalizeUser = (raw) => {
  if (!raw) return null;
  const id = raw.id || raw._id || raw.userId;
  return new User({ ...raw, id });
};

export const AuthProvider = ({ children }) => {
  const alert = useAlert();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);

  // ======================================================
  // ✅ INITIALIZE AUTH STATE (runs once)
  // ======================================================
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const existingToken = getAuthToken();

        if (
          existingToken &&
          isValidTokenFormat(existingToken) &&
          isTokenValid(existingToken)
        ) {
          const tokenUser = getUserFromToken(existingToken);
          const userId = tokenUser?.id || getActiveUserId() || "global";

          const locked = acquireTabFetchLock(userId, 8000);
          if (!locked) {
            const cached = getStoredUser(userId);
            if (cached) {
              setUser(cached);
              setToken(existingToken);
              setAuthLoading(false);
              return;
            }
          }

          try {
            const res = await authService.getCurrentUser();
            const serverUser = res.data?.user || res.user || res;
            const normalized = normalizeUser(serverUser);

            if (normalized) {
              setUser(normalized);
              setStoredUser(normalized, normalized.id);
              setToken(existingToken);
            }
          } catch (err) {
            console.warn("⚠️ /auth/me failed, using token fallback:", err);
            const fallbackUser = normalizeUser(tokenUser);
            if (fallbackUser) {
              setUser(fallbackUser);
              setStoredUser(fallbackUser, fallbackUser.id);
              setToken(existingToken);
            } else {
              removeAuthToken();
            }
          } finally {
            releaseTabFetchLock(userId);
          }
        } else {
          const stored = getStoredUser();
          if (stored?.id) {
            setToken(existingToken);
            setUser(stored);
          } else {
            removeAuthToken();
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
        removeAuthToken();
        setUser(null);
        setToken(null);
        setError("Authentication initialization failed");
      } finally {
        setAuthLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ======================================================
  // ✅ LOGIN
  // ======================================================
  const login = async (credentials) => {
    setAuthLoading(true);
    try {
      const res = await authService.login(credentials);
      const data = res.data || res;

      if (!data.success || !data.token) {
        throw new Error(data.message || "Invalid login response");
      }

      const normalized = normalizeUser(data.user);
      await setAuthToken(data.token, data.user);
      if (normalized) {
        setStoredUser(normalized, normalized.id);
        setUser(normalized);
        setActiveUser(normalized.id);
      }
      setToken(data.token);

      alert.success(
        `Welcome, ${normalized.name || normalized.email || "User"}!`,
      );

      await new Promise((r) => setTimeout(r, 150));

      const route =
        normalized.role === "admin"
          ? `/admin/${normalized.id}/dashboard`
          : normalized.role === "moderator"
            ? `/moderator/${normalized.id}/dashboard`
            : `/user/${normalized.id}/dashboard`;
      navigate(route, { replace: true });

      return { success: true, user: normalized, token: data.token };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Login failed";
      setError(msg);
      alert.error?.(msg);
      return { success: false, error: msg };
    } finally {
      setAuthLoading(false);
      setTimeout(() => setAuthLoading(false), 300);
    }
  };

  // ======================================================
  // ✅ LOGOUT
  // ======================================================
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Logout API failed:", err);
    } finally {
      const uid = user?.id || getActiveUserId() || "global";
      setActiveUser(uid);
      removeAuthToken(uid);
      setUser(null);
      setToken(null);
      setError(null);
      console.log("✅ Cleared session for:", uid);
      navigate("/login", { replace: true });
    }
  };

  // ======================================================
  // ✅ REFRESH USER (used by App.jsx)
  // ======================================================
  const refreshUser = useCallback(async () => {
    const uid = user?.id || getActiveUserId() || "global";
    if (!uid) return;

    const locked = acquireTabFetchLock(uid, 5000);
    if (!locked) return;

    try {
      const res = await authService.getCurrentUser();
      const serverUser = res.data?.user || res.user || res;
      const normalized = normalizeUser(serverUser);

      if (normalized) {
        setUser(normalized);
        setStoredUser(normalized, uid);
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    } finally {
      releaseTabFetchLock(uid);
    }
  }, [user]);

  // ======================================================
  // ✅ CONTEXT VALUE
  // ======================================================
  const value = {
    user,
    token,
    error,
    setUser,
    login,
    logout,
    refreshUser,
    authLoading,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === "admin",
    isModerator: user?.role === "moderator",
    isStaff: ["admin", "moderator"].includes(user?.role),
  };

  // ======================================================
  // ✅ RENDER PROVIDER
  // ======================================================
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader type="spinner" text="Restoring session..." />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ======================================================
// ✅ USE AUTH HOOK
// ======================================================
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export default useAuth;
