import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-darkBg">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force password change on first login
  if (user.mustChangePassword && location.pathname !== '/profile') {
    return <Navigate to="/profile" state={{ forcePasswordChange: true }} replace />;
  }

  // Force suspended users to Account Suspended Page
  if (user.status === 'Suspended' && location.pathname !== '/account-suspended') {
    return <Navigate to="/account-suspended" replace />;
  }

  // Prevent non-suspended users from accessing Account Suspended Page
  if (user.status !== 'Suspended' && location.pathname === '/account-suspended') {
    return <Navigate to="/dashboard" replace />;
  }

  // Force inactive users to Account Status Page
  if (user.isActive === false && user.status !== 'Suspended' && location.pathname !== '/account-status') {
    return <Navigate to="/account-status" replace />;
  }

  // If user is active, prevent them from accessing Account Status Page
  if (user.isActive !== false && location.pathname === '/account-status') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
