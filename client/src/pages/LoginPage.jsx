import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../constants/apiService"; // Fixed import path
import { useAlert } from "../utils/Alert";
import { User } from "../models/User";
import {
  setAuthToken,
  validateAdminCode,
  isAdmin,
  getStoredUser,
  isAuthenticated,
  removeAuthToken,
} from "../utils/auth";
import SocialLoginButtons from "../components/SocialLoginButtons"; // Import the SocialLoginButtons component

const LoginPage = ({ login }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const navigate = useNavigate();
  const alert = useAlert();

  // Check if user is already authenticated on component mount
  React.useEffect(() => {
    document.title =
      "SMC: - Sign-In/Sign-Up | St. Micheal`s & All Angels Church | Ifite-Awka";

    if (isAuthenticated()) {
      const user = getStoredUser();
      if (user) {
        navigate(isAdmin() ? "/admin/dashboard" : "/dashboard");
      }
    }
  }, [navigate]);

  const handleSocialSuccess = (userData) => {
    // Set auth token and store user data
    setAuthToken(userData.token);

    const user = new User(userData.user);
    login(userData.token, user);

    alert.success(`Welcome ${user.name || user.email}!`);

    // Redirect based on admin status
    navigate(isAdmin() ? "/admin/dashboard" : "/dashboard");
  };

  const handleSocialError = (error) => {
    setError(error);
    alert.error(error);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const credentials = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const response = await authService.login(credentials);

      if (response.success) {
        const userData = new User(response.data.user);

        // Set auth token and store user data
        setAuthToken(response.data.token);

        if (userData.emailVerified === false) {
          navigate("/verify-email", { state: { email: userData.email } });
          alert.info("Please verify your email address before logging in.");
          return;
        }

        // Check for admin code in localStorage and validate if exists
        const adminCode = formData.get("adminCode");
        if (adminCode) {
          const isAdminValid = await validateAdminCode(adminCode);
          if (isAdminValid) {
            alert.success("Admin privileges granted!");
          }
        }

        login(response.data.token, userData);
        alert.success(`Welcome back, ${userData.name || userData.email}!`);

        // Redirect based on admin status
        navigate(isAdmin() ? "/admin/dashboard" : "/dashboard");
      } else {
        setError(response.message || "Login failed");

        if (response.code === "EMAIL_NOT_VERIFIED") {
          navigate("/verify-email", { state: { email: credentials.email } });
          alert.info("Please verify your email address before logging in.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (error.response?.status === 403) {
        setError("Your account is not activated. Please verify your email.");
        navigate("/verify-email", { state: { email: credentials.email } });
      } else if (error.response?.status === 429) {
        setError("Too many login attempts. Please try again later.");
      } else {
        setError("Login failed. Please try again later.");
      }
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
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      adminCode: formData.get("adminCode") || null,
    };

    if (userData.password !== userData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(userData.password)) {
      setError(
        "Password must be at least 8 characters with uppercase, lowercase, and numbers",
      );
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.register(userData);

      if (response.success) {
        // If admin code was provided and valid, set admin session
        if (userData.adminCode) {
          const isAdminValid = await validateAdminCode(userData.adminCode);
          if (isAdminValid) {
            alert.success("Admin account created successfully!");
          }
        } else {
          alert.success(
            "Account created successfully! Please check your email for verification.",
          );
        }

        navigate("/verify-email", {
          state: {
            email: userData.email,
            isAdmin: userData.adminCode
              ? await validateAdminCode(userData.adminCode)
              : false,
          },
        });
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.status === 400) {
        setError(
          error.response.data.message ||
            "Registration failed. Please check your information.",
        );
      } else if (error.response?.status === 409) {
        setError(
          "Email already exists. Please use a different email or login.",
        );
      } else {
        setError("Registration failed. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = document.querySelector('input[name="email"]')?.value;
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        alert.success("Password reset instructions sent to your email.");
        navigate("/reset-password", { state: { email } });
      } else {
        setError(response.message || "Failed to send reset instructions");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      if (error.response?.status === 404) {
        setError("Email not found. Please check your email address.");
      } else {
        setError("Failed to send reset instructions. Please try again.");
      }
    }
  };

  const toggleAdminCode = () => {
    setShowAdminCode(!showAdminCode);
  };

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case "login":
        setShowLoginPassword(!showLoginPassword);
        break;
      case "register":
        setShowPassword(!showPassword);
        break;
      case "confirm":
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
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
        navigate("/verify-email", { state: { email } });
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      setError("Failed to resend verification email. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <i className="fas fa-church text-[#FF7E45] text-3xl" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">
              St Michael's Church
            </h1>
            <p className="mt-2 text-white/90">
              {isRegistering
                ? "Create your account"
                : "Welcome back to your church community"}
            </p>
          </div>

          {/* Form Section */}
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
              <>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent transition-colors"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        name="password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent transition-colors pr-10"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("login")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <i
                          className={`fas ${showLoginPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Admin Code for Login */}
                  <div className="border-t pt-4">
                    <button
                      type="button"
                      onClick={toggleAdminCode}
                      className="text-sm text-[#FF7E45] hover:text-[#F4B942] mb-2 flex items-center"
                    >
                      <i
                        className={`fas ${showAdminCode ? "fa-eye-slash" : "fa-eye"} mr-2`}
                      />
                      {showAdminCode ? "Hide" : "Show"} Admin Login
                    </button>

                    {showAdminCode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Code
                        </label>
                        <input
                          type="password"
                          name="adminCode"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent transition-colors"
                          placeholder="Enter admin code for privileged access"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="remember"
                        className="h-4 w-4 text-[#FF7E45] focus:ring-[#FF7E45] border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        Remember me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-[#FF7E45] hover:text-[#F4B942] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#FF7E45] to-[#F4B942] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#FFA76A] hover:to-[#F6D365] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt mr-2" />
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                {/* Social Login - Using the new component */}
                <SocialLoginButtons
                  onSuccess={handleSocialSuccess}
                  onError={handleSocialError}
                  loading={isLoading}
                />

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsRegistering(true)}
                      className="text-[#FF7E45] hover:text-[#F4B942] font-semibold transition-colors"
                    >
                      Register now
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent transition-colors pr-10"
                      placeholder="Create a password (min. 8 characters)"
                      minLength="8"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("register")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <i
                        className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must include uppercase, lowercase, and numbers
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent transition-colors pr-10"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <i
                        className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
                      />
                    </button>
                  </div>
                </div>

                {/* Admin Code Section */}
                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={toggleAdminCode}
                    className="text-sm text-[#FF7E45] hover:text-[#F4B942] mb-2 flex items-center"
                  >
                    <i
                      className={`fas ${showAdminCode ? "fa-eye-slash" : "fa-eye"} mr-2`}
                    />
                    {showAdminCode ? "Hide" : "Show"} Admin Registration
                  </button>

                  {showAdminCode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Code (For church staff only)
                      </label>
                      <input
                        type="password"
                        name="adminCode"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent transition-colors"
                        placeholder="Enter admin code if applicable"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This code is only for church administrators and staff
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="terms"
                    className="h-4 w-4 text-[#FF7E45] focus:ring-[#FF7E45] border-gray-300 rounded mt-1"
                    required
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#FF7E45] to-[#F4B942] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#FFA76A] hover:to-[#F6D365] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus mr-2" />
                      Create Account
                    </>
                  )}
                </button>

                {/* Social Login for Registration too */}
                <SocialLoginButtons
                  onSuccess={handleSocialSuccess}
                  onError={handleSocialError}
                  loading={isLoading}
                />

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsRegistering(false)}
                      className="text-[#FF7E45] hover:text-[#F4B942] font-semibold transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-[#FF7E45] hover:text-[#F4B942] transition-colors flex items-center justify-center"
          >
            <i className="fas fa-arrow-left mr-2" />
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
