import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RoleRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null; // The ProtectedRoute handles the loader
  }

  // Super Admin overrides all role checks on the frontend too
  if (user?.role === 'Super Admin') {
    return <Outlet />;
  }

  return allowedRoles.includes(user?.role) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default RoleRoute;
