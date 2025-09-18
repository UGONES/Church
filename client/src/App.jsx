import { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Loader from "./components/Loader";
import ProtectedRoute from "./routes/ProtectedRroute";
import {
  getAuthToken,
  isTokenValid,
  getUserFromToken,
  setAuthToken,
  removeAuthToken,
  isValidTokenFormat,
  getStoredUser,
  setStoredUser
} from "./utils/auth";
import { useAlert } from "./utils/Alert";
import "./index.css";
import useAuth from "./hooks/useAuth";

// Lazy load pages for performance
const HomePage = lazy(() => import("./pages/HOmePage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const SermonsPage = lazy(() => import("./pages/SermonsPage"));
const DonatePage = lazy(() => import("./pages/DonatePage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const MinistriesPage = lazy(() => import("./pages/MinistriesPage"));
const TestimonialsPage = lazy(() => import("./pages/TestimonialsPage"));
const PrayerPage = lazy(() => import("./pages/PrayerPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const UserPage = lazy(() => import("./pages/UserPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const MyRsvpsPage = lazy(() => import("./pages/MyRsvpsPage"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const PasswordPage = lazy(() => import("./pages/PasswordPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = ({}) => {
  const { user, setUser } = useAuth(); // ✅ Get both user and setUser from useAuth
  const [isLoading, setIsLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const alert = useAlert();

useEffect(() => {
  console.log('LocalStorage contents:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value);
  }
}, []);

 // Add this to App.jsx to debug the auth flow
useEffect(() => {
  const debugAuth = () => {
    const token = getAuthToken();
    const userFromToken = getUserFromToken(token);
    const storedUser = getStoredUser();
    
    console.log('=== AUTH DEBUG ===');
    console.log('Token exists:', !!token);
    console.log('Token valid:', isTokenValid(token));
    console.log('User from token:', userFromToken);
    console.log('Stored user:', storedUser);
    console.log('User state:', user);
    console.log('==================');
  };
  
  debugAuth();
}, [user]); // Run when user state changes

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAuthToken();

        if (token && isValidTokenFormat(token)) {
          if (isTokenValid(token)) {
            const userData = getUserFromToken(token);
            if (userData) {
              // Ensure user has an id property
              const userWithId = {
                ...userData,
                id: userData.id || userData._id || `user-${Date.now()}`
              };
              setUser(userWithId);
              setStoredUser(userWithId);
            } else {
              const storedUser = getStoredUser();
              if (storedUser) {
                // Ensure stored user has an id property
                const userWithId = {
                  ...storedUser,
                  id: storedUser.id || storedUser._id || `user-${Date.now()}`
                };
                setUser(userWithId);
              }
            }
          } else {
            console.warn("Token is invalid or expired");
            removeAuthToken();
            alert.info("Your session has expired. Please log in again.");
          }
        } else if (token) {
          console.warn("Invalid token format found, cleaning up");
          removeAuthToken();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        removeAuthToken();
        alert.error("Authentication error. Please log in again.");
      } finally {
        setIsLoading(false);
        setTimeout(() => setShowLoader(false), 1000);
      }
    };

    initializeAuth();
  }, [alert, setUser]);

  // Login function
  const login = (token, userData) => {
    setAuthToken(token);

    // Ensure user has an id property
    const normalizedUser = {
      ...userData,
      id: userData.id || userData._id || `user-${Date.now()}`,
      role: userData.role || "user",
    };

    setUser(normalizedUser);
    setStoredUser(normalizedUser);
    alert.success(`Welcome back, ${normalizedUser.name || normalizedUser.email}!`);

    setTimeout(() => {
      if (normalizedUser.role.toLowerCase() === "admin") {
        window.location.href = `/admin/${normalizedUser.id}/dashboard`;
      } else {
        window.location.href = `/user/${normalizedUser.id}/dashboard`;
      }
    }, 100);
  };

  // Logout function
  const logout = () => {
    removeAuthToken();
    setUser(null);
    alert.info("You have been logged out successfully.");
    window.location.href = "/";
  };

  // Show loader on first load
  if (showLoader || isLoading) {
    return (
      <Loader
        type="spinner"
        size="large"
        color="#FF7E45"
        text="Loading St Michael's Church..."
        fullScreen={true}
        timeout={8000}
        onTimeout={() => console.log("App loading taking longer than expected")}
        timeoutMessage="Still loading... Thank you for your patience"
        showTimeoutMessage={true}
      />
    );
  }

  return (
    <Router>
      <div className="app">
        <Header user={user} logout={logout} />

        <main className="main-content">
          <Suspense
            fallback={
              <Loader type="spinner" text="Loading page..." fullScreen={false} />
            }
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage user={user} />} />
              <Route path="/sermons" element={<SermonsPage user={user} />} />
              <Route path="/donate" element={<DonatePage user={user} />} />
              <Route path="/blog" element={<BlogPage user={user} />} />
              <Route path="/ministries" element={<MinistriesPage user={user} />} />
              <Route path="/testimonials" element={<TestimonialsPage user={user} />} />
              <Route path="/prayer" element={<PrayerPage user={user} />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<PasswordPage />} />
              <Route path="/reset-password" element={<PasswordPage />} />
              <Route path="/change-password" element={<PasswordPage />} />

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage login={login} />} />

              {/* Protected Routes */}
              {user && user.id && (
                <>
                  <Route
                    path={`/admin/:userId/dashboard`}
                    element={
                      <ProtectedRoute user={user} requiredRole="admin">
                        <AdminPage user={user} />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path={`/user/:userId/dashboard`}
                    element={
                      <ProtectedRoute user={user} requiredRole="user">
                        <UserPage user={user} />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path={`/profile/:userId`}
                    element={
                      <ProtectedRoute user={user}>
                        <ProfilePage user={user} />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path={`/my-rsvps/:userId`}
                    element={
                      <ProtectedRoute user={user}>
                        <MyRsvpsPage user={user} />
                      </ProtectedRoute>
                    }
                  />
                </>
              )}

              {/* Dashboard redirect based on role */}
              <Route
                path="/dashboard"
                element={
                  user && user.id ? (
                    user.role === "admin" ? (
                      <Navigate to={`/admin/${user.id}/dashboard`} replace />
                    ) : (
                      <Navigate to={`/user/${user.id}/dashboard`} replace />
                    )
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default App;