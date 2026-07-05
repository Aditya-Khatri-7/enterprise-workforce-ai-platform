import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { DemoContext } from '../context/DemoContext';

const RoleRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const { isDemoMode, demoRole } = useContext(DemoContext);

  if (loading) {
    return null; // The ProtectedRoute handles the loader
  }

  const activeRole = isDemoMode ? demoRole : user?.role;

  // Super Admin overrides all role checks on the frontend too
  if (activeRole === 'Super Admin') {
    return <Outlet />;
  }

  return allowedRoles.includes(activeRole) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default RoleRoute;
