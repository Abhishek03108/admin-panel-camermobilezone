import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  withCredentials: true, // send/receive httpOnly admin auth cookies
});

let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthRoute = originalRequest?.url?.includes("/auth/login") || originalRequest?.url?.includes("/auth/refresh-token");

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh finishes.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post("/auth/refresh-token");
        isRefreshing = false;
        flushQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        flushQueue(refreshError);
        // Refresh failed — session is truly over, send the user to login.
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extracts a clean, human-readable message from any API error — every
 * backend error already has a professional `message`, this just makes
 * sure the UI never falls back to a raw axios/network error string.
 */
export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export function getErrorDetails(error) {
  return error?.response?.data?.details || null;
}

export default apiClient;
