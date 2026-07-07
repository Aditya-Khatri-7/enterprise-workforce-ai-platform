// Trigger fast refresh
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DemoProvider, DemoProgressProvider, DemoContext } from './context/DemoContext';
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
import AccountStatus from './pages/AccountStatus';
import SuperAdminRequestCenter from './pages/SuperAdminRequestCenter';
import AIWelcomePage from './pages/AIWelcomePage';
import DemoPlaceholderPage from './pages/DemoPlaceholderPage';
import CreateOrgPlaceholderPage from './pages/CreateOrgPlaceholderPage';
import DeactivatedPage from './pages/DeactivatedPage';

import ManagerTeamLeads from './pages/ManagerTeamLeads';
import ManagerProjectRequests from './pages/ManagerProjectRequests';
import ManagerTeamRequests from './pages/ManagerTeamRequests';
import ManagerGrievances from './pages/ManagerGrievances';
import TeamLeadMyTeam from './pages/TeamLeadMyTeam';
import TeamLeadRequests from './pages/TeamLeadRequests';
import TeamLeadRatings from './pages/TeamLeadRatings';
import EmployeeProjects from './pages/EmployeeProjects';
import EmployeeHistory from './pages/EmployeeHistory';
import EmployeeCompanyInfo from './pages/EmployeeCompanyInfo';
import EmployeeLeaves from './pages/EmployeeLeaves';
import EmployeeTickets from './pages/EmployeeTickets';
import EmployeeTeamLeadRequests from './pages/EmployeeTeamLeadRequests';
import EmployeeProjectRequests from './pages/EmployeeProjectRequests';

import PremiumBackground from './components/PremiumBackground';
import CustomCursor from './components/CustomCursor';

// Temporary placeholder components until they are fully built
const DashboardRouter = () => {
  const { user } = useContext(AuthContext);
  const { isDemoMode, demoRole } = useContext(DemoContext);
  const activeRole = isDemoMode ? demoRole : (user?.role?.name || user?.role);
  const adminRoles = ['Super Admin', 'Organization Admin', 'HR Manager', 'IT Administrator', 'Manager', 'Team Lead', 'Finance', 'Auditor'];
  if (adminRoles.includes(activeRole)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/employee/dashboard" replace />;
};

const EmployeeDashboardTemp = () => <div className="p-10 text-2xl">Employee Dashboard</div>;
const Unauthorized = () => <div className="p-10 text-2xl text-red-500">403 - Unauthorized Access</div>;

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <DemoProvider>
            <DemoProgressProvider>
              <PremiumBackground />
              <CustomCursor />
              <ToastContainer position="top-right" autoClose={3000} />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/welcome" element={<AIWelcomePage />} />
                <Route path="/demo" element={<DemoPlaceholderPage />} />
                <Route path="/create-organization" element={<CreateOrgPlaceholderPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/account-suspended" element={<DeactivatedPage />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardRouter />} />
                  <Route path="/account-status" element={<AccountStatus />} />
                  
                  <Route element={<DashboardLayout />}>
                    {/* Admin & Manager & Lead & Finance Routes */}
                    <Route element={<RoleRoute allowedRoles={['Super Admin', 'Organization Admin', 'HR Manager', 'IT Administrator', 'Manager', 'Department Manager', 'Team Lead', 'Finance', 'Auditor']} />}>
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/requests" element={<SuperAdminRequestCenter />} />
                    </Route>
                    <Route element={<RoleRoute allowedRoles={['Super Admin', 'Organization Admin', 'HR Manager', 'IT Administrator', 'Auditor']} />}>
                      <Route path="/admin/employees" element={<EmployeeManagement />} />
                      <Route path="/admin/audit" element={<AuditLogPage />} />
                    </Route>

                    {/* Department Manager Dedicated Routes */}
                    <Route element={<RoleRoute allowedRoles={['Super Admin', 'Organization Admin', 'Manager', 'Department Manager']} />}>
                      <Route path="/admin/team-leads" element={<ManagerTeamLeads />} />
                      <Route path="/admin/project-requests" element={<ManagerProjectRequests />} />
                      <Route path="/admin/team-requests" element={<ManagerTeamRequests />} />
                      <Route path="/admin/grievances" element={<ManagerGrievances />} />
                    </Route>

                    {/* Team Lead Dedicated Routes */}
                    <Route element={<RoleRoute allowedRoles={['Super Admin', 'Organization Admin', 'Team Lead', 'Manager', 'Department Manager']} />}>
                      <Route path="/admin/my-team" element={<TeamLeadMyTeam />} />
                      <Route path="/admin/team-lead-requests" element={<TeamLeadRequests />} />
                      <Route path="/admin/employee-ratings" element={<TeamLeadRatings />} />
                    </Route>

                    {/* Employee Routes */}
                    <Route element={<RoleRoute allowedRoles={['Employee', 'Manager', 'Department Manager', 'Team Lead']} />}>
                      <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
                      <Route path="/employee/projects" element={<EmployeeProjects />} />
                      <Route path="/employee/history" element={<EmployeeHistory />} />
                      <Route path="/employee/company-info" element={<EmployeeCompanyInfo />} />
                      <Route path="/employee/leaves" element={<EmployeeLeaves />} />
                      <Route path="/employee/tickets" element={<EmployeeTickets />} />
                      <Route path="/employee/team-lead-requests" element={<EmployeeTeamLeadRequests />} />
                      <Route path="/employee/project-requests" element={<EmployeeProjectRequests />} />
                    </Route>
                    
                    <Route path="/profile" element={<Profile />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DemoProgressProvider>
          </DemoProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
