import axios from 'axios';
import { getAuthToken, removeAuthToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request timing interceptor (for performance monitoring)
axiosInstance.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    return config;
  }
);

// Add request interceptor for authentication
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor with enhanced error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Add duration tracking
    if (response.config.metadata) {
      response.config.metadata.endTime = Date.now();
      response.duration = response.config.metadata.endTime - response.config.metadata.startTime;
      
      // Optional: log request duration for performance monitoring
      console.debug(`API Request: ${response.config.url} took ${response.duration}ms`);
    }
    
    return response.data;
  },
  async (error) => {
    // Handle 401 unauthorized errors
    if (error.response?.status === 401) {
      removeAuthToken();
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Retry logic for network errors (no response received)
    if (!error.response && error.config) {
      error.config.retry = error.config.retry || 0;
      
      // Retry up to 3 times for network errors
      if (error.config.retry < 3) {
        error.config.retry += 1;
        
        // Add exponential backoff delay: 1s, 2s, 4s
        const delay = Math.pow(2, error.config.retry - 1) * 1000;
        
        console.warn(`Retrying request ${error.config.url} (attempt ${error.config.retry}) after ${delay}ms`);
        
        return new Promise((resolve) => 
          setTimeout(() => resolve(axiosInstance(error.config)), delay)
        );
      }
    }
    
    // For other errors, add additional context if available
    if (error.response) {
      // Enhance error object with more context
      error.apiError = {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      };
    }
    
    return Promise.reject(error);
  }
);

// Export with the same interface as original
export const apiClient = {
  get: (endpoint, config) => axiosInstance.get(endpoint, config),
  post: (endpoint, data, config) => axiosInstance.post(endpoint, data, config),
  put: (endpoint, data, config) => axiosInstance.put(endpoint, data, config),
  delete: (endpoint, config) => axiosInstance.delete(endpoint, config),
  
  // Optional: Add additional utility methods
  withTimeout: (timeout) => {
    const instanceWithTimeout = axiosInstance.create();
    instanceWithTimeout.defaults.timeout = timeout;
    return instanceWithTimeout;
  }
};