// Trigger fast refresh
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Profile from './pages/Profile';
import AuditLogPage from './pages/AuditLogPage';
import DashboardLayout from './layouts/DashboardLayout';

// Temporary placeholder components until they are fully built
const DashboardRouter = () => {
  const { user } = useContext(AuthContext);
  if (user?.role === 'Super Admin' || user?.role === 'Organization Admin' || user?.role === 'HR Manager' || user?.role === 'IT Administrator') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/employee/dashboard" replace />;
};

const EmployeeDashboardTemp = () => <div className="p-10 text-2xl">Employee Dashboard</div>;
const Unauthorized = () => <div className="p-10 text-2xl text-red-500">403 - Unauthorized Access</div>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardRouter />} />
            
            <Route element={<DashboardLayout />}>
              {/* Admin Routes */}
              <Route element={<RoleRoute allowedRoles={['Super Admin', 'Organization Admin', 'HR Manager', 'IT Administrator']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/employees" element={<EmployeeManagement />} />
                <Route path="/admin/audit" element={<AuditLogPage />} />
              </Route>

              {/* Employee Routes */}
              <Route element={<RoleRoute allowedRoles={['Employee', 'Manager', 'Team Lead']} />}>
                <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
              </Route>
              
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
