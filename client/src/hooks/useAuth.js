import { useState, useEffect } from 'react';
import { 
  getAuthToken, 
  isTokenValid, 
  getUserFromToken, 
  checkAndRefreshAuthToken, 
  clearAllAuthData,
  getTokenExpiryTime 
} from '../utils/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAndRefreshToken = async (token) => {
    try {
      // Check if token is expiring soon (e.g., within 5 minutes)
      if (getTokenExpiryTime(token)) {
        const newToken = await checkAndRefreshAuthToken();
        if (newToken) {
          token = newToken;
        }
      }
      
      if (isTokenValid(token)) {
        const userData = getUserFromToken(token);
        setUser(userData);
        setError(null);
      } else {
        // Token is invalid, clear it
        clearAllAuthData();
        setUser(null);
      }
    } catch (err) {
      console.error('Token validation/refresh failed:', err);
      clearAllAuthData();
      setUser(null);
      setError('Authentication failed');
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAuthToken();
        
        if (token) {
          await checkAndRefreshToken(token);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        setError('Authentication initialization failed');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Optional: Set up token refresh interval if needed
    const refreshInterval = setInterval(async () => {
      const token = getAuthToken();
      if (token && getTokenExpiryTime(token)) {
        await checkAndRefreshToken(token);
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      // This would be your new login function from auth utils
      const { token, user: userData } = await loginUser(credentials);
      setUser(userData);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAllAuthData();
    setUser(null);
    setError(null);
    // Optional: Call logout API endpoint if needed
  };

  return { 
    user, 
    isLoading, 
    error,
    login,
    logout,
    refreshToken: () => {
      const token = getAuthToken();
      if (token) return checkAndRefreshToken(token);
    }
  };
};