import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User, Session, ApiResponse } from '../types';
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
    const storedToken = localStorage.getItem('dc_token');
    if (!storedToken) return;
    try {
      const response = await api.get<ApiResponse<{ user: User }>>('/auth/me', { token: storedToken });
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
      const storedToken = localStorage.getItem('dc_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        const response = await api.get<ApiResponse<{ user: User }>>('/auth/me', { token: storedToken });
        if (response.success && response.data.user) {
          setUser(response.data.user);
        } else {
          // Token is invalid/expired
          logout();
        }
      } catch (err) {
        console.warn('Failed to restore active session:', err);
        // Clear token since it's likely invalid/expired
        logout();
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
      const response = await api.post<ApiResponse<{ session: Session; user: User }>>('/auth/login', {
        email,
        password,
      });

      if (response.success && response.data) {
        const { session, user: loggedUser } = response.data;
        localStorage.setItem('dc_token', session.access_token);
        setToken(session.access_token);
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
        try {
          // Automatically login the user after successful registration
          await login(email, password);
        } catch (loginErr: any) {
          // Intercept common email-confirmation responses:
          // 1. "Email not confirmed"
          // 2. "Invalid login credentials" (which Supabase returns when email is unconfirmed and user enumeration protection is enabled)
          const isConfirm = loginErr.message && loginErr.message.toLowerCase().includes('confirm');
          const isCredentials = loginErr.message && loginErr.message.toLowerCase().includes('credentials');

          if (isConfirm || isCredentials) {
            throw new Error('Registration successful! A confirmation email has been sent. Please check your inbox and verify your email before logging in.');
          }
          throw new Error(`Registration successful! However, auto-login failed: ${loginErr.message || 'Please log in manually.'}`);
        }
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
    localStorage.removeItem('dc_token');
    setToken(null);
    setUser(null);
    setError(null);
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
