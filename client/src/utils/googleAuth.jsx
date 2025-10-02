import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { socialAuthService, authService } from "../services/apiService";

export const GoogleAuthButton = ({
  onSuccess,
  onError,
  text = "Continue with Google",
}) => {
  const handleSuccess = async (credentialResponse) => {
    try {
      // Send token to backend for validation
      const response = await socialAuthService.validateGoogleToken(
        credentialResponse.credential,
      );

      if (response.success) {
        onSuccess(response.data);
      } else {
        onError(response.message || "Google authentication failed");
      }
    } catch (error) {
      console.error("Google authentication error:", error);
      onError(
        error.response?.data?.message || "Failed to authenticate with Google",
      );
    }
  };

  const handleError = () => {
    onError("Google authentication was cancelled");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap={false}
        size="large"
        text={
          text.toLowerCase().includes("sign") ? "signin_with" : "continue_with"
        }
        shape="rectangular"
        logo_alignment="left"
      />
    </GoogleOAuthProvider>
  );
};

// Alternative: Direct redirect method
export const redirectToGoogleLogin = () => {
  socialAuthService.googleLogin();
};

export const handleGoogleLogin = async (token) => {
  try {
    const response = await authService.socialLogin("google", token);
    return response;
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
};

export const initGoogleAuth = (clientId) => {
  // This function can be used to initialize Google Auth SDK if needed
  return new Promise((resolve) => {
    // Google SDK is typically loaded via script tag in index.html
    if (window.google) {
      resolve(true);
    } else {
      // Fallback: load the script dynamically
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    }
  });
};

export default GoogleAuthButton;
