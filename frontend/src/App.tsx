import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';
import { ResetPassword } from './pages/ResetPassword';
import { SkeletonLoader } from './components/common/SkeletonLoader';
import { Card } from './components/common/Card';
import './App.css';

/**
 * Protected Route Wrapper
 * Intercepts routing, displays loading skeleton fallbacks during session verification,
 * and guards resources by enforcing login authentication.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Beautiful full-screen ghost loading state!
    return (
      <div className="dc-app-loader" data-testid="app-loader">
        <div className="dc-app-loader-card-wrapper">
          <Card glow className="dc-loader-card">
            <div className="dc-loader-header">
              <SkeletonLoader variant="circle" className="dc-loader-avatar" />
              <div>
                <SkeletonLoader variant="text" width={160} height={18} />
                <SkeletonLoader variant="text" width={100} height={12} className="mt-2" />
              </div>
            </div>
            <div className="dc-loader-body">
              <SkeletonLoader variant="text" count={3} />
              <SkeletonLoader variant="rectangle" height={100} className="mt-4" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Guest Route Wrapper
 * Prevents authenticated users from seeing Login or Register pages by redirecting to Feed.
 */
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="dc-app-loader">
        <SkeletonLoader variant="circle" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Guest Auth Routes */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* Secure Internal Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute>
                <Recommendations />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
