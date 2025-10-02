import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/apiService";
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getUserFromToken,
  getStoredUser,
  setStoredUser,
  isValidTokenFormat,
  isTokenValid,
} from "../utils/auth";
import User from "../models/User";
import { useAlert } from "../utils/Alert";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const alert = useAlert();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getAuthToken() || null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);

  // ----------------------------
  // Helpers
  // ----------------------------
  const normalizeUser = (rawUser) => (rawUser ? new User(rawUser) : null);


  // ----------------------------
  // Initialize authentication on mount
  // ----------------------------
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const existingToken = getAuthToken();

        if (existingToken && isValidTokenFormat(existingToken) && isTokenValid(existingToken)) {
          const tokenUser = getUserFromToken(existingToken);

          if (tokenUser && (tokenUser.userId || tokenUser._id || tokenUser.id)) {
            try {
              const response = await authService.getCurrentUser();
              const serverUser = response.data?.user || response.user || response;

              if (serverUser) {
                const normalizedUser = normalizeUser(serverUser);
                setUser(normalizedUser);
                setStoredUser(normalizedUser);
                setToken(existingToken);

                // ✅ Redirect admins properly if landing on /login or /
                if (window.location.pathname === "/" || window.location.pathname === "/login") {
                  if (normalizedUser.role === "admin" || normalizedUser.role === "moderator") {
                    navigate(`/admin/${normalizedUser.id}/dashboard`, { replace: true });
                  } else {
                    navigate(`/user/${normalizedUser.id}/dashboard`, { replace: true });
                  }
                }
              }
            } catch (fetchError) {
              console.warn("⚠️ Could not fetch user from server, falling back to token:", fetchError);
              const normalizedUser = normalizeUser(tokenUser);
              setUser(normalizedUser);
              setStoredUser(normalizedUser);
              setToken(existingToken);
            }
          }
        } else {
          const storedUser = getStoredUser();
          if (storedUser && storedUser.id) {
            setUser(storedUser);
          } else if (existingToken) {
            removeAuthToken();
          }
        }
      } catch (err) {
        console.error("❌ Auth initialization error:", err);
        removeAuthToken();
        setError("Authentication initialization failed");
      } finally {
        setIsLoading(false);
        setAuthLoading(false);
      }
    };

    initializeAuth();
  }, [navigate]);
  
 // ----------------------------
  // LOGIN
  // ----------------------------
  const login = async (credentials) => {
    setIsLoading(true);
    setAuthLoading(true);
    setError(null);

    try {
      if (!credentials.email || !credentials.password) {
        throw new Error("Email and password are required");
      }

      const response = await authService.login(credentials);
      const data = response.data || response;

      if (data.code === "EMAIL_NOT_VERIFIED") {
        return {
          success: false,
          error: "Please verify your email before logging in",
          requiresVerification: true,
          email: data.email,
        };
      }

      if (!data.success || !data.token) {
        throw new Error(data.message || "Invalid login response");
      }

      if (!isValidTokenFormat(data.token)) {
        throw new Error("Invalid token format received from server");
      }

      if (!data.user || !data.user.id) {
        throw new Error("Invalid user data received from server");
      }

      // Save token + user
      setAuthToken(data.token, data.user);
      const normalizedUser = normalizeUser(data.user);

      if (!normalizedUser.id || !normalizedUser.email) {
        throw new Error("Failed to normalize user data");
      }

      setUser(normalizedUser);
      setStoredUser(normalizedUser);
      setToken(data.token);

      // ✅ Trust backend roles, no more downgrades
      alert.success(`Welcome back, ${normalizedUser.name || normalizedUser.email}!`);

      if (normalizedUser.role === "admin" || normalizedUser.role === "moderator") {
        navigate(`/admin/${normalizedUser.id}/dashboard`, { replace: true });
      } else {
        navigate(`/user/${normalizedUser.id}/dashboard`, { replace: true });
      }

      return { success: true, user: normalizedUser, token: data.token };
    } catch (err) {
      console.error("Login failed:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your credentials.";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
      setAuthLoading(false);
    }
  };

  // ----------------------------
  // LOGOUT
  // ----------------------------
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("⚠️ Logout API call failed:", err);
    } finally {
      removeAuthToken();
      setUser(null);
      setToken(null);
      setError(null);
      localStorage.removeItem("pendingVerificationEmail");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      console.log("✅ Local session cleared");

    }
    navigate("/login");
  };

  // ----------------------------
  // Refresh user profile
  // ----------------------------
  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      const serverUser = response.data?.user || response.user || response;
      if (serverUser) {
        const normalizedUser = normalizeUser(serverUser);
        setUser(normalizedUser);
        setStoredUser(normalizedUser);
        return normalizedUser;
      }
    } catch (error) {
      console.error("❌ Failed to refresh user:", error);
      return null;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    authLoading,
    error,
    login,
    logout,
    refreshUser,
    setUser,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === "admin",
    isModerator: user?.role === "moderator" || user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;
