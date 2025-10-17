import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loader from "../components/Loader";

const ProtectedRoute = ({
  children,
  roles = [],
  requireAuth = true,
  requireAdmin = false,
  fallbackPath = "/login", 
  unauthorizedPath = "/unauthorized",
}) => {
  const {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isModerator,
    authLoading,
  } = useAuth();
  const location = useLocation();

  // 🕐 1. Wait for auth to load (prevents flashing login page)
  if (authLoading) {
    return <Loader type="spinner" text="Verifying your session..." />;
  }

  // 🔒 2. Require authentication
  if (requireAuth && (!isAuthenticated || !token || !user)) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // 👮 3. Require admin/moderator privileges (admin area only)
 if (requireAdmin && !(isAdmin || isModerator)) {
    return <Navigate to={unauthorizedPath} state={{ from: location }} replace />;
  }

  // 🎭 4. Restrict to specific roles (if specified)
  if (roles.length > 0 && user && !roles.includes(user.role)) {
    return <Navigate to={unauthorizedPath} state={{ from: location }} replace />;
  }

  // ✅ 5. Authorized — render children
  return children;
};

export default ProtectedRoute;
