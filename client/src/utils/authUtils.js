import { authService } from '../constants/apiService';

// Initialize Google Auth
export const initGoogleAuth = (clientId) => {
  return new Promise((resolve) => {
    if (window.google) {
      resolve(true);
    } else {
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

// Initialize Facebook Auth
export const initFacebookAuth = (appId) => {
  return new Promise((resolve) => {
    if (window.FB) {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      resolve(true);
    } else {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        resolve(true);
      };

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    }
  });
};

// Handle social login response
export const handleSocialLogin = async (provider, token) => {
  try {
    const response = await authService.socialLogin(provider, token);
    
    if (response.success) {
      // Store user data and tokens
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);
      
      return response.data;
    } else {
      throw new Error(response.message || 'Social login failed');
    }
  } catch (error) {
    console.error(`${provider} login error:`, error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) return false;
  
  try {
    const userData = JSON.parse(user);
    return !!userData && !!token;
  } catch {
    return false;
  }
};

// Get current user
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

// Logout
export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  // Additional cleanup if needed
};

export default {
  initGoogleAuth,
  initFacebookAuth,
  handleSocialLogin,
  isAuthenticated,
  getCurrentUser,
  logout
};