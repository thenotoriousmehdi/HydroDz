import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const location = useLocation();
  
  const isAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    console.log('Token check in ProtectedRoute:', {
      token: !!token,
      tokenExistence: token,
      pathname: location.pathname
    });
    return !!token;
  };
  
  if (!isAuthenticated()) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;