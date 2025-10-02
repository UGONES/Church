// utils/api.js
import axios from "axios";
import { getAuthToken, removeAuthToken, refreshToken } from "./auth";


const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Track pending requests for deduplication
const pendingRequests = new Map();

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true, // set true if backend uses cookies
});

// Key generator to deduplicate
const getRequestKey = (config) => {
  const { method, url, params, data } = config;
  const normalizedUrl = url?.split("?")[0] || "";
  const safeData =
    data && typeof data === "object" ? JSON.stringify(data) : "";
  const safeParams =
    params && typeof params === "object" ? JSON.stringify(params) : "";
  return `${method?.toUpperCase()}-${normalizedUrl}-${safeParams}-${safeData}`;
};

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  (config) => {
    const requestKey = getRequestKey(config);

    // cancel duplicate
    if (pendingRequests.has(requestKey)) {
      const cancelSource = pendingRequests.get(requestKey);
      cancelSource.cancel("Duplicate request cancelled");
      pendingRequests.delete(requestKey);
    }

    const cancelSource = axios.CancelToken.source();
    config.cancelToken = cancelSource.token;

    config.metadata = {
      startTime: Date.now(),
      requestKey,
    };

    pendingRequests.set(requestKey, cancelSource);

    // attach token
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.debug(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        { params: config.params, data: config.data }
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Prevent retry on login/refresh routes
const isAuthRoute = (url) =>
  url.includes("/auth/login") || url.includes("/auth/refresh");

// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => {
    const requestKey = response.config.metadata?.requestKey;
    if (requestKey && pendingRequests.has(requestKey)) {
      pendingRequests.delete(requestKey);
    }

    if (response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      if (import.meta.env.DEV) {
        console.debug(
          `✅ API Response: ${response.config.url} (${response.status}) took ${duration}ms`
        );
      }
    }

    return response;
  },
  async (error) => {
    const { config } = error;
    const requestKey = config?.metadata?.requestKey;
    if (requestKey && pendingRequests.has(requestKey)) {
      pendingRequests.delete(requestKey);
    }

    if (axios.isCancel(error)) {
      return Promise.resolve({ data: null, cancelled: true });
    }

    // Handle 401 - try refresh if not login/refresh route
    if (
      error.response?.status === 401 &&
      !config._retry &&
      !isAuthRoute(config.url)
    ) {
      config._retry = true;
      try {
        const newToken = await refreshToken();
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(config);
        }
      } catch (refreshError) {
        window.location.href = "/login";
        removeAuthToken();
      }
    }

    // For login/refresh failures → no retry, just reject
    if (isAuthRoute(config?.url)) {
      return Promise.reject(error);
    }

    // Retry logic for temporary server/network errors
    if (!error.response || [502, 503, 504, 429].includes(error.response?.status)) {
      const retryCount = config.metadata?.retryCount || 0;
      if (retryCount < 2) {
        config.metadata.retryCount = retryCount + 1;
        const delay = Math.pow(2, retryCount) * 500;
        return new Promise((resolve) =>
          setTimeout(() => resolve(axiosInstance(config)), delay)
        );
      }
    }

    console.error("💥 API Error:", {
      url: config?.url,
      method: config?.method,
      status: error.response?.status,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

export const isApiError = (error) => axios.isAxiosError(error);

export const getErrorMessage = (
  error,
  defaultMessage = "An unexpected error occurred"
) => {
  if (!error) return defaultMessage;
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.status === 404) return "Resource not found";
    if (error.response?.status === 500)
      return "Internal server error. Please try again later.";
    if (error.code === "NETWORK_ERROR" || !error.response)
      return "Network error. Check your connection.";
  }
  return error.message || defaultMessage;
};

export const apiClient = {
  get: (endpoint, config = {}) => axiosInstance.get(endpoint, config),
  post: (endpoint, data, config = {}) =>
    axiosInstance.post(endpoint, data, config),
  put: (endpoint, data, config = {}) =>
    axiosInstance.put(endpoint, data, config),
  patch: (endpoint, data, config = {}) =>
    axiosInstance.patch(endpoint, data, config),
  delete: (endpoint, config = {}) => axiosInstance.delete(endpoint, config),
};

export const cancelAllPendingRequests = (
  message = "Component unmounted"
) => {
  pendingRequests.forEach((cancelSource) => {
    cancelSource.cancel(message);
  });
  pendingRequests.clear();
};

export const getPendingRequestsCount = () => pendingRequests.size;

export default axiosInstance;
