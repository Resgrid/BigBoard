import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { logger } from '@/lib/logging';
import { getBaseApiUrl } from '@/lib/storage/app';
import useAuthStore from '@/stores/auth/store';

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: getBaseApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're refreshing the token
let isRefreshing = false;
// Store pending requests
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }
    // Handle 401 errors
    if (error.response?.status === 401 && !(originalRequest as InternalAxiosRequestConfig & { _retry?: boolean })._retry) {
      if (isRefreshing) {
        // If refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Add _retry property to request config type
      (originalRequest as InternalAxiosRequestConfig & { _retry: boolean })._retry = true;
      isRefreshing = true;

      try {
        // Delegate to the auth store so the timer scheduler and this interceptor share one refresh
        await useAuthStore.getState().refreshAccessToken();

        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
          throw new Error('Token refresh failed');
        }

        // Update Authorization header
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        // Refresh failure already triggers logout in the auth store
        logger.error({
          message: 'Token refresh failed',
          context: { error: refreshError instanceof Error ? refreshError.message : String(refreshError) },
        });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Export configured axios instance
export const api = axiosInstance;

// Helper function to create API endpoints
export const createApiEndpoint = (endpoint: string) => {
  return {
    get: <T,>(params?: Record<string, unknown>, signal?: AbortSignal) => api.get<T>(endpoint, { params, signal }),
    post: <T,>(data: Record<string, unknown>, signal?: AbortSignal) => api.post<T>(endpoint, data, { signal }),
    put: <T,>(data: Record<string, unknown>, signal?: AbortSignal) => api.put<T>(endpoint, data, { signal }),
    delete: <T,>(params?: Record<string, unknown>, signal?: AbortSignal) => api.delete<T>(endpoint, { params, signal }),
  };
};
