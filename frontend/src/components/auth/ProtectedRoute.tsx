import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * Route guard component for authenticated routes.
 * Redirects unauthenticated users to /login and preserves intended location.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-loading-screen" aria-live="polite">
        <div className="spinner" />
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? <>{children}</> : null;
};
