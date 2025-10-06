import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { authService } from "../services/apiService";
import { useAlert } from "../utils/Alert";
import { useAuth } from "../hooks/useAuth";
import User from "../models/User";
import { setAuthToken, isAdminOrModerator } from "../utils/auth";
import SocialLoginButtons from "../components/SocialLoginButtons";

const LoginPage = () => {
  // UI State
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [showPassword, setShowPassword] = useState({
    login: false,
    register: false,
    confirm: false,
    admin: false,
  });

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const alert = useAlert();
  const { user, login } = useAuth();

  // ✅ Redirect if already logged in
  useEffect(() => {
    document.title = `SMC: | ${!isRegistering ? "Sign In" : "Register"} | St. Michael's & All Angels Church | Ifite-Awka`;

    if (user && user.id) {
      const redirectTo =
        location.state?.from?.pathname ||
        (["admin", "moderator"].includes(user.role)
          ? `/admin/${user.id}/dashboard`
          : `/user/${user.id}/dashboard`);
      navigate(redirectTo, { replace: true });
    }
  }, [user, isRegistering, navigate, location]);

  // --- Utility ---
  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleAdminCode = () => {
    setShowAdminCode((prev) => !prev);
  };

  // --- Handlers ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData(e.target);
      const credentials = {
        email: formData.get("email")?.toString().trim() || "",
        password: formData.get("password")?.toString() || "",
        adminCode: formData.get("adminCode")?.toString().trim() || undefined,
      };

      // Client-side validation
      if (!credentials.email || !credentials.password) {
        setError("Email and password are required");
        return;
      }

      if (!/\S+@\S+\.\S+/.test(credentials.email)) {
        setError("Please enter a valid email address");
        return;
      }

      if (credentials.password.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }

      const result = await login(credentials);

      if (result.success) {
        alert.success(
          `Welcome back, ${result.user.name || result.user.email}!`,
        );
        localStorage.removeItem("pendingVerificationEmail");
      } else if (result.requiresVerification) {
        navigate("/verify-email", {
          state: {
            email: result.email,
            message: "Email verification required",
          },
        });
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const userData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      adminCode: formData.get("adminCode")?.trim() || undefined,
    };

    if (userData.password !== userData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.register(userData);
      const data = response.data || response;

      if (data.success) {
        alert.success(
          data.message ||
            "Registration successful! Please check your email to verify your account.",
        );
        localStorage.setItem("pendingVerificationEmail", userData.email);
        navigate("/verify-email", {
          state: {
            email: userData.email,
            message: "Please verify your email.",
          },
        });
      } else {
        setError(data.message || "Registration failed.");
        alert.error(data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Registration failed.";
      setError(errorMsg);
      alert.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = document.querySelector('input[name="email"]')?.value;
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    try {
      const response = await authService.forgotPassword(email);
      const data = response.data || response;
      if (data.success) {
        alert.success("Password reset instructions sent to your email.");
        navigate("/reset-password", { state: { email } });
      } else {
        setError(data.message || "Failed to send reset instructions.");
        alert.error(data.message || "Failed to send reset instructions.");
      }
    } catch {
      alert.success(
        "If an account exists with this email, reset instructions have been sent.",
      );
      navigate("/reset-password", { state: { email } });
    }
  };

  const handleResendVerification = async () => {
    const email = document.querySelector('input[name="email"]')?.value;
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    try {
      const response = await authService.resendVerification(email);
      if (response.success) {
        alert.success("Verification email sent successfully!");
        navigate(`/verify-email:${response.token}`, { state: { email } });
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      setError("Failed to resend verification email. Please try again.");
    }
  };

  const handleSocialSuccess = (userData) => {
    setAuthToken(userData.token);
    const user = new User(userData.user);
    login(userData.token, user);
    alert.success(`Welcome ${user.name || user.email}!`);
    navigate(
      isAdminOrModerator()
        ? `/admin/${user.id}/dashboard`
        : `/user/${user.id}/dashboard`,
    );
  };

  const handleSocialError = (error) => {
    setError(error);
    alert.error(error);
  };

  // --- Render ---
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-radial from-gray-100 via-gray-200 to-gray-300">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
              <i className="fas fa-church text-[#FF7E45] text-3xl" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              St Michael's Church
            </h1>
            <p className="mt-2 text-white/90">
              {isRegistering
                ? "Create your account"
                : "Welcome back to your community"}
            </p>
          </div>

          {/* Forms */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm flex items-center">
                  <i className="fas fa-exclamation-circle mr-2" />
                  {error}
                </p>
                {(error.includes("verify") || error.includes("activated")) && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-blue-600 text-xs mt-2 hover:underline"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            )}

            {!isRegistering ? (
              // login page
              <form onSubmit={handleLogin} className="space-y-6 bg-transparent">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-dark-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="true"
                    required
                    className="mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-dark-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.login ? "text" : "password"}
                      name="password"
                      autoComplete="true"
                      required
                      className="mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("login")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                      aria-label="Toggle password visibility"
                    >
                      <i
                        className={`fas ${showPassword.login ? "fa-eye-slash" : "fa-eye"}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Admin Code */}
                <div className="border-t text-gray-300 pt-4">
                  <button
                    type="button"
                    onClick={toggleAdminCode}
                    className="text-sm text-[#FF7E45] hover:text-[#F4B942] flex items-center"
                  >
                    <i
                      className={`fas ${showAdminCode ? "fa-eye-slash" : "fa-eye"} mr-2`}
                    />
                    {showAdminCode ? "Hide" : "Show"} Admin Login
                  </button>

                  {showAdminCode && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium">
                        Admin Code
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.admin ? "text" : "password"}
                          name="adminCode"
                          autoComplete="true"
                          className="mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent pr-10"
                          placeholder="Enter admin code"
                          required={isAdminOrModerator()}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("admin")}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                          aria-label="Toggle admin code visibility"
                        >
                          <i
                            className={`fas ${showPassword.admin ? "fa-eye-slash" : "fa-eye"}`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Forgot + Remember */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      autoComplete="true"
                      name="remember"
                      className="h-4 w-4 text-[#FF7E45] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-[#FF7E45] hover:text-[#F4B942]"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-[#FF7E45] to-[#F4B942] hover:from-[#FFA76A] hover:to-[#F6D365] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <i className="fas fa-spinner fa-spin mr-2" />
                  ) : (
                    <i className="fas fa-sign-in-alt mr-2" />
                  )}
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>

                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600">
                    Don’t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsRegistering(true)}
                      className="text-[#FF7E45] hover:text-[#F4B942] font-semibold"
                    >
                      Register now
                    </button>
                  </p>
                </div>
                {/* Social Login - Using the new component */}
                {/* <SocialLoginButtons
                  onSuccess={handleSocialSuccess}
                  onError={handleSocialError}
                  loading={isLoading}
                /> */}
              </form>
            ) : (
              // sign up page
              <form onSubmit={handleRegister} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-dark-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    autoComplete="true"
                    required
                    className="mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    autoComplete="true"
                    required
                    className="mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-dark-700">
                    Email
                  </label>
                  <input
                    type="email"
                    autoComplete="true"
                    name="email"
                    required
                    className="mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-dark-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.register ? "text" : "password"}
                      name="password"
                      minLength="8"
                      autoComplete="true"
                      required
                      className="mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent pr-10"
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("register")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                    >
                      <i
                        className={`fas ${showPassword.register ? "fa-eye-slash" : "fa-eye"}`}
                      />
                    </button>
                  </div>
                </div>
                {/* Confirm */}
                <div>
                  <label className="block text-sm font-medium text-dark-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="true"
                      required
                      className="mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent pr-10"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                    >
                      <i
                        className={`fas ${showPassword.confirm ? "fa-eye-slash" : "fa-eye"}`}
                      />
                    </button>
                  </div>
                </div>
                {/* Admin Code */}
                <div className="border-t text-gray-300 pt-4">
                  <button
                    type="button"
                    onClick={toggleAdminCode}
                    className="text-sm text-[#FF7E45] hover:text-[#F4B942] flex items-center"
                  >
                    <i
                      className={`fas ${showAdminCode ? "fa-eye-slash" : "fa-eye"} mr-2`}
                    />
                    {showAdminCode ? "Hide" : "Show"} Admin Registration
                  </button>
                  {showAdminCode && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium ">
                        Admin Code (for staff only)
                      </label>
                      <input
                        type="password"
                        autoComplete="true"
                        name="adminCode"
                        className="mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                        placeholder="Enter admin code"
                      />
                    </div>
                  )}
                </div>
                {/* Terms */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="terms"
                    required
                    className="h-4 w-4 text-[#FF7E45] border-gray-300 rounded mt-1"
                  />
                  <label className="ml-2 text-sm text-gray-600">
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="text-[#FF7E45] hover:text-[#F4B942]"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="text-[#FF7E45] hover:text-[#F4B942]"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-[#FF7E45] to-[#F4B942] hover:from-[#FFA76A] hover:to-[#F6D365] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <i className="fas fa-spinner fa-spin mr-2" />
                  ) : (
                    <i className="fas fa-user-plus mr-2" />
                  )}
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>
                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsRegistering(false)}
                      className="text-[#FF7E45] hover:text-[#F4B942] font-semibold"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Back Home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-[#FF7E45] hover:text-[#F4B942] flex items-center justify-center"
          >
            <i className="fas fa-arrow-left mr-2" /> Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
