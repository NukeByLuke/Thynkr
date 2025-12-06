/**
 * Axios API Client Configuration
 * Centralized HTTP client with authentication, token refresh, and error handling.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Configured axios instance for API requests
 * - Includes credentials for CORS
 * - Automatic token attachment and refresh
 */
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/**
 * Request interceptor - attaches JWT token and handles FormData
 */
api.interceptors.request.use(
  (config) => {
    // Attach access token to all requests
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // If sending FormData, ensure we don't force JSON headers
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers && 'Content-Type' in config.headers) {
        delete (config.headers as any)['Content-Type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handles 401 errors and automatic token refresh
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint with refresh token in body
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {
            refreshToken,
          },
          {
            withCredentials: true,
          }
        );

        const { accessToken: newAccessToken } = refreshResponse.data;
        localStorage.setItem('accessToken', newAccessToken);

        // Update the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Retry original request with new access token
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
