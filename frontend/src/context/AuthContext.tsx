import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User, ApiResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, headline?: string, skills?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear errors helper
  const clearError = () => setError(null);

  // Expose function to refresh user from backend
  const refreshUser = async () => {
    try {
      const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
      if (response.success && response.data.user) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  // Restore session on application load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
        if (response.success && response.data.user) {
          setUser(response.data.user);
          setToken('cookie-based');
        } else {
          setUser(null);
        }
      } catch (err) {
        // Expected when user is not logged in (no cookies or invalid)
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Login handler
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<ApiResponse<{ user: User }>>('/auth/login', {
        email,
        password,
      });

      if (response.success && response.data) {
        const { user: loggedUser } = response.data;
        setToken('cookie-based');
        setUser(loggedUser);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register handler
  const register = async (
    email: string,
    password: string,
    fullName: string,
    headline?: string,
    skills?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<ApiResponse<{ user: User }>>('/auth/register', {
        email,
        password,
        fullName,
        headline,
        skills,
      });

      if (response.success) {
        // Registration was successful, do not auto-login
        // Let the component handle redirection to the login page
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password handler
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<ApiResponse<null>>('/auth/forgot-password', { email });
      if (!response.success) {
        throw new Error(response.message || 'Failed to send password reset email.');
      }
    } catch (err: any) {
      let friendlyMessage = err.message || 'Failed to send password reset email. Please try again.';
      if (err.message && err.message.toLowerCase().includes('rate limit')) {
        friendlyMessage = 'Email rate limit exceeded. Please wait a minute before requesting another link.';
      }
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password handler
  const resetPassword = async (password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<ApiResponse<null>>('/auth/reset-password', { password });
      if (!response.success) {
        throw new Error(response.message || 'Failed to reset password.');
      }
      logout();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    // Optimistically clear local state for instant UI response (redirects to /login)
    localStorage.removeItem('dc_token');
    setToken(null);
    setUser(null);
    setError(null);

    // Inform backend to clear HTTP-only cookies and DB session asynchronously
    api.post('/auth/logout', {}).catch(err => {
      console.warn('Logout request failed:', err);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
        clearError,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
