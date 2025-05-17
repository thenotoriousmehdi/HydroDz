import React, { useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const RoleProtectedRoute = ({ allowedRoles }) => {
  const location = useLocation();
  
  const { isAuthenticated, userRole } = useMemo(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    return {
      isAuthenticated: !!token,
      userRole: role,
    };
  }, []);
  
  console.log('Role check in RoleProtectedRoute:', {
    isAuthenticated,
    userRole,
    allowedRoles,
    pathname: location.pathname
  });
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }
  
  if (!allowedRoles.includes(userRole || '')) {
    console.log(`Unauthorized role: ${userRole}, redirecting`);
    return <Navigate to="/403" replace />;
  }
  
  return <Outlet />;
};

export default RoleProtectedRoute;