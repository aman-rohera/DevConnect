import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem('token');

  // If there is no token, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Render the child routes
  return <Outlet />;
};
