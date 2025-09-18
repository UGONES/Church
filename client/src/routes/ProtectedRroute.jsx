// routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { 
  isAuthenticated as checkAuth, 
  isAdmin as checkAdmin, 
  getStoredUser 
} from "../utils/auth";
import useAuth from "../hooks/useAuth";


const ProtectedRoute = ({
  children,
  requiredRole,
  requireAdmin = false,
  requireAuth = true,
  fallbackPath = "/login",
  unauthorizedPath = "/unauthorized",
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const isUserAuthenticated = checkAuth();
  const isUserAdmin = checkAdmin();

  // Handle unauthenticated case
  if (!requireAuth) {
    return children;
  }
  if (!isUserAuthenticated) {
    return (
      <Navigate
        to={fallbackPath}
        replace
        state={{ from: location, message: "Please log in to access this page" }}
      />
    );
  }

  // Handle admin-only routes
  if (requireAdmin && !isUserAdmin) {
    return (
      <Navigate
        to={unauthorizedPath}
        replace
        state={{
          from: location,
          message: "Admin privileges required",
          required: "Administrator",
        }}
      />
    );
  }

  // Role-based check
  const storedUser = getStoredUser();
  const userRole = (user?.role || storedUser?.role || "user").toLowerCase();

  // Debug logging
  console.log("🔐 ProtectedRoute check:", {
    requiredRole,
    userRole,
    isUserAuthenticated,
    isUserAdmin,
  });

  if (requiredRole && userRole !== requiredRole.toLowerCase()) {
    return (
      <Navigate
        to={unauthorizedPath}
        replace
        state={{
          from: location,
          message: "Insufficient permissions",
          required: requiredRole,
          current: userRole,
        }}
      />
    );
  }

  // ✅ Passed all checks
  return children;
};

export default ProtectedRoute;
