import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingState from '../common/LoadingState';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoadingUser } = useAuth();
  const location = useLocation();

  if (isLoadingUser) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;