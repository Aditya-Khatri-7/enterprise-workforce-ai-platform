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

  const activeRole = isDemoMode ? demoRole : (user?.role?.name || user?.role);

  // Super Admin overrides role checks for administrative routes on the frontend,
  // but cannot access employee-specific routes if they do not have an employee record.
  if (activeRole === 'Super Admin' && (allowedRoles.includes('Super Admin') || user?.employeeRef)) {
    return <Outlet />;
  }

  return allowedRoles.includes(activeRole) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default RoleRoute;
