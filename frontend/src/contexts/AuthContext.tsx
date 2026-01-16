/**
 * Authentication Context
 * Manages user authentication state, login/logout, and token refresh across the application.
 * Optimized with request caching to prevent duplicate auth calls.
 */

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { User, LoginCredentials, RegisterData } from '@/types';
import api from '@/lib/api';
import { cachedRequest, clearCache } from '@/lib/apiCache';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
  apiClient: typeof api;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Wraps app to provide authentication state and methods
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchUser = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Use cached request to prevent duplicate user fetches
      const userData = await cachedRequest(
        'current-user',
        async () => {
          const response = await fetch(`${API_URL}/users/me`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.status === 401) {
            // Try to refresh token once
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken }),
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              localStorage.setItem('accessToken', refreshData.accessToken);

              // Retry fetching user after successful refresh
              const retryResponse = await fetch(`${API_URL}/users/me`, {
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${refreshData.accessToken}`,
                },
              });

              if (retryResponse.ok) {
                return retryResponse.json();
              }
            }

            // Refresh failed
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            throw new Error('Token refresh failed');
          }

          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Failed to fetch user');
          }
        },
        { ttl: 60000 } // Cache for 1 minute
      );

      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // Empty dependency array - only run once on mount
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    const { user: userData, accessToken, refreshToken } = response.data;

    // Store tokens in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Clear any cached data from previous session to avoid stale cross-user info
    await queryClient.clear();
    clearCache(); // Clear API request cache
    setUser(userData);
  };

  const register = async (data: RegisterData) => {
    await api.post('/auth/register', data);
    // After registration, automatically log in
    await login({ email: data.email, password: data.password });
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {
        // Ignore errors on logout
      });
    }

    // Clear tokens from storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Clear all cached queries to prevent leaking prior user's data
    queryClient.clear();
    clearCache(); // Clear API request cache
    setUser(null);
    navigate('/login');
    // Force page reload to clear all state
    window.location.reload();
  };

  const refetchUser = async () => {
    await fetchUser();
  };

  // Optimization: Memoize context value strictly to prevent re-renders in subscribing components
  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refetchUser,
    apiClient: api,
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
