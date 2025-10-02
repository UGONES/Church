import { Navigate, useLocation } from "react-router-dom";
import {
  isAuthenticated,
  isAdminOrModerator,
  getStoredUser,
  getUserRole,
} from "../utils/auth";
import useAuth from "../hooks/useAuth";
import Loader from "../components/Loader";

const ProtectedRoute = ({
  children,
  requiredRole,
  requireAdmin = false,
  requireAuth = true,
  fallbackPath = "/login",
  unauthorizedPath = "/unauthorized",
}) => {
  const { user, isLoading } = useAuth();

  // Use multiple sources for user data
  const storedUser = getStoredUser();
  const currentUser = user || storedUser;
  const authenticated = isAuthenticated();
  const administrator = isAdminOrModerator();
  const userRole = getUserRole();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader type="spinner" text="Checking access..." />
      </div>
    );
  }

  // Debug logging
  console.log("🔐 ProtectedRoute check:", {
    path: location.pathname,
    requiredRole,
    requireAdmin,
    requireAuth,
    authenticated,
    administrator,
    userRole,
    hasUser: !!currentUser,
  });

  // Handle unauthenticated access
  if (requireAuth && !authenticated) {
    console.log("❌ Authentication required - redirecting to login");

    return (
      <Navigate
        to={fallbackPath}
        replace
        state={{
          from: location,
          message: "Please log in to access this page",
        }}
      />
    );
  }

  // Handle admin-only routes
  if (requireAdmin && !administrator) {
    console.log("❌ Admin privileges required");

    return (
      <Navigate
        to={unauthorizedPath}
        replace
        state={{
          from: location,
          message: "Admin privileges required",
          required: "Administrator/Moderator",
        }}
      />
    );
  }

  // Handle role-based access
  if (requiredRole && currentUser) {
    const currentUserRole = (currentUser?.role || userRole).toLowerCase();
    const requiredRoleLower = requiredRole.toLowerCase();

    console.log("🔍 Role check:", {
      required: requiredRoleLower,
      current: currentUserRole,
      user: currentUser,
    });

    // Special case: moderators accessing admin routes
    if (requiredRoleLower === "admin" && currentUserRole === "moderator") {
      // Allow moderators to access admin routes if requireAdmin is not strictly required
      console.log("⚠️ Moderator accessing admin route - allowed");
    }
    // Standard role check
    else if (currentUserRole !== requiredRoleLower) {
      console.log("❌ Insufficient permissions");
      return (
        <Navigate
          to={unauthorizedPath}
          replace
          state={{
            from: location,
            message: "Insufficient permissions",
            required: requiredRole,
            current: currentUserRole,
          }}
        />
      );
    }
  }

  // ✅ Passed all checks
  console.log("✅ Access granted to:", location.pathname);
  return children;
};

export default ProtectedRoute;
