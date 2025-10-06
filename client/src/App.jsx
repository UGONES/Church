import { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PageLoader from "./components/Loader";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAlert } from "./utils/Alert";
import "./index.css";
import { useAuth } from "./hooks/useAuth";

// Lazy load pages
const HomePage = lazy(() => import("./pages/HomePage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const SermonsPage = lazy(() => import("./pages/SermonsPage"));
const DonatePage = lazy(() => import("./pages/DonatePage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const MinistriesPage = lazy(() => import("./pages/MinistriesPage"));
const TestimonialsPage = lazy(() => import("./pages/TestimonialsPage"));
const PrayerPage = lazy(() => import("./pages/PrayerPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const MyRsvpsPage = lazy(() => import("./pages/MyRsvpsPage"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const PasswordPage = lazy(() => import("./pages/PasswordPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));

// Dashboards
const UserPage = lazy(() => import("./pages/UserPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

const App = () => {
  const {
    user,
    token,
    isAuthenticated,
    refreshUser,
    loading: authLoading,
    login,
    logout,
  } = useAuth();
  const [showLoader, setShowLoader] = useState(true);
  const alert = useAlert();
  const location = useLocation();

  // Init auth
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (isAuthenticated && !user) {
          await refreshUser();
        }
      } catch (error) {
        console.error("❌ App init auth error:", error);
        alert.error("Authentication error. Please log in again.");
      } finally {
        setTimeout(() => setShowLoader(false), 1000);
      }
    };
    initializeApp();

    // Debug
    console.log("=== AUTH DEBUG ===");
    console.log("Token exists:", !!token);
    console.log("Authenticated:", isAuthenticated);
    console.log("User:", user);
    console.log("==================");
  }, [isAuthenticated, user, token, refreshUser, alert]);

  // Auth handlers
  const handleLogin = async (creds) => await login(creds);
  const handleLogout = async () => await logout();

  if (showLoader || authLoading) {
    return (
      <PageLoader
        type="spinner"
        size="large"
        color="#FF7E45"
        text="Loading St Michael's Church..."
        fullScreen
      />
    );
  }

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Suspense
          fallback={<PageLoader type="spinner" text="Loading page..." />}
        >
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/sermons" element={<SermonsPage />} />
            <Route path="/donate" element={<DonatePage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/ministries" element={<MinistriesPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/prayer" element={<PrayerPage />} />

            {/* Auth */}
            <Route path="/verify-email/:token?" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<PasswordPage />} />
            <Route path="/reset-password" element={<PasswordPage />} />
            <Route path="/change-password" element={<PasswordPage />} />
            <Route
              path="/login"
              element={<LoginPage onLogin={handleLogin} />}
            />

            {/* Errors */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Dashboards */}
            <Route
              path="/user/:id/dashboard"
              element={
                <ProtectedRoute roles={["user"]}>
                  <UserPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/:id/dashboard"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moderator/:id/dashboard"
              element={
                <ProtectedRoute roles={["moderator"]} requireAdmin>
                  <UserPage />
                </ProtectedRoute>
              }
            />

            {/* Profile & RSVPs */}
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute requireAuth>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-rsvps/:id"
              element={
                <ProtectedRoute requireAuth>
                  <MyRsvpsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin area */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* Smart dashboard redirect */}
            <Route
              path="/dashboard"
              element={
                user && user.id ? (
                  <Navigate
                    to={
                      user.role === "admin"
                        ? `/admin/${user.id}/dashboard`
                        : user.role === "moderator"
                          ? `/moderator/${user.id}/dashboard`
                          : `/user/${user.id}/dashboard`
                    }
                    replace
                  />
                ) : (
                  <Navigate to="/login" state={{ from: location }} replace />
                )
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
};

export default App;
