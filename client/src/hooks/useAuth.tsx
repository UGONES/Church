import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/apiService';
import { getAuthToken, setAuthToken, removeAuthToken, getUserFromToken, getStoredUser, setStoredUser as persistUser, isValidTokenFormat, isTokenValid } from '../utils/auth';

// Types
export type User = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  setUser: (u: User | null) => void;
};

const DEFAULT_USER: User | null = null;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [token, setToken] = useState<string | null>(getAuthToken() || null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const existingToken = getAuthToken();
        if (existingToken && isValidTokenFormat(existingToken) && isTokenValid(existingToken)) {
          const userFromToken = getUserFromToken(existingToken);
          if (userFromToken && typeof userFromToken === 'object') {
            const u = userFromToken as Partial<User> & { _id?: string };
            const normalized = {
              id: u.id || u._id || `user-${Date.now()}`,
              name: u.name || u.email || '',
              email: u.email || '',
              role: (u.role || 'user').toLowerCase()
            };
            setUser(normalized);
            persistUser(normalized);
            setToken(existingToken);
          } else {
            const stored = getStoredUser();
            if (stored) {
              const s = stored as Partial<User> & { _id?: string };
              const normalizedStored: User = {
                id: s.id || s._id || `user-${Date.now()}`,
                name: s.name || s.email || '',
                email: s.email || '',
                role: (s.role || 'user').toLowerCase(),
                ...s
              };
              setUser(normalizedStored);
            }
          }
        } else if (existingToken) {
          // token exists but invalid -> cleanup
          removeAuthToken();
        }
      } catch (err) {
        console.error('Auth initialization error', err);
        removeAuthToken();
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await authService.login(credentials);
      const data = resp?.data ?? resp;
      if (!data?.token) {
        throw new Error(data?.message || 'Invalid login response');
      }
      setAuthToken(data.token);
      const userData = data.user || getUserFromToken(data.token) || {};
      const normalizedUser: User = {
        id: userData.userId || userData.id || `user-${Date.now()}`,
        name: userData.name || userData.fullName || userData.email || '',
        email: userData.email || '',
        role: (userData.role || 'user').toLowerCase()
      };
      setUser(normalizedUser);
      persistUser(normalizedUser);
      setToken(data.token);
      return { success: true, user: normalizedUser };
    } catch (err: any) {
      console.error('Login failed', err);
      const msg = err?.response?.data?.message || err.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      removeAuthToken();
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const refreshToken = async () => {
    const existing = getAuthToken();
    if (!existing) return false;
    // If your API supports refresh endpoint implement here. For now, re-validate token.
    return !!existing && isTokenValid(existing);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, login, logout, refreshToken, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default useAuth;
