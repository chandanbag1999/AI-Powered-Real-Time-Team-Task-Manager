import axios, { AxiosError } from "axios";
import type { AxiosRequestConfig } from "axios";
import { toast } from "sonner";

// Create the axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,    // Send cookies if needed
});

// Store for failed requests that will be retried after token refresh
let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
  config: AxiosRequestConfig;
}[] = [];

// Process the failed queue
const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else {
      request.resolve(apiClient(request.config));
    }
  });
  failedQueue = [];
};

// We'll use this function to handle auth logout to avoid circular dependencies
let logoutHandler: () => void;
export const setLogoutHandler = (handler: () => void) => {
  logoutHandler = handler;
};

// Helper function to get the access token from localStorage
export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

// Helper function to get the refresh token from localStorage
export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

// Helper function to save the access token to localStorage
export const setAccessToken = (token: string) => {
  localStorage.setItem("accessToken", token);
};

// Helper function to save the refresh token to localStorage
export const setRefreshToken = (token: string) => {
  localStorage.setItem("refreshToken", token);
};

// Helper function to remove the access token from localStorage
export const removeAccessToken = () => {
  localStorage.removeItem("accessToken");
};

// Helper function to remove the refresh token from localStorage
export const removeRefreshToken = () => {
  localStorage.removeItem("refreshToken");
};

// Request interceptor to add the auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token refresh and maintenance mode
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle maintenance mode (503 Service Unavailable)
    if (error.response?.status === 503 && error.response?.data?.maintenanceMode) {
      // Show maintenance mode message
      toast.error("System is currently in maintenance mode. Please try again later.", {
        duration: 10000, // longer duration for this important message
        id: "maintenance-mode", // prevent duplicate toasts
      });
      
      // Redirect to maintenance page or login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }

    // If error is not 401 or request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Set retry flag
    originalRequest._retry = true;

    // If refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    isRefreshing = true;

    try {
      console.log("Attempting to refresh token");
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      
      const res = await apiClient.post("/auth/refresh", { refreshToken });
      console.log("Token refresh response:", res.data);
      
      // Save the new access token
      if (res.data.accessToken) {
        setAccessToken(res.data.accessToken);
      }
      
      // Process the queue with no error
      processQueue(null);
      
      // Retry the original request
      return apiClient(originalRequest);
    } catch (refreshError) {
      console.error("Token refresh failed:", refreshError);
      
      // If refresh fails, call the logout handler if it's defined
      if (logoutHandler) {
        removeAccessToken();
        removeRefreshToken();
        logoutHandler();
      }
      
      processQueue(refreshError as AxiosError);
      
      // Show error toast
      toast.error("Your session has expired. Please log in again.");
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;