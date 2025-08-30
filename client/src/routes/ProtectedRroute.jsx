import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAuthenticated as checkAuth, isAdmin as checkAdmin } from '../utils/auth';

const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requireAdmin = false,
  requireAuth = true,
  fallbackPath = "/login",
  unauthorizedPath = "/unauthorized"
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7E45] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return children;
  }

  // Check authentication using the utility function
  const isUserAuthenticated = checkAuth();
  
  // Redirect to login if not authenticated
  if (!isUserAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        replace 
        state={{ from: location, message: 'Please log in to access this page' }} 
      />
    );
  }

  // Check admin requirement using the utility function
  const isUserAdmin = checkAdmin();
  
  if (requireAdmin && !isUserAdmin) {
    return (
      <Navigate 
        to={unauthorizedPath} 
        replace 
        state={{ 
          from: location, 
          message: 'Admin privileges required',
          required: 'Administrator'
        }} 
      />
    );
  }

  // Check specific role requirement
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <Navigate 
        to={unauthorizedPath} 
        replace 
        state={{ 
          from: location, 
          message: 'Insufficient permissions',
          required: requiredRole,
          current: user?.role
        }} 
      />
    );
  }

  // Check if email is verified (optional additional requirement)
  if (user && user.emailVerified === false && location.pathname !== '/verify-email') {
    return (
      <Navigate 
        to="/verify-email" 
        replace 
        state={{ 
          from: location,
          message: 'Please verify your email address'
        }} 
      />
    );
  }

  // All checks passed, render the protected content
  return children;
};

// Admin-specific route wrapper
export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute requireAdmin={true} unauthorizedPath="/admin-unauthorized" {...props}>
    {children}
  </ProtectedRoute>
);

// Role-specific route wrapper
export const RoleRoute = ({ role, children, ...props }) => (
  <ProtectedRoute requiredRole={role} {...props}>
    {children}
  </ProtectedRoute>
);

// Public route that redirects if already authenticated
export const PublicRoute = ({ children, redirectPath = "/dashboard" }) => {
  const { isLoading } = useAuth();
  const isUserAuthenticated = checkAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7E45]"></div>
      </div>
    );
  }

  if (isUserAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;