import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../utils/api";
import Loader from "../components/Loader";
import { useAlert } from "../utils/Alert";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const alert = useAlert();

  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error', 'expired'
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [userEmail, setUserEmail] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    document.title =
      "SMC: - Verify-Email | St. Micheal`s & All Angels Church | Ifite-Awka";

    if (email) {
      setUserEmail(email);
    }

    if (!token) {
      setStatus("error");
      setIsLoading(false);
      alert.error(
        "Invalid verification link. Please check your email for the correct link.",
      );
      return;
    }

    verifyEmailToken();
  }, [token, email]);

  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (status === "success" && countdown === 0) {
      navigate("/login");
    }
  }, [status, countdown, navigate]);

  const verifyEmailToken = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.post("/auth/verify-email", { token });

      if (response.success) {
        setStatus("success");
        alert.success(
          "Email verified successfully! You can now log in to your account.",
        );
      } else {
        setStatus("error");
        alert.error(
          response.message || "Email verification failed. Please try again.",
        );
      }
    } catch (error) {
      console.error("Email verification error:", error);

      if (
        error.response?.status === 400 &&
        error.response?.data?.code === "EXPIRED_TOKEN"
      ) {
        setStatus("expired");
        alert.info(
          "Your verification link has expired. Please request a new one.",
        );
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.code === "INVALID_TOKEN"
      ) {
        setStatus("error");
        alert.error(
          "Invalid verification token. Please check your email for the correct link.",
        );
      } else if (
        error.response?.status === 409 &&
        error.response?.data?.code === "ALREADY_VERIFIED"
      ) {
        setStatus("success");
        alert.info(
          "Your email has already been verified. You can log in to your account.",
        );
      } else {
        setStatus("error");
        alert.error("Email verification failed. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.post("/auth/resend-verification", {
        email: userEmail,
      });

      if (response.success) {
        alert.success("Verification email sent! Please check your inbox.");
      } else {
        alert.error(
          response.message ||
            "Failed to send verification email. Please try again.",
        );
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      alert.error("Failed to send verification email. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const handleGoToHome = () => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <Loader type="spinner" text="Verifying your email..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              {status === "success" ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-green-500 text-3xl" />
                </div>
              ) : status === "error" ? (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-times text-red-500 text-3xl" />
                </div>
              ) : status === "expired" ? (
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-500 text-3xl" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-envelope text-blue-500 text-3xl" />
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-2">
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
              {status === "expired" && "Link Expired"}
            </h1>

            <p className="text-gray-600">
              {status === "success" &&
                "Your email has been successfully verified."}
              {status === "error" && "We couldn't verify your email address."}
              {status === "expired" && "Your verification link has expired."}
            </p>
          </div>

          {/* Content based on status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {status === "success" && (
              <div className="text-center">
                <p className="mb-6">
                  Thank you for verifying your email address. You will be
                  redirected to the login page in {countdown} seconds.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleGoToLogin}
                    className="w-full bg-[#FF7E45] text-white py-2 px-4 rounded-md hover:bg-[#FFA76A] transition-colors"
                  >
                    Go to Login Now
                  </button>
                  <button
                    onClick={handleGoToHome}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Go to Homepage
                  </button>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="text-center">
                <p className="mb-6">
                  There was a problem verifying your email address. This could
                  be due to an invalid or malformed verification link.
                </p>
                <div className="space-y-3">
                  {userEmail && (
                    <button
                      onClick={resendVerificationEmail}
                      className="w-full bg-[#FF7E45] text-white py-2 px-4 rounded-md hover:bg-[#FFA76A] transition-colors"
                    >
                      Resend Verification Email
                    </button>
                  )}
                  <button
                    onClick={handleGoToHome}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Go to Homepage
                  </button>
                </div>
              </div>
            )}

            {status === "expired" && (
              <div className="text-center">
                <p className="mb-6">
                  Your verification link has expired. Verification links are
                  valid for 24 hours. Please request a new verification email.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={resendVerificationEmail}
                    className="w-full bg-[#FF7E45] text-white py-2 px-4 rounded-md hover:bg-[#FFA76A] transition-colors"
                  >
                    Send New Verification Email
                  </button>
                  <button
                    onClick={handleGoToHome}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Go to Homepage
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help section */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Need help? Contact our support team at{" "}
              <a
                href="mailto:support@church.org"
                className="text-[#FF7E45] hover:underline"
              >
                support@church.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
