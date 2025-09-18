import axios from 'axios';
import { getAuthToken, removeAuthToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Track pending requests to prevent duplicates
const pendingRequests = new Map();

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
        const url = config.url || "";

    // Safely handle params & data
    const safeData =
      config.data && Object.keys(config.data).length > 0
        ? JSON.stringify(config.data)
        : "";

    const safeParams =
      config.params && Object.keys(config.params).length > 0
        ? JSON.stringify(config.params)
        : "";

    // Unique key considers method + url + params + data
    const requestKey = `${config.method}-${url}${safeParams ? `-${safeParams}` : ""}${safeData ? `-${safeData}` : ""}`;

    if (pendingRequests.has(requestKey)) {
      console.log("⚠️ Cancelling duplicate request:", requestKey);
      return Promise.reject(new axios.Cancel("Duplicate request cancelled"));
    }

    pendingRequests.set(requestKey, true);
    config.metadata = {
      startTime: Date.now(),
      requestKey,
    };
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
    // Remove from pending requests
    const requestKey = response.config.metadata?.requestKey;
    if (requestKey) {
      pendingRequests.delete(requestKey);
    }
    
    // Add duration tracking
    if (response.config.metadata) {
      response.config.metadata.endTime = Date.now();
      response.duration = response.config.metadata.endTime - response.config.metadata.startTime;
      
      // Optional: log request duration for performance monitoring
      console.debug(`API Request: ${response.config.url} took ${response.duration}ms`);
    }
    
    return response;
  },
  async (error) => {
    // Remove from pending requests
    const requestKey = error.config?.metadata?.requestKey;
    if (requestKey) {
      pendingRequests.delete(requestKey);
    }
    
    // Handle 401 unauthorized errors
    if (error.response?.status === 401) {
      removeAuthToken();
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle duplicate request cancellation
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      return Promise.reject(error);
    }
    
    // Retry logic for network errors (no response received)
    if (!error.response && error.config && !axios.isCancel(error)) {
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