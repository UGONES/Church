import React, { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
  getStoredUser
} from "./utils/auth";
import { useAlert } from "./utils/Alert";
import "./index.css";

// Lazy load pages for better performance
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
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const UserPage = lazy(() => import("./pages/UserPage"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const PasswordPage = lazy(() => import("./pages/PasswordPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const alert = useAlert();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAuthToken();
        
        // Check if token exists and has valid format
        if (token && isValidTokenFormat(token)) {
          if (isTokenValid(token)) {
            const userData = getUserFromToken(token);
            if (userData) {
              setUser(userData);
            } else {
              // Fallback to stored user data if token decoding fails
              const storedUser = getStoredUser();
              if (storedUser) {
                setUser(storedUser);
              }
            }
          } else {
            // Token is expired or invalid
            console.warn("Token is invalid or expired");
            removeAuthToken();
            alert.info("Your session has expired. Please log in again.");
          }
        } else if (token) {
          // Token exists but has invalid format - clean it up
          console.warn("Invalid token format found, cleaning up");
          removeAuthToken();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear any invalid auth data
        removeAuthToken();
        alert.error("Authentication error. Please log in again.");
      } finally {
        setIsLoading(false);

        // Hide loader after a minimum time to prevent flash
        setTimeout(() => {
          setShowLoader(false);
        }, 1000);
      }
    };

    initializeAuth();
  }, [alert]);

  const login = (token, userData) => {
    try {
      setAuthToken(token);
      setUser(userData);
      alert.success(`Welcome back, ${userData.name || userData.email}!`);
    } catch (error) {
      console.error("Login error:", error);
      alert.error("Failed to complete login. Please try again.");
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    alert.info("You have been logged out successfully.");
  };

  // Show full-page loader during initial app loading
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
          <Suspense fallback={
            <Loader 
              type="spinner" 
              text="Loading page..." 
              fullScreen={false}
            />
          }>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage user={user} />} />
              <Route path="/sermons" element={<SermonsPage user={user} />} />
              <Route path="/donate" element={<DonatePage user={user} />} />
              <Route path="/blog" element={<BlogPage user={user} />} />
              <Route path="/ministries" element={<MinistriesPage user={user} />} />
              <Route path="/testimonials" element={<TestimonialsPage user={user} />} />
              <Route path="/prayer" element={<PrayerPage user={user} />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<PasswordPage />} />
              <Route path="/reset-password" element={<PasswordPage />} />
              <Route path="/change-password" element={<PasswordPage />} />
              <Route
                path="/login"
                element={
                  user ? (
                    <HomePage />
                  ) : (
                    <LoginPage login={login} />
                  )
                }
              />

              {/* Protected Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute user={user} requiredRole="admin">
                    <AdminPage user={user} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute user={user}>
                    <ProfilePage user={user} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-rsvps"
                element={
                  <ProtectedRoute user={user} requiredRole="user">
                    <UserPage user={user} />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route for 404 pages */}
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