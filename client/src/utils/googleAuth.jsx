import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { apiClient } from './api';
import { authService } from '../constants/apiService';

export const GoogleAuthButton = ({ onSuccess, onError, text = "Continue with Google" }) => {
  const handleSuccess = async (credentialResponse) => {
    try {
      // Decode the JWT token to get user info
      const decoded = jwtDecode(credentialResponse.credential);
      
      // Send the token to your backend for verification
      const response = await apiClient.post('/auth/google', {
        token: credentialResponse.credential
      });

      if (response.success) {
        onSuccess(response.data);
      } else {
        onError(response.message || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google authentication error:', error);
      onError('Failed to authenticate with Google');
    }
  };

  const handleError = () => {
    onError('Google authentication failed');
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError}
      useOneTap
      theme="filled_blue"
      size="large"
      text={text.toLowerCase().includes('sign') ? 'signin_with' : 'continue_with'}
      shape="rectangular"
      width="300"
    />
  );
};

export const handleGoogleLogin = async (token) => {
  try {
    const response = await authService.socialLogin('google', token);
    return response;
  } catch (error) {
    console.error('Google login error:', error);
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
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    }
  });
};

export default GoogleAuthButton;