// src/utils/api.js
import axios from "axios";
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  refreshToken,
  getAuthHeaders,
  isTokenValid,
  isValidTokenFormat,
} from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// -------------------------------------------------------
// 🔁 Pending requests registry (for deduplication)
// -------------------------------------------------------
const pendingRequests = new Map();
const getRequestKey = (config) => {
  const { method, url, params, data } = config;
  const normalizedUrl = url?.split("?")[0] || "";
  const safeParams =
    params && typeof params === "object" ? JSON.stringify(params) : "";
  const safeData = data && typeof data === "object" ? JSON.stringify(data) : "";
  return `${method?.toUpperCase()}-${normalizedUrl}-${safeParams}-${safeData}`;
};

// -------------------------------------------------------
// 🧩 Axios instance
// -------------------------------------------------------
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true,
});

// -------------------------------------------------------
// 📤 REQUEST INTERCEPTOR
// -------------------------------------------------------
axiosInstance.interceptors.request.use(
  (config) => {
    const requestKey = getRequestKey(config);

    // cancel duplicates
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
      retryCount: config.metadata?.retryCount || 0,
    };

    pendingRequests.set(requestKey, cancelSource);

    // 🔐 Attach token
    const userId = config.userId || config.headers["X-User-Id"] || null;
    const token = getAuthToken(userId);
    if (token && isValidTokenFormat(token) && isTokenValid(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    if (import.meta.env.DEV) {
      console.debug(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          params: config.params,
          data: config.data,
          userId,
        },
      );
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// -------------------------------------------------------
// 📥 RESPONSE INTERCEPTOR
// -------------------------------------------------------
const isAuthRoute = (url = "") =>
  url.includes("/auth/login") ||
  url.includes("/auth/refresh") ||
  url.includes("/auth/register");

axiosInstance.interceptors.response.use(
  (response) => {
    const { requestKey, startTime } = response.config.metadata || {};
    if (requestKey && pendingRequests.has(requestKey)) {
      pendingRequests.delete(requestKey);
    }
    if (import.meta.env.DEV && startTime) {
      const duration = Date.now() - startTime;
      console.debug(
        `✅ ${response.status} ${response.config.url} (${duration}ms)`,
      );
    }
    return response;
  },
  async (error) => {
    const config = error.config || {};
    const { requestKey } = config.metadata || {};
    if (requestKey && pendingRequests.has(requestKey)) {
      pendingRequests.delete(requestKey);
    }

    // Request manually cancelled
    if (axios.isCancel(error)) {
      return Promise.resolve({ data: null, cancelled: true });
    }

    const status = error.response?.status;
    const url = config.url || "";

    // ---------------------------------------------------
    // 🔁 Handle 401: try refresh token once
    // ---------------------------------------------------
    if (status === 401 && !config._retry && !isAuthRoute(url)) {
      config._retry = true;
      try {
        const newToken = await refreshToken();
        if (newToken && isValidTokenFormat(newToken)) {
          await setAuthToken(newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(config);
        }
      } catch (refreshError) {
        console.warn("🔒 Token refresh failed:", refreshError);
        removeAuthToken();
        window.location.href = "/login";
      }
    }

    // ---------------------------------------------------
    // ⏳ Retry logic for temporary network/server issues
    // ---------------------------------------------------
    const transientErrors = [502, 503, 504, 429];
    if (
      (!error.response || transientErrors.includes(status)) &&
      !isAuthRoute(url)
    ) {
      const retryCount = config.metadata?.retryCount || 0;
      if (retryCount < 2) {
        config.metadata.retryCount = retryCount + 1;
        const delay = Math.pow(2, retryCount) * 500;
        if (import.meta.env.DEV) {
          console.warn(
            `⏳ Retrying ${url} (attempt ${retryCount + 1}) after ${delay}ms`,
          );
        }
        return new Promise((resolve) =>
          setTimeout(() => resolve(axiosInstance(config)), delay),
        );
      }
    }

    console.error("💥 API Error:", {
      method: config.method,
      url,
      status,
      message: error.message,
      response: error.response?.data,
    });

    return Promise.reject(error);
  },
);

// -------------------------------------------------------
// 🧭 Utility exports
// -------------------------------------------------------
export const isApiError = (error) => axios.isAxiosError(error);

export const getErrorMessage = (
  error,
  fallback = "An unexpected error occurred",
) => {
  if (!error) return fallback;
  if (axios.isAxiosError(error)) {
    const res = error.response;
    if (res?.data?.message) return res.data.message;
    switch (res?.status) {
      case 400:
        return "Bad request. Please check your input.";
      case 401:
        return "Unauthorized. Please log in again.";
      case 403:
        return "Access denied.";
      case 404:
        return "Resource not found.";
      case 500:
        return "Internal server error.";
      default:
        break;
    }
    if (!res) return "Network error. Please check your connection.";
  }
  return error.message || fallback;
};

// -------------------------------------------------------
// 🌍 Core client
// -------------------------------------------------------
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

// -------------------------------------------------------
// 🧹 Cancel all pending requests
// -------------------------------------------------------
export const cancelAllPendingRequests = (message = "Component unmounted") => {
  pendingRequests.forEach((cancelSource) => cancelSource.cancel(message));
  pendingRequests.clear();
};

export const getPendingRequestsCount = () => pendingRequests.size;

export default axiosInstance;
