import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { DemoContext, DemoProgressContext } from '../context/DemoContext';
import {
  Shield, Cpu, Users, Briefcase, Activity, User, DollarSign, Terminal, FileText,
  Settings, CheckCircle, AlertTriangle, AlertCircle, Play, Plus, Trash, Edit,
  ArrowRight, RefreshCw, Layers, ShieldAlert, Award, Calendar, Clock, Lock
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

// ─── Stat Card Component ────────────────────────────────────────────────────────
const StatCard = ({ label, value, colorAccent = 'cyan', icon: Icon, desc }) => {
  const accentClasses = {
    purple: 'border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 from-purple-500/5 to-indigo-500/5',
    blue: 'border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 from-blue-500/10 to-indigo-500/5',
    teal: 'border-teal-300 dark:border-teal-500/30 text-teal-700 dark:text-teal-400 from-teal-500/10 to-indigo-500/5',
    orange: 'border-orange-300 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 from-orange-500/10 to-indigo-500/5',
    cyan: 'border-cyan-300 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400 from-cyan-500/10 to-indigo-500/5',
    yellow: 'border-yellow-300 dark:border-yellow-500/30 text-yellow-800 dark:text-yellow-450 from-yellow-500/10 to-indigo-500/5',
    red: 'border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400 from-red-500/10 to-indigo-500/5',
    slate: 'border-slate-300 dark:border-slate-500/30 text-slate-700 dark:text-slate-400 from-slate-500/10 to-indigo-500/5'
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className={`glass-card border ${accentClasses[colorAccent]} rounded-2xl p-5 flex items-center justify-between relative overflow-hidden bg-gradient-to-tr`}
    >
      <div className="space-y-1 z-10">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
        {desc && <p className="text-[10px] text-slate-500 dark:text-slate-400">{desc}</p>}
      </div>
      <div className="p-3 bg-slate-100 dark:bg-black/20 rounded-xl z-10">
        {Icon && <Icon className="h-5 w-5" />}
      </div>
    </motion.div>
  );
};

// ─── Modal Component ──────────────────────────────────────────────────────────
const LocalModal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative bg-white dark:bg-[#151A30] border border-slate-200 dark:border-indigo-500/30 rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6 text-slate-800 dark:text-white"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-indigo-500/15 pb-3 mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-650 dark:text-cyan-400">{title}</h3>
        <button onClick={onClose} className="text-slate-400 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white text-xl font-light">&times;</button>
      </div>
      {children}
    </motion.div>
  </div>
);

const SuperAdminDashboard = () => {
  const { isDemoMode } = useContext(DemoContext);
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(!isDemoMode);

  // Tab State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'reactivations'

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrgData, setNewOrgData] = useState({ name: '', email: '', address: '', subscriptionPlan: 'Basic' });
  const [submittingOrg, setSubmittingOrg] = useState(false);

  const [assignAdminOrg, setAssignAdminOrg] = useState(null); // org object
  const [selectedUserIdForAdmin, setSelectedUserIdForAdmin] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [assigningAdmin, setAssigningAdmin] = useState(false);

  const [deleteOrgTarget, setDeleteOrgTarget] = useState(null); // org object
  const [deleteOrgConfirmText, setDeleteOrgConfirmText] = useState('');
  const [deletingOrg, setDeletingOrg] = useState(false);

  const [deleteUserTarget, setDeleteUserTarget] = useState(null); // user object
  const [deleteUserConfirmText, setDeleteUserConfirmText] = useState('');
  const [deletingUser, setDeletingUser] = useState(false);

  const [suspendUserTarget, setSuspendUserTarget] = useState(null); // user object
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendingUser, setSuspendingUser] = useState(false);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes, orgRes, reqRes, auditRes, userRes] = await Promise.all([
        api.get('/employees').catch(() => ({ data: [] })),
        api.get('/departments').catch(() => ({ data: [] })),
        api.get('/organizations').catch(() => ({ data: [] })),
        api.get('/requests').catch(() => ({ data: [] })),
        api.get('/audit').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] }))
      ]);
      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
      setOrganizations(orgRes.data || []);
      setRequests(reqRes.data || []);
      setAuditLogs(auditRes.data || []);
      setUsers(userRes.data || []);
    } catch (err) {
      console.error('Error fetching admin dashboard real data:', err);
      toast.error('Failed to load real database metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    fetchRealData();
  }, [isDemoMode]);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgData.name || !newOrgData.email) {
      toast.warning('Organization Name and Contact Email are required.');
      return;
    }

    if (isDemoMode) {
      const mockNewOrg = {
        organizationId: `ORG${String(organizations.length + 4).padStart(4, '0')}`,
        name: newOrgData.name,
        email: newOrgData.email,
        address: newOrgData.address,
        subscriptionPlan: newOrgData.subscriptionPlan,
        status: 'Active'
      };
      setOrganizations([...organizations, mockNewOrg]);
      toast.success('Organization created successfully (Demo Mode)!');
      setShowCreateModal(false);
      setNewOrgData({ name: '', email: '', address: '', subscriptionPlan: 'Basic' });
      return;
    }

    try {
      setSubmittingOrg(true);
      await api.post('/organizations', newOrgData);
      toast.success('Organization created successfully!');
      setShowCreateModal(false);
      setNewOrgData({ name: '', email: '', address: '', subscriptionPlan: 'Basic' });
      await fetchRealData();
    } catch (err) {
      console.error('Create organization failed:', err);
      toast.error(err.response?.data?.error || 'Failed to create organization.');
    } finally {
      setSubmittingOrg(false);
    }
  };

  const handleAssignAdminSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserIdForAdmin) {
      toast.warning('Please select a user to assign as Admin.');
      return;
    }

    if (isDemoMode) {
      toast.success('Admin assigned successfully (Demo Mode)!');
      setAssignAdminOrg(null);
      setSelectedUserIdForAdmin('');
      setUserSearchQuery('');
      return;
    }

    try {
      setAssigningAdmin(true);
      await api.put(`/organizations/${assignAdminOrg._id}/assign-admin`, { userId: selectedUserIdForAdmin });
      toast.success('Admin assigned successfully!');
      setAssignAdminOrg(null);
      setSelectedUserIdForAdmin('');
      setUserSearchQuery('');
      await fetchRealData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign admin.');
    } finally {
      setAssigningAdmin(false);
    }
  };

  const handleDeleteOrgSubmit = async (e) => {
    e.preventDefault();
    if (deleteOrgConfirmText !== deleteOrgTarget.name) {
      toast.warning('Typed name does not match organization name.');
      return;
    }

    if (isDemoMode) {
      setOrganizations(organizations.filter(o => o.organizationId !== deleteOrgTarget.organizationId));
      toast.success('Organization deleted successfully (Demo/Local)!');
      setDeleteOrgTarget(null);
      setDeleteOrgConfirmText('');
      return;
    }

    try {
      setDeletingOrg(true);
      await api.delete(`/organizations/${deleteOrgTarget._id}`);
      toast.success('Organization deleted successfully.');
      setDeleteOrgTarget(null);
      setDeleteOrgConfirmText('');
      await fetchRealData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete organization.');
    } finally {
      setDeletingOrg(false);
    }
  };

  const handleDeleteUserSubmit = async (e) => {
    e.preventDefault();
    if (deleteUserConfirmText !== deleteUserTarget.username) {
      toast.warning('Typed username does not match.');
      return;
    }

    if (isDemoMode) {
      setUsers(users.filter(u => u.username !== deleteUserTarget.username));
      toast.success('User deleted successfully (Demo/Local)!');
      setDeleteUserTarget(null);
      setDeleteUserConfirmText('');
      return;
    }

    try {
      setDeletingUser(true);
      await api.delete(`/users/${deleteUserTarget._id}`);
      toast.success('User soft deleted successfully.');
      setDeleteUserTarget(null);
      setDeleteUserConfirmText('');
      await fetchRealData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user.');
    } finally {
      setDeletingUser(false);
    }
  };

  const handleSuspendUserSubmit = async (e) => {
    e.preventDefault();
    if (!suspendReason) {
      toast.warning('Please provide a reason for suspension.');
      return;
    }

    if (isDemoMode) {
      setUsers(users.map(u => u.username === suspendUserTarget.username ? { ...u, status: 'Suspended', isActive: false } : u));
      toast.success('User suspended successfully (Demo/Local)!');
      setSuspendUserTarget(null);
      setSuspendReason('');
      return;
    }

    try {
      setSuspendingUser(true);
      await api.post(`/users/${suspendUserTarget._id}/deactivate`, { reason: suspendReason });
      toast.success('User suspended successfully.');
      setSuspendUserTarget(null);
      setSuspendReason('');
      await fetchRealData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to suspend user.');
    } finally {
      setSuspendingUser(false);
    }
  };

  const handleReviewReactivation = async (userId, action) => {
    if (isDemoMode) {
      setUsers(users.map(u => u._id === userId ? { ...u, status: action === 'Approve' ? 'Active' : 'Suspended', isActive: action === 'Approve' } : u));
      toast.success(`Request ${action}d (Demo Mode)!`);
      return;
    }

    try {
      await api.put(`/users/${userId}/reactivation-review`, { action });
      toast.success(`Request ${action}d successfully.`);
      await fetchRealData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process request.');
    }
  };

  const roleColors = ['#A855F7', '#3B82F6', '#14B8A6', '#F97316', '#06B6D4', '#EAB308', '#EF4444', '#64748B'];
  
  const roleDistribution = isDemoMode ? [
    { name: 'Super Admin', value: 3 },
    { name: 'Org Admin', value: 12 },
    { name: 'HR Manager', value: 24 },
    { name: 'Dept Manager', value: 30 },
    { name: 'Team Lead', value: 45 },
    { name: 'Employee', value: 120 },
    { name: 'Finance', value: 8 },
    { name: 'IT Admin', value: 5 }
  ] : (() => {
    const counts = {};
    users.forEach(u => {
      const roleName = u.role?.name || u.role || 'Employee';
      counts[roleName] = (counts[roleName] || 0) + 1;
    });
    if (Object.keys(counts).length === 0) {
      return [{ name: 'No Users', value: 1 }];
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const departmentBreakdown = isDemoMode ? [
    { name: 'Engineering', headcount: 85, manager: 'Arjun Mehta', projects: 8 },
    { name: 'Finance', headcount: 14, manager: 'Sneha Gupta', projects: 3 },
    { name: 'Human Resources', headcount: 12, manager: 'Riya Sharma', projects: 2 },
    { name: 'Operations', headcount: 45, manager: 'Amit Verma', projects: 3 },
    { name: 'Information Technology', headcount: 18, manager: 'Marcus Vane', projects: 2 }
  ] : departments.map(d => {
    const deptEmployees = employees.filter(e => e.department?.toLowerCase() === d.name?.toLowerCase());
    const managerEmp = deptEmployees.find(e => e.designation?.toLowerCase()?.includes('manager')) || deptEmployees[0];
    return {
      name: d.name,
      headcount: deptEmployees.length,
      manager: managerEmp ? `${managerEmp.firstName} ${managerEmp.lastName}` : 'N/A',
      projects: 0
    };
  });

  // Filter assignable users (Employees / standard Users)
  const assignableUsers = users.filter(u => 
    u.role?.name !== 'Super Admin' && 
    u.role?.name !== 'Organization Admin' &&
    u.status !== 'Deleted' &&
    (!u.organization || String(u.organization?._id || u.organization) === String(assignAdminOrg?._id || ''))
  );

  const filteredAssignableUsers = assignableUsers.filter(u => 
    (u.username || '').toLowerCase().includes((userSearchQuery || '').toLowerCase()) || 
    (u.email || '').toLowerCase().includes((userSearchQuery || '').toLowerCase())
  );

  // Pending reactivation requests from Org Admins
  const pendingReactivationRequests = users.filter(u => 
    u.status === 'Deactivation_Requested' && 
    u.role?.name === 'Organization Admin'
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-x-2">
        <Activity className="h-6 w-6 text-purple-500 animate-spin" />
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading actual database metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-indigo-500/20 pb-1 gap-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'overview' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Overview & Registries
        </button>
        <button
          onClick={() => setActiveTab('reactivations')}
          className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer relative ${activeTab === 'reactivations' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Reactivation Requests
          {pendingReactivationRequests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-650 text-white animate-bounce">
              {pendingReactivationRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* System Health Bar */}
          <div className="glass-card border border-purple-300 dark:border-purple-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
              <Cpu className="h-4 w-4 text-purple-650 dark:text-purple-400 animate-pulse" />
              <span>System Vitals Overview</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-350">
              <div>CPU Usage: <span className="text-purple-700 dark:text-purple-400 font-bold">4%</span></div>
              <div>RAM Allocation: <span className="text-purple-700 dark:text-purple-400 font-bold">4.6 GB / 8.0 GB</span></div>
              <div>Database: <span className="text-emerald-600 dark:text-emerald-400 font-bold">CONNECTED</span></div>
              <div>API Latency: <span className="text-purple-700 dark:text-purple-400 font-bold">16 ms</span></div>
            </div>
          </div>

          {/* Grid KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Employees" value={isDemoMode ? "247" : String(employees.length)} colorAccent="purple" icon={Users} desc="Org-wide Headcount" />
            <StatCard label="Departments" value={isDemoMode ? "12" : String(departments.length)} colorAccent="purple" icon={Layers} desc="Across 4 Locations" />
            <StatCard label="Total Organizations" value={isDemoMode ? "3" : String(organizations.length)} colorAccent="purple" icon={Activity} desc="Active Registrations" />
            <StatCard label="Pending Workflow Requests" value={isDemoMode ? "34" : String(requests.filter(r => r.status === 'Pending').length)} colorAccent="purple" icon={ShieldAlert} desc="Requires Supervision" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side Table & Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Organizations Registry */}
              <div className="glass-card border border-purple-200 dark:border-purple-500/20 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest">
                    Organizations Registry
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white btn-premium-gradient flex items-center gap-1 shadow-md cursor-pointer border-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Org</span>
                  </motion.button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                    <thead>
                      <tr className="text-slate-500 dark:text-slate-400 text-left">
                        <th className="pb-3 font-semibold">ID</th>
                        <th className="pb-3 font-semibold">Org Name</th>
                        <th className="pb-3 font-semibold">Contact Email</th>
                        <th className="pb-3 font-semibold">Admin</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200">
                      {(isDemoMode ? [
                        { _id: 'o1', organizationId: 'ORG0001', name: 'TechNova Global', email: 'contact@technova.com', subscriptionPlan: 'Enterprise', status: 'Active' },
                        { _id: 'o2', organizationId: 'ORG0002', name: 'Quantum Leap Labs', email: 'hr@quantumleap.io', subscriptionPlan: 'Premium', status: 'Active' },
                        { _id: 'o3', organizationId: 'ORG0003', name: 'Apex Systems', email: 'admin@apex.com', subscriptionPlan: 'Basic', status: 'Suspended' }
                      ] : organizations).map((o, i) => {
                        // Find admin name for this organization
                        const adminUser = users.find(u => String(u.organization?._id || u.organization) === String(o._id) && u.role?.name === 'Organization Admin');
                        const adminName = adminUser ? adminUser.username : 'Unassigned';

                        return (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                            <td className="py-3 font-mono font-bold">{o.organizationId}</td>
                            <td className="py-3 font-bold text-slate-900 dark:text-white">{o.name}</td>
                            <td className="py-3 font-mono">{o.email}</td>
                            <td className="py-3 text-purple-650 dark:text-purple-300 font-semibold">{adminName}</td>
                            <td className="py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setAssignAdminOrg(o)}
                                  className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-lg cursor-pointer"
                                >
                                  Assign Admin
                                </button>
                                <button
                                  onClick={async () => {
                                    if (isDemoMode) { toast.success(`Org status updated (Demo)!`); return; }
                                    try {
                                      const newStatus = o.status === 'Active' ? 'Suspended' : 'Active';
                                      await api.put(`/organizations/${o._id}/status`, { status: newStatus });
                                      toast.success(`Organization is now ${newStatus}`);
                                      fetchRealData();
                                    } catch (err) {
                                      toast.error('Failed to update organization status');
                                    }
                                  }}
                                  className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg cursor-pointer border ${
                                    o.status === 'Active' 
                                      ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/20'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  }`}
                                >
                                  {o.status === 'Active' ? 'Deactivate Org' : 'Activate Org'}
                                </button>
                                <button
                                  onClick={() => setDeleteOrgTarget(o)}
                                  className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg cursor-pointer"
                                >
                                  Delete Org
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {(!isDemoMode && organizations.length === 0) && (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-500 dark:text-slate-400">
                            No organizations found in database. Create one to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Users Registry Table */}
              <div className="glass-card border border-purple-200 dark:border-purple-500/20 rounded-2xl p-5">
                <h3 className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-4">
                  User Accounts Registry
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                    <thead>
                      <tr className="text-slate-500 dark:text-slate-400 text-left">
                        <th className="pb-3 font-semibold">Username</th>
                        <th className="pb-3 font-semibold">Email</th>
                        <th className="pb-3 font-semibold">Role</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200">
                      {users.filter(u => u.status !== 'Deleted').map((u, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                          <td className="py-2.5 font-bold text-slate-900 dark:text-white">{u.username}</td>
                          <td className="py-2.5 font-mono">{u.email}</td>
                          <td className="py-2.5 font-semibold text-purple-650 dark:text-purple-300">{u.role?.name || 'User'}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 inline-flex text-[8px] leading-5 font-black uppercase tracking-wider rounded border ${
                              u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 
                              u.status === 'Suspended' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                              'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex gap-2 justify-end">
                              {u.status !== 'Suspended' ? (
                                u._id === user?._id || u.username === user?.username ? (
                                  <span className="px-2 py-1 text-[10px] text-slate-400 dark:text-slate-500 italic">Self</span>
                                ) : (
                                  <button
                                    onClick={() => setSuspendUserTarget(u)}
                                    className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-lg cursor-pointer"
                                  >
                                    Suspend
                                  </button>
                                )
                              ) : (
                                <button
                                  onClick={() => handleReviewReactivation(u._id, 'Approve')}
                                  className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-655 dark:text-emerald-400 border border-emerald-500/20 rounded-lg cursor-pointer"
                                >
                                  Reactivate
                                </button>
                              )}
                              {u._id !== user?._id && u.username !== user?.username && (
                                <button
                                  onClick={() => setDeleteUserTarget(u)}
                                  className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Side Pie Chart */}
            <div className="glass-card border border-purple-200 dark:border-purple-500/20 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-4">User Role Distribution</h3>
                <div className="flex justify-center h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleDistribution}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {roleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={roleColors[index % roleColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#151A30', borderColor: '#4C51BF', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-650 dark:text-slate-350 border-t border-slate-100 dark:border-[#1F2647] pt-4">
                {roleDistribution.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 font-mono">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: roleColors[i % roleColors.length] }} />
                    <span>{r.name}: <span className="text-slate-900 dark:text-white font-bold">{r.value}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'reactivations' && (
        <div className="glass-card border border-purple-200 dark:border-purple-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-4">
            Pending Reactivation Requests (Org Admins)
          </h3>
          {pendingReactivationRequests.length === 0 ? (
            <p className="text-xs text-slate-450 italic py-8 text-center">No pending reactivation requests from Org Admins.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 text-left">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Reason</th>
                    <th className="pb-3 font-semibold">Requested At</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200">
                  {pendingReactivationRequests.map((req, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                      <td className="py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{req.username}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{req.email}</div>
                      </td>
                      <td className="py-3 text-slate-350">{req.reactivationRequest?.reason}</td>
                      <td className="py-3 font-mono">{req.reactivationRequest?.requestedAt ? new Date(req.reactivationRequest.requestedAt).toLocaleString() : 'N/A'}</td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleReviewReactivation(req._id, 'Approve')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg cursor-pointer border-0"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewReactivation(req._id, 'Reject')}
                            className="bg-red-500 hover:bg-red-650 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg cursor-pointer border-0"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Super Admin Modals */}
      <AnimatePresence>
        {/* Assign Admin Modal */}
        {assignAdminOrg && (
          <LocalModal title={`Assign Admin for ${assignAdminOrg.name}`} onClose={() => setAssignAdminOrg(null)}>
            <form onSubmit={handleAssignAdminSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Search & Select User</label>
                <input
                  type="text"
                  placeholder="Search user by username or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />

                <select
                  value={selectedUserIdForAdmin}
                  onChange={(e) => setSelectedUserIdForAdmin(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Choose User --</option>
                  {filteredAssignableUsers.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.email}) - {u.role?.name || 'Unassigned'}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">Only showing users not already assigned as Admins/Super Admins.</p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setAssignAdminOrg(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningAdmin}
                  className="px-4 py-2 text-xs font-bold uppercase text-white btn-premium-gradient rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {assigningAdmin ? 'Assigning...' : 'Assign as Admin'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {/* Delete Org Modal */}
        {deleteOrgTarget && (
          <LocalModal title={`Delete Organization`} onClose={() => setDeleteOrgTarget(null)}>
            <form onSubmit={handleDeleteOrgSubmit} className="space-y-4">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-650 dark:text-red-400 text-xs font-bold flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Warning: This will archive the organization. Type the organization name <strong>{deleteOrgTarget.name}</strong> to confirm.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">Confirm Name</label>
                <input
                  type="text"
                  required
                  placeholder="Type name here"
                  value={deleteOrgConfirmText}
                  onChange={(e) => setDeleteOrgConfirmText(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setDeleteOrgTarget(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingOrg}
                  className="px-4 py-2 text-xs font-bold uppercase text-white bg-red-650 hover:bg-red-700 rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {deletingOrg ? 'Archiving...' : 'Confirm Deletion'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {/* Delete User Modal */}
        {deleteUserTarget && (
          <LocalModal title={`Delete User Account`} onClose={() => setDeleteUserTarget(null)}>
            <form onSubmit={handleDeleteUserSubmit} className="space-y-4">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-650 dark:text-red-400 text-xs font-bold flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Warning: This will soft delete the user account. Type the username <strong>{deleteUserTarget.username}</strong> to confirm.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">Confirm Username</label>
                <input
                  type="text"
                  required
                  placeholder="Type username here"
                  value={deleteUserConfirmText}
                  onChange={(e) => setDeleteUserConfirmText(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setDeleteUserTarget(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingUser}
                  className="px-4 py-2 text-xs font-bold uppercase text-white bg-red-650 hover:bg-red-700 rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {deletingUser ? 'Deleting...' : 'Confirm Deletion'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {/* Suspend User Modal */}
        {suspendUserTarget && (
          <LocalModal title={`Suspend User Account`} onClose={() => setSuspendUserTarget(null)}>
            <form onSubmit={handleSuspendUserSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">Reason for Suspension</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide a reason for suspending this user..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setSuspendUserTarget(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={suspendingUser}
                  className="px-4 py-2 text-xs font-bold uppercase text-white bg-orange-550 hover:bg-orange-650 rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {suspendingUser ? 'Suspending...' : 'Suspend Account'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {/* Create Org Modal */}
        {showCreateModal && (
          <LocalModal title="Create New Organization" onClose={() => setShowCreateModal(false)}>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={newOrgData.name}
                  onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Primary Contact Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@acme.com"
                  value={newOrgData.email}
                  onChange={(e) => setNewOrgData({ ...newOrgData, email: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Physical Address (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 123 Main St, New York"
                  value={newOrgData.address}
                  onChange={(e) => setNewOrgData({ ...newOrgData, address: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Subscription Plan</label>
                <select
                  value={newOrgData.subscriptionPlan}
                  onChange={(e) => setNewOrgData({ ...newOrgData, subscriptionPlan: e.target.value })}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-900 dark:text-white"
                >
                  <option value="Basic">Basic Plan</option>
                  <option value="Premium">Premium Plan</option>
                  <option value="Enterprise">Enterprise Plan</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrg}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white btn-premium-gradient rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {submittingOrg ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ORG ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const OrgAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { isDemoMode } = useContext(DemoContext);
  const [modalType, setModalType] = useState(null); // 'dept' | 'desig' | 'holiday' | 'shift' | 'office'
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [workShifts, setWorkShifts] = useState([]);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingSetup, setLoadingSetup] = useState(true);

  const [alerts, setAlerts] = useState([
    { text: 'Missing organization secondary recovery email', type: 'warning' },
    { text: 'Enforcement of Multi-Factor Authentication pending', type: 'critical' },
    { text: 'Q3 compliance policies signature pending', type: 'info' }
  ]);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'reactivations'
  
  const [suspendUserTarget, setSuspendUserTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendingUser, setSuspendingUser] = useState(false);

  const fetchOrgUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSetupData = async () => {
    try {
      setLoadingSetup(true);
      const [deptsRes, desigsRes, shiftsRes, officesRes, empsRes] = await Promise.all([
        api.get('/departments').catch(() => ({ data: [] })),
        api.get('/designations').catch(() => ({ data: [] })),
        api.get('/workshifts').catch(() => ({ data: [] })),
        api.get('/office-locations').catch(() => ({ data: [] })),
        api.get('/employees').catch(() => ({ data: [] }))
      ]);

      const fetchedDepts = deptsRes.data || [];
      const fetchedDesigs = desigsRes.data || [];
      const fetchedShifts = shiftsRes.data || [];
      const fetchedOffices = officesRes.data || [];
      const fetchedEmps = empsRes.data || [];

      if (isDemoMode && fetchedEmps.length === 0) {
        setEmployees([
          { _id: 'emp1', firstName: 'Riya', lastName: 'Sharma', designation: 'Developer' },
          { _id: 'emp2', firstName: 'Karan', lastName: 'Patel', designation: 'Developer' },
          { _id: 'emp3', firstName: 'Priya', lastName: 'Singh', designation: 'Developer' },
          { _id: 'emp4', firstName: 'Amit', lastName: 'Verma', designation: 'Senior Developer' },
          { _id: 'emp5', firstName: 'Neha', lastName: 'Joshi', designation: 'Lead QA' }
        ]);
      } else {
        setEmployees(fetchedEmps);
      }

      if (isDemoMode && fetchedDepts.length === 0) {
        setDepartments([
          { _id: 'dept1', name: 'Engineering', code: 'ENG' },
          { _id: 'dept2', name: 'Human Resources', code: 'HR' },
          { _id: 'dept3', name: 'Product Management', code: 'PM' }
        ]);
      } else {
        setDepartments(fetchedDepts);
      }

      if (isDemoMode && fetchedDesigs.length === 0) {
        setDesignations([
          { _id: 'desig1', name: 'Software Engineer', code: 'SWE' },
          { _id: 'desig2', name: 'Product Manager', code: 'PM' },
          { _id: 'desig3', name: 'HR Executive', code: 'HRE' }
        ]);
      } else {
        setDesignations(fetchedDesigs);
      }

      if (isDemoMode && fetchedShifts.length === 0) {
        setWorkShifts([
          { _id: 'shift1', name: 'Morning Roster', startTime: '09:00', endTime: '18:00' },
          { _id: 'shift2', name: 'Night Shift', startTime: '22:00', endTime: '06:00' }
        ]);
      } else {
        setWorkShifts(fetchedShifts);
      }

      if (isDemoMode && fetchedOffices.length === 0) {
        setOfficeLocations([
          { _id: 'loc1', name: 'Bangalore Core HQ', address: 'Bangalore Tech Park', totalEmployees: 45 },
          { _id: 'loc2', name: 'San Francisco Hub', address: 'Market Street SF', totalEmployees: 12 }
        ]);
      } else {
        setOfficeLocations(fetchedOffices);
      }
    } catch (err) {
      console.error('Error fetching setup data:', err);
    } finally {
      setLoadingSetup(false);
    }
  };

  useEffect(() => {
    fetchOrgUsers();
    fetchSetupData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    const name = e.target.deptName.value.trim();
    const code = e.target.deptCode.value.trim();
    const manager = e.target.deptManager.value;
    if (!name || !code) return;
    try {
      await api.post('/departments', { name, code, manager: manager || null });
      toast.success('Department created successfully!');
      setModalType(null);
      fetchSetupData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create department');
    }
  };

  const handleCreateDesignation = async (e) => {
    e.preventDefault();
    const name = e.target.desigName.value.trim();
    const code = e.target.desigCode.value.trim();
    if (!name || !code) return;
    try {
      await api.post('/designations', { name, code });
      toast.success('Designation created successfully!');
      setModalType(null);
      fetchSetupData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create designation');
    }
  };

  const handleCreateWorkShift = async (e) => {
    e.preventDefault();
    const name = e.target.shiftName.value.trim();
    const startTime = e.target.shiftStart.value.trim();
    const endTime = e.target.shiftEnd.value.trim();
    if (!name || !startTime || !endTime) return;
    try {
      await api.post('/workshifts', { name, startTime, endTime });
      toast.success('Work Shift created successfully!');
      setModalType(null);
      fetchSetupData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create work shift');
    }
  };

  const handleCreateOfficeLocation = async (e) => {
    e.preventDefault();
    const name = e.target.officeName.value.trim();
    const address = e.target.officeAddress.value.trim();
    const totalEmployees = Number(e.target.officeTotalEmployees.value || 0);
    if (!name || !address) return;
    try {
      await api.post('/office-locations', { name, address, totalEmployees });
      toast.success('Office Location created successfully!');
      setModalType(null);
      fetchSetupData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create office location');
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Department deleted successfully');
      fetchSetupData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete department');
    }
  };

  const handleDeleteOffice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this office location?')) return;
    try {
      await api.delete(`/office-locations/${id}`);
      toast.success('Office location deleted successfully');
      fetchSetupData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete office location');
    }
  };

  const handleSuspendUserSubmit = async (e) => {
    e.preventDefault();
    if (!suspendReason) {
      toast.warning('Please provide a reason for suspension.');
      return;
    }

    try {
      setSuspendingUser(true);
      await api.post(`/users/${suspendUserTarget._id}/deactivate`, { reason: suspendReason });
      toast.success('HR Manager suspended successfully.');
      setSuspendUserTarget(null);
      setSuspendReason('');
      fetchOrgUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to suspend user.');
    } finally {
      setSuspendingUser(false);
    }
  };

  const handleReviewReactivation = async (userId, action) => {
    try {
      await api.put(`/users/${userId}/reactivation-review`, { action });
      toast.success(`Request ${action}d successfully.`);
      fetchOrgUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process request.');
    }
  };

  const hrManagers = users.filter(u => ['HR Manager', 'Auditor'].includes(u.role?.name) && u.status !== 'Deleted');
  const pendingReactivationRequests = users.filter(u => u.status === 'Deactivation_Requested' && ['HR Manager', 'Auditor'].includes(u.role?.name));

  return (
    <div className="space-y-6 text-slate-800 dark:text-white">
      {/* Alert Notifications */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, idx) => (
            <div key={idx} className={`p-3 border rounded-xl flex items-center justify-between text-xs font-medium ${a.type === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400' : a.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400'}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{a.text}</span>
              </div>
              <button onClick={() => setAlerts(alerts.filter((_, i) => i !== idx))} className="hover:text-slate-900 dark:hover:text-white font-bold bg-transparent border-0 cursor-pointer">&times;</button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-indigo-500/20 pb-1 gap-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent border-0 ${activeTab === 'overview' ? 'border-blue-500 text-blue-600 dark:text-blue-455' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Overview & Departments
        </button>
        <button
          onClick={() => setActiveTab('reactivations')}
          className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer relative bg-transparent border-0 ${activeTab === 'reactivations' ? 'border-blue-500 text-blue-600 dark:text-blue-455' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Reactivation Requests
          {pendingReactivationRequests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-650 text-white animate-bounce">
              {pendingReactivationRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Grid KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Active Locations" value={loadingSetup ? '...' : `${officeLocations.length} Offices`} colorAccent="blue" icon={Layers} desc={officeLocations.map(l => l.name.split(' ')[0]).join(', ') || "No locations"} />
            <StatCard label="Corporate Holidays" value="14 Days" colorAccent="blue" icon={Calendar} desc="Year 2026 Calendar" />
            <StatCard label="Total Designations" value={loadingSetup ? '...' : `${designations.length} Profiles`} colorAccent="blue" icon={Award} desc="Grade Scale Levels" />
            <StatCard label="Staff Shifts" value={loadingSetup ? '...' : `${workShifts.length} Active`} colorAccent="blue" icon={Clock} desc="Work Shift Rotations" />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Tree & Card Layouts */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* HR Managers List */}
              <div className="glass-card border border-blue-500/20 rounded-2xl p-5">
                <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">
                  HR Managers & Compliance Auditors
                </h3>
                {loadingUsers ? (
                  <p className="text-xs text-slate-450 italic py-4 text-center">Loading administrators...</p>
                ) : hrManagers.length === 0 ? (
                  <p className="text-xs text-slate-455 italic py-4 text-center">No HR Managers or Auditors found in organization.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                      <thead>
                        <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                          <th className="pb-3 font-semibold">Username</th>
                          <th className="pb-3 font-semibold">Email</th>
                          <th className="pb-3 font-semibold">Role</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-205 font-mono">
                        {hrManagers.map((u, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                            <td className="py-2.5 font-bold text-slate-900 dark:text-white font-sans">{u.username}</td>
                            <td className="py-2.5">{u.email}</td>
                            <td className="py-2.5 font-bold text-teal-650 dark:text-teal-400 font-sans">{u.role?.name || 'Auditor'}</td>
                            <td className="py-2.5 font-sans">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-sans">
                              {u.status !== 'Suspended' ? (
                                u._id === user?._id || u.username === user?.username ? (
                                  <span className="px-2 py-1 text-[10px] text-slate-400 dark:text-slate-500 italic">Self</span>
                                ) : (
                                  <button
                                    onClick={() => setSuspendUserTarget(u)}
                                    className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-lg cursor-pointer"
                                  >
                                    Suspend
                                  </button>
                                )
                              ) : (
                                <button
                                  onClick={() => handleReviewReactivation(u._id, 'Approve')}
                                  className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-655 dark:text-emerald-400 border border-emerald-500/20 rounded-lg cursor-pointer"
                                >
                                  Reactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Corporate hierarchy visual */}
              <div className="glass-card border border-blue-500/20 rounded-2xl p-5">
                <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">Corporate Hierarchy Tree</h3>
                <div className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-blue-500/10 bg-slate-50/50 dark:bg-[#0E1325]/30 rounded-xl relative">
                  <div className="px-5 py-2.5 bg-blue-600 border border-blue-500 rounded-xl font-black text-xs uppercase shadow text-center text-white">
                    {isDemoMode ? "TechNova Global" : (user?.organization?.name || "TechNova Global")} Head
                  </div>
                  
                  {/* Vertical link line */}
                  <div className="h-8 w-0.5 bg-blue-500/40 my-1" />

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full pt-1">
                    {departments.slice(0, 3).map((d, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="h-4 w-0.5 bg-blue-500/40" />
                        <div className="w-full p-3 bg-white dark:bg-[#1A203E]/80 border border-slate-200 dark:border-blue-500/20 rounded-xl text-center text-xs font-semibold shadow-sm">
                          <p className="font-bold text-slate-800 dark:text-white uppercase">{d.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Code: {d.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Department cards list */}
              <div className="glass-card border border-blue-500/20 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Company Departments</h3>
                  <button onClick={() => setModalType('dept')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all border-0 cursor-pointer"><Plus className="h-3.5 w-3.5" /> New Dept</button>
                </div>
                {loadingSetup ? (
                  <p className="text-xs text-slate-450 italic text-center py-4">Loading departments...</p>
                ) : departments.length === 0 ? (
                  <p className="text-xs text-slate-455 italic text-center py-4">No departments found. Create one using the action panel.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map((d, i) => (
                      <div key={i} className="p-4 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/40 rounded-xl flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{d.name}</h4>
                          <p className="text-[10px] text-slate-550 dark:text-slate-405 mt-0.5">Code: <span className="text-blue-700 dark:text-blue-300 font-mono font-semibold">{d.code}</span></p>
                        </div>
                        <button onClick={() => handleDeleteDept(d._id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-[10px] px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-all">Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel Actions & Locations */}
            <div className="space-y-6">
              {/* Quick Actions Panel */}
              <div className="glass-card border border-blue-500/20 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Global Administrative Actions</h3>
                <div className="flex flex-col gap-2.5">
                  <button onClick={() => setModalType('dept')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-blue-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-[#1F2647] hover:border-blue-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between border-0 cursor-pointer"><span>Create New Department</span><ArrowRight className="h-4 w-4 text-blue-655 dark:text-blue-400" /></button>
                  <button onClick={() => setModalType('desig')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-blue-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-[#1F2647] hover:border-blue-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between border-0 cursor-pointer"><span>Configure Designations</span><ArrowRight className="h-4 w-4 text-blue-655 dark:text-blue-400" /></button>
                  <button onClick={() => setModalType('office')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-blue-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-[#1F2647] hover:border-blue-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between border-0 cursor-pointer"><span>Add Office Location</span><ArrowRight className="h-4 w-4 text-blue-655 dark:text-blue-400" /></button>
                  <button onClick={() => setModalType('shift')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-blue-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-[#1F2647] hover:border-blue-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between border-0 cursor-pointer"><span>Modify Roster Work Shifts</span><ArrowRight className="h-4 w-4 text-blue-655 dark:text-blue-400" /></button>
                </div>
              </div>

              {/* Office Locations */}
              <div className="glass-card border border-blue-500/20 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Office Location Nodes</h3>
                  <button onClick={() => setModalType('office')} className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-400 font-bold text-xs py-1 px-2.5 rounded-lg flex items-center gap-1 border border-blue-500/20 cursor-pointer transition-all"><Plus className="h-3 w-3" /> Add Office</button>
                </div>
                {loadingSetup ? (
                  <p className="text-xs text-slate-455 italic text-center py-4">Loading office locations...</p>
                ) : officeLocations.length === 0 ? (
                  <p className="text-xs text-slate-455 italic text-center py-4">No office locations configured.</p>
                ) : (
                  <div className="space-y-3 font-mono text-[10px] text-slate-650 dark:text-slate-350">
                    {officeLocations.map((loc, i) => (
                      <div key={i} className="p-2.5 border border-slate-200 dark:border-[#1F2647] bg-slate-50/30 dark:bg-[#0E1325]/20 rounded-xl flex justify-between items-center">
                        <div className="space-y-0.5 text-left font-sans">
                          <span className="text-blue-700 dark:text-blue-400 font-bold">{loc.name}</span>
                          <p className="text-slate-500 dark:text-slate-405 mt-0.5">{loc.address}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Total Employees: {loc.totalEmployees}</p>
                        </div>
                        <button onClick={() => handleDeleteOffice(loc._id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-[9px] px-2 py-1 rounded-lg border-0 cursor-pointer transition-all">Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'reactivations' && (
        <div className="glass-card border border-blue-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">
            Pending Reactivation Requests (HR Managers)
          </h3>
          {pendingReactivationRequests.length === 0 ? (
            <p className="text-xs text-slate-455 italic py-8 text-center">No pending reactivation requests from HR Managers.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Reason</th>
                    <th className="pb-3 font-semibold">Requested At</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200">
                  {pendingReactivationRequests.map((req, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                      <td className="py-3 font-sans">
                        <div className="font-bold text-slate-900 dark:text-white">{req.username}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{req.email}</div>
                      </td>
                      <td className="py-3 text-slate-350 font-sans">{req.reactivationRequest?.reason}</td>
                      <td className="py-3 font-mono">{req.reactivationRequest?.requestedAt ? new Date(req.reactivationRequest.requestedAt).toLocaleString() : 'N/A'}</td>
                      <td className="py-3 text-right font-sans">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleReviewReactivation(req._id, 'Approve')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg cursor-pointer border-0"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewReactivation(req._id, 'Reject')}
                            className="bg-red-500 hover:bg-red-650 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg cursor-pointer border-0"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Local Modals */}
      <AnimatePresence>
        {suspendUserTarget && (
          <LocalModal title="Suspend HR Account" onClose={() => setSuspendUserTarget(null)}>
            <form onSubmit={handleSuspendUserSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">Reason for Suspension</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide suspension reason..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setSuspendUserTarget(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={suspendingUser}
                  className="px-4 py-2 text-xs font-bold uppercase text-white bg-orange-550 hover:bg-orange-650 rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {suspendingUser ? 'Suspending...' : 'Suspend HR Manager'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {modalType === 'dept' && (
          <LocalModal title="Add New Department" onClose={() => setModalType(null)}>
            <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Department Name</label>
                <input name="deptName" required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Research and Development" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Department Code</label>
                <input name="deptCode" required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. R_D" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Department Manager</label>
                <select name="deptManager" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
                  <option value="">-- Select Manager / Unassigned --</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>{e.firstName} {e.lastName} ({e.designation || 'Staff'})</option>
                  ))}
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all border-0 cursor-pointer">Submit Entry</button>
              </div>
            </form>
          </LocalModal>
        )}

        {modalType === 'desig' && (
          <LocalModal title="Add New Designation" onClose={() => setModalType(null)}>
            <form onSubmit={handleCreateDesignation} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Designation Title</label>
                <input name="desigName" required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Lead Devops Architect" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Designation Code</label>
                <input name="desigCode" required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. L_DEVOPS" />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all border-0 cursor-pointer">Submit Designation</button>
              </div>
            </form>
          </LocalModal>
        )}

        {modalType === 'holiday' && (
          <LocalModal title="Configure Calendar Holiday" onClose={() => setModalType(null)}>
            <form onSubmit={(e) => { e.preventDefault(); toast.success('Holiday Calendar Updated!'); setModalType(null); }} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Holiday Occasion</label>
                <input required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Independence Day Parade" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Scheduled Date</label>
                <input required type="date" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all border-0 cursor-pointer">Save Calendar</button>
              </div>
            </form>
          </LocalModal>
        )}

        {modalType === 'shift' && (
          <LocalModal title="Configure Work Shifts" onClose={() => setModalType(null)}>
            <form onSubmit={handleCreateWorkShift} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Shift Name</label>
                <input name="shiftName" required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Night Roster" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">Start Time</label>
                  <input name="shiftStart" required type="text" placeholder="e.g. 22:00" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">End Time</label>
                  <input name="shiftEnd" required type="text" placeholder="e.g. 06:00" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all border-0 cursor-pointer">Submit Shift</button>
              </div>
            </form>
          </LocalModal>
        )}

        {modalType === 'office' && (
          <LocalModal title="Add New Office Location" onClose={() => setModalType(null)}>
            <form onSubmit={handleCreateOfficeLocation} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Office Branch Name</label>
                <input name="officeName" required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Bangalore HQ" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Office Address</label>
                <input name="officeAddress" required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. E-City Block D, Bangalore" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Total Employees</label>
                <input name="officeTotalEmployees" type="number" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. 180" defaultValue="0" />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all border-0 cursor-pointer">Submit Office Location</button>
              </div>
            </form>
          </LocalModal>
        )}
      </AnimatePresence>
    </div>
  );
};

const HRManagerDashboard = () => {
  const { user } = useContext(AuthContext);
  const { isDemoMode } = useContext(DemoContext);
  const [pipeline] = useState({
    Applied: 105,
    Interview: 42,
    Offer: 15,
    Joined: 9,
    Rejected: 33
  });

  const [leaves, setLeaves] = useState([
    { _id: 'lv1', name: 'Riya Sharma', type: 'Sick Leave', range: '2026-07-06 to 2026-07-08', status: 'Pending' },
    { _id: 'lv2', name: 'Karan Patel', type: 'Earned Leave', range: '2026-07-12 to 2026-07-15', status: 'Pending' },
    { _id: 'lv3', name: 'Priya Singh', type: 'Casual Leave', range: '2026-07-20 to 2026-07-21', status: 'Pending' }
  ]);

  const [newJoiners] = useState([
    { name: 'Sarah Jenkins', dept: 'Engineering', date: '2026-07-01', status: 'Completed onboarding' },
    { name: 'Elena Rostova', dept: 'IT Operations', date: '2026-07-01', status: 'Access provisioned' },
    { name: 'Alex Kovac', dept: 'Finance Systems', date: '2026-07-02', status: 'Training Phase' },
    { name: 'Marcus Vane', dept: 'Information Security', date: '2026-07-05', status: 'Profile Active' },
    { name: 'Karan Patel', dept: 'Engineering', date: '2026-07-05', status: 'Laptops Configured' }
  ]);

  const attendanceAlerts = [
    { name: 'Rohit Das', rate: '71%', icon: '📉' },
    { name: 'Sneha Gupta', rate: '74%', icon: '📉' }
  ];

  const handleLeaveAction = (id, action) => {
    setLeaves(leaves.map(l => l._id === id ? { ...l, status: action } : l));
    toast.success(`Leave request ${action.toLowerCase()}!`);
  };

  // NEW HR STATES
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'staff' | 'reactivations' | 'progress-reports'
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [progressReports, setProgressReports] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [postingJob, setPostingJob] = useState(false);

  // Modals state
  const [suspendUserTarget, setSuspendUserTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendingUser, setSuspendingUser] = useState(false);

  const [editStaffTarget, setEditStaffTarget] = useState(null); // employee object
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [updatingStaff, setUpdatingStaff] = useState(false);

  const [showRequestReportModal, setShowRequestReportModal] = useState(false);
  const [selectedLeadForReport, setSelectedLeadForReport] = useState('');
  const [dateRangeFrom, setDateRangeFrom] = useState('');
  const [dateRangeTo, setDateRangeTo] = useState('');
  const [requestingReport, setRequestingReport] = useState(false);

  const [reviewReportTarget, setReviewReportTarget] = useState(null); // progress report object
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [actionItemInput, setActionItemInput] = useState('');
  const [actionItems, setActionItems] = useState([]);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadHRData = async () => {
    try {
      setLoading(true);
      const [userRes, empRes, deptRes, reportRes, jobsRes, candidatesRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/employees').catch(() => ({ data: [] })),
        api.get('/departments').catch(() => ({ data: [] })),
        api.get('/progress-reports').catch(() => ({ data: [] })),
        api.get('/recruitment/jobs').catch(() => ({ data: [] })),
        api.get('/recruitment/candidates').catch(() => ({ data: [] }))
      ]);
      setUsers(userRes.data || []);
      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
      setProgressReports(reportRes.data || []);
      setJobs(jobsRes.data || []);
      setCandidates(candidatesRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load HR administrative records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    loadHRData();
  }, [isDemoMode]);

  const handlePostJobSubmit = async (e) => {
    e.preventDefault();
    const title = e.target.jobTitle.value;
    const department = e.target.jobDept.value;
    const description = e.target.jobDesc.value;

    if (!title || !department || !description) {
      toast.warning('All fields are required');
      return;
    }

    if (isDemoMode) {
      const mockJob = { _id: 'mockJob' + Date.now(), title, department, description, createdAt: new Date() };
      setJobs([mockJob, ...jobs]);
      toast.success('Job vacancy posted successfully (Demo Mode)!');
      setShowPostJobModal(false);
      return;
    }

    try {
      setPostingJob(true);
      await api.post('/recruitment/jobs', { title, department, description });
      toast.success('Job vacancy posted successfully!');
      setShowPostJobModal(false);
      await loadHRData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post job vacancy');
    } finally {
      setPostingJob(false);
    }
  };

  const handleSuspendUserSubmit = async (e) => {
    e.preventDefault();
    if (!suspendReason) {
      toast.warning('Please enter suspension reason');
      return;
    }

    try {
      setSuspendingUser(true);
      await api.post(`/users/${suspendUserTarget._id}/deactivate`, { reason: suspendReason });
      toast.success('Account suspended successfully');
      setSuspendUserTarget(null);
      setSuspendReason('');
      await loadHRData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to suspend account');
    } finally {
      setSuspendingUser(false);
    }
  };

  const handleReviewReactivation = async (userId, action) => {
    try {
      await api.put(`/users/${userId}/reactivation-review`, { action });
      toast.success(`Request ${action}d successfully`);
      await loadHRData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to review request');
    }
  };

  const handleEditStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdatingStaff(true);
      // Calls payroll / manager / department updates
      await api.put(`/employees/${editStaffTarget._id}/transfer`, {
        department: selectedDept,
        reportingManager: selectedManager || undefined
      });
      toast.success('Staff transfer details updated');
      setEditStaffTarget(null);
      await loadHRData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update employee details');
    } finally {
      setUpdatingStaff(false);
    }
  };

  const handleRoleChange = async (userId, newRoleName) => {
    try {
      await api.put(`/users/${userId}/role`, { roleName: newRoleName });
      toast.success(`Role updated to ${newRoleName}`);
      await loadHRData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleRequestReportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeadForReport || !dateRangeFrom || !dateRangeTo) {
      toast.warning('All fields are required');
      return;
    }

    try {
      setRequestingReport(true);
      await api.post('/progress-reports/request', {
        teamLeadId: selectedLeadForReport,
        dateRange: { from: dateRangeFrom, to: dateRangeTo }
      });
      toast.success('Progress report requested successfully');
      setShowRequestReportModal(false);
      setSelectedLeadForReport('');
      setDateRangeFrom('');
      setDateRangeTo('');
      await loadHRData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request report');
    } finally {
      setRequestingReport(false);
    }
  };

  const handleAddFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingFeedback(true);
      await api.put(`/progress-reports/${reviewReportTarget._id}/feedback`, {
        rating: feedbackRating,
        comments: feedbackComments,
        actionItems
      });
      toast.success('Feedback submitted successfully');
      setReviewReportTarget(null);
      setFeedbackComments('');
      setFeedbackRating(5);
      setActionItems([]);
      await loadHRData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleAddActionItem = () => {
    if (actionItemInput.trim()) {
      setActionItems([...actionItems, actionItemInput.trim()]);
      setActionItemInput('');
    }
  };

  const handleRemoveActionItem = (index) => {
    setActionItems(actionItems.filter((_, idx) => idx !== index));
  };

  // Filters
  const hrAndBelowUsers = users.filter(u => 
    u.role?.name !== 'Super Admin' && 
    u.role?.name !== 'Organization Admin' && 
    u.status !== 'Deleted'
  );

  const pendingReactivationRequests = users.filter(u => 
    u.status === 'Deactivation_Requested' && 
    (u.role?.name === 'Employee' || u.role?.name === 'Team Lead')
  );

  const teamLeadsList = users.filter(u => u.role?.name === 'Team Lead' && u.status === 'Active');

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-x-2">
        <Activity className="h-6 w-6 text-teal-500 animate-spin" />
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading HR database records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-indigo-500/20 pb-1 gap-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent border-0 ${activeTab === 'overview' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-250'}`}
        >
          Recruitment & Leaves
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent border-0 ${activeTab === 'staff' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-250'}`}
        >
          All Staff Management
        </button>
        <button
          onClick={() => setActiveTab('reactivations')}
          className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer relative bg-transparent border-0 ${activeTab === 'reactivations' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-250'}`}
        >
          Reactivation Requests
          {pendingReactivationRequests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-650 text-white animate-bounce">
              {pendingReactivationRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('progress-reports')}
          className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent border-0 ${activeTab === 'progress-reports' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-250'}`}
        >
          TL Progress Reports
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Grid KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Recruitment Pipeline" value={candidates.length > 0 ? `${candidates.length} Candidates` : "180 Candidates"} colorAccent="teal" icon={Users} desc="All Active Openings" />
            <StatCard label="Active Leaves" value="12 Members" colorAccent="teal" icon={Calendar} desc="This Week Roster" />
            <StatCard label="Open Job Postings" value={jobs.length > 0 ? `${jobs.length} Roles` : "6 Roles"} colorAccent="teal" icon={Briefcase} desc="3 Referral Bonuses Active" />
            <StatCard label="Monthly New Hires" value="9 Onboarded" colorAccent="teal" icon={Award} desc="2 Pending Verification" />
          </div>

          {/* Recruitment Pipeline Banner */}
          <div className="glass-card border border-teal-500/20 rounded-2xl p-5">
            <h3 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">Candidate Recruitment Pipeline</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(pipeline).map(([key, val], idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/45 text-center relative overflow-hidden">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">{key}</p>
                  <p className="text-2xl font-black text-teal-750 dark:text-teal-300 mt-2">{val}</p>
                  <div className="absolute top-0 right-0 h-10 w-10 bg-teal-500/5 rounded-full blur-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Leave approvals */}
              <div className="glass-card border border-teal-500/20 rounded-2xl p-5">
                <h3 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">Pending Leave Approvals</h3>
                {leaves.filter(l => l.status === 'Pending').length === 0 ? (
                  <p className="text-xs text-slate-450 italic py-4 text-center">No pending leave approvals detected.</p>
                ) : (
                  <div className="space-y-3">
                    {leaves.filter(l => l.status === 'Pending').map((l, i) => (
                      <div key={i} className="p-3 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/30 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{l.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{l.type} · <span className="text-teal-650 dark:text-teal-300">{l.range}</span></p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleLeaveAction(l._id, 'Approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2.5 py-1 rounded transition-all border-0 cursor-pointer">Approve</button>
                          <button onClick={() => handleLeaveAction(l._id, 'Rejected')} className="bg-red-500 hover:bg-red-650 text-white font-bold text-[9px] px-2.5 py-1 rounded transition-all border-0 cursor-pointer">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Joiners list */}
              <div className="glass-card border border-teal-500/20 rounded-2xl p-5">
                <h3 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">New Joiners - This Month</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                    <thead>
                      <tr className="text-slate-500 dark:text-slate-400 text-left">
                        <th className="pb-3 font-semibold">Employee</th>
                        <th className="pb-3 font-semibold">Department</th>
                        <th className="pb-3 font-semibold">Joining Date</th>
                        <th className="pb-3 font-semibold">Status Badge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200">
                      {newJoiners.map((j, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                          <td className="py-2.5 font-bold">{j.name}</td>
                          <td className="py-2.5 text-teal-700 dark:text-teal-300 font-semibold">{j.dept}</td>
                          <td className="py-2.5 font-mono">{j.date}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/20 text-[9px] uppercase font-black">{j.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Side Alerts and Shortcuts */}
            <div className="space-y-6">
              <div className="glass-card border border-teal-500/20 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest">HR Shortcuts</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={() => navigate('/admin/employees')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-teal-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-teal-655/10 border border-slate-200 dark:border-[#1F2647] hover:border-teal-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between border-0 cursor-pointer"><span>Onboard New Employee</span><ArrowRight className="h-4 w-4 text-teal-655 dark:text-teal-400" /></button>
                  <button onClick={() => setShowPostJobModal(true)} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-teal-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-teal-655/10 border border-slate-200 dark:border-[#1F2647] hover:border-teal-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between border-0 cursor-pointer"><span>Post Job Vacancy</span><ArrowRight className="h-4 w-4 text-teal-655 dark:text-teal-400" /></button>
                  <button onClick={() => toast.info('Payroll execution is restricted to Finance role.')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-teal-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-teal-655/10 border border-slate-200 dark:border-[#1F2647] hover:border-teal-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between border-0 cursor-pointer"><span>Run Staff Payroll</span><ArrowRight className="h-4 w-4 text-teal-655 dark:text-teal-400" /></button>
                </div>
              </div>

              <div className="glass-card border border-teal-500/20 rounded-2xl p-5">
                <h3 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">Critical Attendance Alerts</h3>
                <div className="space-y-3">
                  {attendanceAlerts.map((a, idx) => (
                    <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{a.icon}</span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{a.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Attendance drops below threshold</p>
                        </div>
                      </div>
                      <span className="font-bold text-red-650 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{a.rate} This Month</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'staff' && (
        <div className="glass-card border border-teal-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">
            Corporate Staff Directory (Team Leads, Department Managers & Employees)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Employee Profile</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Role / Grade</th>
                  <th className="pb-3 font-semibold">Reporting Manager</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200">
                {hrAndBelowUsers.map((u, i) => {
                  const emp = employees.find(e => String(e.userRef?._id || e.userRef) === String(u._id));
                  const managerEmp = emp?.reportingManager ? employees.find(e => String(e._id) === String(emp.reportingManager)) : null;

                  return (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                      <td className="py-2.5 font-bold">
                        <div>{u.username}</div>
                        <div className="text-[9px] text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="py-2.5">
                        {emp ? `${emp.firstName} ${emp.lastName}` : 'No Profile Link'}
                      </td>
                      <td className="py-2.5 text-teal-650 dark:text-teal-350 font-semibold">
                        {emp?.department || 'N/A'}
                      </td>
                      <td className="py-2.5">
                        {(() => {
                          const targetRole = u.role?.name || u.role || 'Employee';
                          const isProtected = ['Super Admin', 'Organization Admin', 'HR Manager', 'Manager', 'Department Manager'].includes(targetRole) || u._id === user?._id;
                          if (isProtected) {
                            return <span className="font-bold text-[10px] text-slate-500">{targetRole === 'Manager' ? 'Department Manager' : targetRole}</span>;
                          }
                          return (
                            <select
                              value={u.role?.name || u.role || 'Employee'}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="bg-[#0B1023] border border-slate-800 rounded p-1 text-[10px] text-slate-300"
                            >
                              <option value="Employee">Employee</option>
                              <option value="Team Lead">Team Lead</option>
                              <option value="Manager">Department Manager</option>
                              <option value="HR Manager">HR Manager</option>
                            </select>
                          );
                        })()}
                      </td>
                      <td className="py-2.5">
                        {managerEmp ? `${managerEmp.firstName} ${managerEmp.lastName}` : 'None'}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right space-x-2">
                        {(() => {
                          const targetRole = u.role?.name || u.role || 'Employee';
                          const isProtected = ['Super Admin', 'Organization Admin', 'HR Manager', 'Manager', 'Department Manager'].includes(targetRole) || u._id === user?._id;
                          if (isProtected) {
                            return <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Protected Profile</span>;
                          }
                          return (
                            <>
                              {emp && (
                                <button
                                  onClick={() => {
                                    setEditStaffTarget(emp);
                                    setSelectedDept(emp.department || '');
                                    setSelectedManager(emp.reportingManager || '');
                                  }}
                                  className="px-2 py-1 text-[9px] font-bold uppercase bg-teal-500/10 hover:bg-teal-500/20 text-teal-650 dark:text-teal-400 border border-teal-500/20 rounded-lg cursor-pointer"
                                >
                                  Edit Transfer
                                </button>
                              )}
                              {u.status !== 'Suspended' ? (
                                u._id === user?._id || u.username === user?.username ? (
                                  <span className="px-2 py-1 text-[10px] text-slate-400 dark:text-slate-500 italic">Self</span>
                                ) : (
                                  <button
                                    onClick={() => setSuspendUserTarget(u)}
                                    className="px-2 py-1 text-[9px] font-bold uppercase bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-lg cursor-pointer"
                                  >
                                    Suspend
                                  </button>
                                )
                              ) : (
                                <button
                                  onClick={() => handleReviewReactivation(u._id, 'Approve')}
                                  className="px-2 py-1 text-[9px] font-bold uppercase bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 rounded-lg cursor-pointer"
                                >
                                  Reactivate
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reactivations' && (
        <div className="glass-card border border-teal-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4">
            Pending Reactivation Requests (Employees & Team Leads)
          </h3>
          {pendingReactivationRequests.length === 0 ? (
            <p className="text-xs text-slate-455 italic py-8 text-center">No pending reactivation requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Reason</th>
                    <th className="pb-3 font-semibold">Requested At</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200">
                  {pendingReactivationRequests.map((req, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                      <td className="py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{req.username}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{req.email}</div>
                      </td>
                      <td className="py-3 text-teal-650 dark:text-teal-350 font-bold">{req.role?.name || 'Employee'}</td>
                      <td className="py-3 text-slate-350">{req.reactivationRequest?.reason}</td>
                      <td className="py-3 font-mono">{req.reactivationRequest?.requestedAt ? new Date(req.reactivationRequest.requestedAt).toLocaleString() : 'N/A'}</td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleReviewReactivation(req._id, 'Approve')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg cursor-pointer border-0"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewReactivation(req._id, 'Reject')}
                            className="bg-red-500 hover:bg-red-650 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg cursor-pointer border-0"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'progress-reports' && (
        <div className="glass-card border border-teal-500/20 rounded-2xl p-5 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest">
              Team Lead Progress Reports Command Center
            </h3>
            <button
              onClick={() => setShowRequestReportModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all border-0 cursor-pointer animate-pulse"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Request Progress Report</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                  <th className="pb-3 font-semibold">Team Lead</th>
                  <th className="pb-3 font-semibold">Date Range</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Details / Feedback</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-205">
                {progressReports.map((pr, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                      {pr.teamLeadId?.username || 'TL User'}
                    </td>
                    <td className="py-2.5 font-mono">
                      {new Date(pr.dateRange.from).toLocaleDateString()} - {new Date(pr.dateRange.to).toLocaleDateString()}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        pr.status === 'Submitted' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                        pr.status === 'Reviewed' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-550/20'
                      }`}>
                        {pr.status}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {pr.status === 'Reviewed' ? (
                        <div>
                          <div className="font-bold text-emerald-600">Rating: {pr.hrFeedback?.rating}/5</div>
                          <div className="text-[10px] text-slate-500 italic mt-0.5">"{pr.hrFeedback?.comments}"</div>
                        </div>
                      ) : pr.status === 'Submitted' ? (
                        <div className="text-slate-400">Submitted report on {new Date(pr.teamLeadReport?.submittedAt).toLocaleDateString()} · Progress: <span className="font-bold text-slate-200">{pr.teamLeadReport?.overallProgress}%</span></div>
                      ) : (
                        <span className="text-slate-500">Awaiting Team Lead Submission</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-sans">
                      {pr.status === 'Submitted' && (
                        <button
                          onClick={() => {
                            setReviewReportTarget(pr);
                            setFeedbackRating(5);
                            setFeedbackComments('');
                            setActionItems(pr.hrFeedback?.actionItems || []);
                          }}
                          className="px-2 py-1 text-[9px] font-bold uppercase bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 rounded-lg cursor-pointer"
                        >
                          Review & Feedback
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW HR MODALS */}
      <AnimatePresence>
        {/* Suspend Modal */}
        {suspendUserTarget && (
          <LocalModal title="Suspend Account" onClose={() => setSuspendUserTarget(null)}>
            <form onSubmit={handleSuspendUserSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">Reason for Suspension</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Suspension reason..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                ></textarea>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setSuspendUserTarget(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={suspendingUser}
                  className="px-4 py-2 text-xs font-bold uppercase text-white bg-orange-550 hover:bg-orange-650 rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {suspendingUser ? 'Suspending...' : 'Suspend Account'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {/* Transfer Staff Modal */}
        {editStaffTarget && (
          <LocalModal title={`Transfer Staff: ${editStaffTarget.firstName} ${editStaffTarget.lastName}`} onClose={() => setEditStaffTarget(null)}>
            <form onSubmit={handleEditStaffSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map(d => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">Reporting Manager</label>
                <select
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">-- No Reporting Manager / Unassigned --</option>
                  {employees.filter(e => String(e._id) !== String(editStaffTarget._id)).map(e => (
                    <option key={e._id} value={e._id}>{e.firstName} {e.lastName} ({e.designation || 'Staff'})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setEditStaffTarget(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStaff}
                  className="px-4 py-2 text-xs font-bold uppercase text-white btn-premium-gradient rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {updatingStaff ? 'Updating...' : 'Save Transfer Details'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {/* Request Progress Report Modal */}
        {showRequestReportModal && (
          <LocalModal title="Request Team Lead Progress Report" onClose={() => setShowRequestReportModal(false)}>
            <form onSubmit={handleRequestReportSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">Team Lead</label>
                <select
                  value={selectedLeadForReport}
                  onChange={(e) => setSelectedLeadForReport(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Team Lead --</option>
                  {teamLeadsList.map(tl => (
                    <option key={tl._id} value={tl._id}>{tl.username} ({tl.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase">Date Range From</label>
                  <input
                    type="date"
                    required
                    value={dateRangeFrom}
                    onChange={(e) => setDateRangeFrom(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase">Date Range To</label>
                  <input
                    type="date"
                    required
                    value={dateRangeTo}
                    onChange={(e) => setDateRangeTo(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setShowRequestReportModal(false)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingReport}
                  className="px-4 py-2 text-xs font-bold uppercase text-white btn-premium-gradient rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {requestingReport ? 'Requesting...' : 'Send Request'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {/* Post Job Vacancy Modal */}
        {showPostJobModal && (
          <LocalModal title="Post New Job Vacancy" onClose={() => setShowPostJobModal(false)}>
            <form onSubmit={handlePostJobSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">Department</label>
                <select
                  name="jobDept"
                  required
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map(d => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">Job Description</label>
                <textarea
                  name="jobDesc"
                  required
                  rows={4}
                  placeholder="Provide details about the job responsibilities, skills, and qualifications..."
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setShowPostJobModal(false)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postingJob}
                  className="px-4 py-2 text-xs font-bold uppercase text-white btn-premium-gradient rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {postingJob ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}
        {reviewReportTarget && (
          <LocalModal title={`Review Team Lead Progress Report`} onClose={() => setReviewReportTarget(null)}>
            <form onSubmit={handleAddFeedbackSubmit} className="space-y-4 text-xs">
              <div className="bg-black/30 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-350">Submission Summary</h4>
                <div className="flex justify-between font-mono text-[10px]">
                  <span>Overall Sprint Progress:</span>
                  <span className="font-bold text-teal-400">{reviewReportTarget.teamLeadReport?.overallProgress}%</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed italic">
                  "{reviewReportTarget.teamLeadReport?.teamSummary}"
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 font-bold uppercase text-[10px]">Star Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  required
                  value={feedbackRating}
                  onChange={(e) => setFeedbackRating(Number(e.target.value))}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 font-bold uppercase text-[10px]">Review Comments</label>
                <textarea
                  required
                  rows={3}
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  placeholder="Provide feedback comments or guidance for the team lead..."
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 font-bold uppercase text-[10px]">Action Items / Goals</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={actionItemInput}
                    onChange={(e) => setActionItemInput(e.target.value)}
                    placeholder="Enter action item..."
                    className="flex-1 text-xs p-2 bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddActionItem}
                    className="px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl border-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {actionItems.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[9px] border border-slate-700">
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveActionItem(idx)}
                        className="text-red-500 font-bold hover:text-white bg-transparent border-0 cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setReviewReportTarget(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-4 py-2 text-xs font-bold uppercase text-white btn-premium-gradient rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}
      </AnimatePresence>
    </div>
  );
};

const ManagerDashboard = () => {
  const { isDemoMode } = useContext(DemoContext);
  const { progressStore } = useContext(DemoProgressContext);
  const [activeTab, setActiveTab] = useState('supervised'); // 'supervised' | 'projects' | 'project-requests' | 'team-requests' | 'leaves'
  const [expandedTeam, setExpandedTeam] = useState(null); // 'arjun' | 'sneha' | null

  // State lists
  const [projects, setProjects] = useState([]);
  const [projectRequests, setProjectRequests] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showAssignProjectModal, setShowAssignProjectModal] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: '', description: '', department: 'Engineering' });
  const [assignProjectData, setAssignProjectData] = useState({ projectId: '', teamLeadId: '' });

  // Pending leaves
  const [leaves, setLeaves] = useState([
    { id: 1, name: 'Riya Sharma', type: 'Sick Leave', dates: '2026-07-06 to 2026-07-08', status: 'Pending' },
    { id: 2, name: 'Amit Verma', type: 'Earned Leave', dates: '2026-07-10 to 2026-07-12', status: 'Pending' }
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projRes, reqRes, teamReqRes, empRes] = await Promise.all([
        api.get('/projects').catch(() => ({ data: [] })),
        api.get('/projects/requests').catch(() => ({ data: [] })),
        api.get('/projects/team-requests').catch(() => ({ data: [] })),
        api.get('/employees').catch(() => ({ data: [] }))
      ]);
      setProjects(projRes.data || []);
      setProjectRequests(reqRes.data || []);
      setTeamRequests(teamReqRes.data || []);
      
      const allEmps = empRes.data || [];
      setEmployees(allEmps);
      // Filter team leads from designations
      setTeamLeads(allEmps.filter(e => e.designation?.toLowerCase().includes('lead') || e.designation?.toLowerCase().includes('manager')));
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve workspace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      // Setup demo data
      setProjects([
        { _id: 'p1', name: 'Employee Portal v2', description: 'Upgraded employee self-service portal', department: 'Engineering', assignedTeamLead: { _id: 'tl1', firstName: 'Arjun', lastName: 'Mehta', employeeId: 'TL001' }, employees: ['emp1', 'emp2', 'emp3'], status: 'Ongoing', pendingAgreement: false, agreedEmployees: [] },
        { _id: 'p2', name: 'Payroll Automation', description: 'Automatic salary processor', department: 'Engineering', assignedTeamLead: { _id: 'tl2', firstName: 'Sneha', lastName: 'Gupta', employeeId: 'TL002' }, employees: ['emp4', 'emp5', 'emp6'], status: 'Ongoing', pendingAgreement: false, agreedEmployees: [] },
        { _id: 'p3', name: 'Cloud Migration', description: 'Migrate infrastructure to AWS', department: 'Engineering', assignedTeamLead: null, employees: [], status: 'Ongoing', pendingAgreement: false, agreedEmployees: [] },
        { _id: 'p4', name: 'AI Operations Hub', description: 'Gemini assistant integration', department: 'Engineering', assignedTeamLead: null, employees: [], status: 'Ongoing', pendingAgreement: false, agreedEmployees: [] }
      ]);
      setProjectRequests([
        { _id: 'pr1', type: 'EmployeeRequest', teamLead: { _id: 'tl1', firstName: 'Arjun', lastName: 'Mehta', employeeId: 'TL001' }, currentProject: { name: 'Employee Portal v2' }, requestedProject: { _id: 'p3', name: 'Cloud Migration' }, employeesAgreed: [{ _id: 'emp1', firstName: 'Riya', lastName: 'Sharma' }, { _id: 'emp2', firstName: 'Karan', lastName: 'Patel' }], status: 'Pending_Dept_Approval', comments: 'Requested project swap due to client requirements.' }
      ]);
      setTeamRequests([
        { _id: 'tr1', type: 'ChangeTeamLead', currentTeamLead: { _id: 'tl2', firstName: 'Sneha', lastName: 'Gupta', employeeId: 'TL002' }, requestedTeamLead: { _id: 'tl1', firstName: 'Arjun', lastName: 'Mehta', employeeId: 'TL001' }, employeesAgreed: [{ _id: 'emp4', firstName: 'Amit', lastName: 'Verma' }, { _id: 'emp5', firstName: 'Neha', lastName: 'Joshi' }], status: 'Pending', comments: 'Prefer to work under Arjun Mehta.' },
        { _id: 'tr2', type: 'MoveTeam', employee: { firstName: 'Rohit', lastName: 'Das' }, currentTeamLead: { _id: 'tl2', firstName: 'Sneha', lastName: 'Gupta', employeeId: 'TL002' }, requestedTeamLead: { _id: 'tl1', firstName: 'Arjun', lastName: 'Mehta', employeeId: 'TL001' }, status: 'Pending', comments: 'Moving due to UI design focus alignment.' }
      ]);
      setEmployees([
        { _id: 'emp1', firstName: 'Riya', lastName: 'Sharma', reportingManager: 'tl1', department: 'Engineering', designation: 'Developer' },
        { _id: 'emp2', firstName: 'Karan', lastName: 'Patel', reportingManager: 'tl1', department: 'Engineering', designation: 'Developer' },
        { _id: 'emp3', firstName: 'Priya', lastName: 'Singh', reportingManager: 'tl1', department: 'Engineering', designation: 'Developer' },
        { _id: 'emp4', firstName: 'Amit', lastName: 'Verma', reportingManager: 'tl2', department: 'Engineering', designation: 'Developer' },
        { _id: 'emp5', firstName: 'Neha', lastName: 'Joshi', reportingManager: 'tl2', department: 'Engineering', designation: 'Developer' },
        { _id: 'emp6', firstName: 'Rohit', lastName: 'Das', reportingManager: 'tl2', department: 'Engineering', designation: 'Developer' }
      ]);
      setTeamLeads([
        { _id: 'tl1', firstName: 'Arjun', lastName: 'Mehta', employeeId: 'TL001', designation: 'Team Lead' },
        { _id: 'tl2', firstName: 'Sneha', lastName: 'Gupta', employeeId: 'TL002', designation: 'Team Lead' }
      ]);
      setLoading(false);
    } else {
      loadData();
    }
  }, [isDemoMode]);

  const handleLeaveAction = (id, status) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, status } : l));
    toast.success(`Request ${status} successfully`);
  };

  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!newProjectData.name) {
      toast.error('Project Name is required');
      return;
    }

    if (isDemoMode) {
      const newProj = {
        _id: 'p' + (projects.length + 1),
        name: newProjectData.name,
        description: newProjectData.description,
        department: newProjectData.department,
        assignedTeamLead: null,
        employees: [],
        status: 'Ongoing',
        pendingAgreement: false,
        agreedEmployees: []
      };
      setProjects([...projects, newProj]);
      toast.success('Project created (Demo)');
      setShowCreateProjectModal(false);
      setNewProjectData({ name: '', description: '', department: 'Engineering' });
      return;
    }

    try {
      await api.post('/projects', newProjectData);
      toast.success('Project created successfully');
      setShowCreateProjectModal(false);
      setNewProjectData({ name: '', description: '', department: 'Engineering' });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    }
  };

  const handleAssignProjectSubmit = async (e) => {
    e.preventDefault();
    if (!assignProjectData.projectId || !assignProjectData.teamLeadId) {
      toast.error('Select both Project and Team Lead');
      return;
    }

    if (isDemoMode) {
      const targetTL = teamLeads.find(tl => tl._id === assignProjectData.teamLeadId);
      const teamMemberIds = employees.filter(emp => emp.reportingManager === assignProjectData.teamLeadId).map(emp => emp._id);
      
      setProjects(projects.map(p => p._id === assignProjectData.projectId ? {
        ...p,
        assignedTeamLead: targetTL,
        employees: teamMemberIds,
        pendingAgreement: true,
        agreedEmployees: []
      } : p));
      toast.success('Project assigned, awaiting team agreement (Demo)');
      setShowAssignProjectModal(false);
      return;
    }

    try {
      await api.put(`/projects/${assignProjectData.projectId}/assign`, { teamLeadId: assignProjectData.teamLeadId });
      toast.success('Project assigned successfully');
      setShowAssignProjectModal(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign project');
    }
  };

  const handleApproveProjectRequest = async (id) => {
    if (isDemoMode) {
      const req = projectRequests.find(r => r._id === id);
      // Apply mock change
      setProjects(projects.map(p => {
        if (p._id === req.requestedProject._id) {
          return { ...p, assignedTeamLead: req.teamLead, employees: employees.filter(e => e.reportingManager === req.teamLead._id).map(e => e._id) };
        }
        if (p.assignedTeamLead?._id === req.teamLead._id) {
          return { ...p, assignedTeamLead: null, employees: [] };
        }
        return p;
      }));
      setProjectRequests(projectRequests.map(r => r._id === id ? { ...r, status: 'Approved' } : r));
      toast.success('Request approved and projects swapped (Demo)');
      return;
    }

    try {
      await api.put(`/projects/requests/${id}/dept-approve`);
      toast.success('Project request approved');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve request');
    }
  };

  const handleRejectProjectRequest = async (id) => {
    if (isDemoMode) {
      setProjectRequests(projectRequests.map(r => r._id === id ? { ...r, status: 'Rejected' } : r));
      toast.success('Request rejected (Demo)');
      return;
    }
    // real API stub or logic
    toast.info('Rejected project request');
  };

  const handleApproveTeamRequest = async (id) => {
    if (isDemoMode) {
      const req = teamRequests.find(r => r._id === id);
      if (req.type === 'MoveTeam') {
        setEmployees(employees.map(e => e.firstName === req.employee.firstName ? { ...e, reportingManager: req.requestedTeamLead._id } : e));
      } else {
        // change team lead
        setEmployees(employees.map(e => e.reportingManager === req.currentTeamLead._id ? { ...e, reportingManager: req.requestedTeamLead._id } : e));
        setProjects(projects.map(p => p.assignedTeamLead?._id === req.currentTeamLead._id ? { ...p, assignedTeamLead: req.requestedTeamLead } : p));
      }
      setTeamRequests(teamRequests.map(r => r._id === id ? { ...r, status: 'Approved' } : r));
      toast.success('Team reassignment approved (Demo)');
      return;
    }

    try {
      await api.put(`/projects/team-requests/${id}/approve`);
      toast.success('Team request approved');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve request');
    }
  };

  const handleRejectTeamRequest = async (id) => {
    if (isDemoMode) {
      setTeamRequests(teamRequests.map(r => r._id === id ? { ...r, status: 'Rejected' } : r));
      toast.success('Request rejected (Demo)');
      return;
    }
    toast.info('Rejected team request');
  };

  // Sync data dynamically from progressStore
  const arjunProgress = Math.round(
    ((progressStore['riya_sharma'] || 65) + 
     (progressStore['karan_patel'] || 80) + 
     (progressStore['priya_singh'] || 40)) / 3
  );

  const snehaProgress = Math.round(
    ((progressStore['amit_verma'] || 90) + 
     (progressStore['neha_joshi'] || 55) + 
     (progressStore['rohit_das'] || 30)) / 3
  );

  const supervisedTeams = [
    {
      id: 'arjun',
      name: 'Arjun Mehta',
      designation: 'Tech Lead / Eng Lead',
      project: projects.find(p => p.assignedTeamLead?._id === 'tl1' || p.assignedTeamLead === 'tl1')?.name || 'None',
      progress: arjunProgress,
      size: employees.filter(e => e.reportingManager === 'tl1').length,
      avatar: 'AM',
      employees: employees.filter(e => e.reportingManager === 'tl1').map(e => ({
        name: `${e.firstName} ${e.lastName}`,
        task: e.firstName === 'Riya' ? 'API Integration' : e.firstName === 'Karan' ? 'UI Components' : 'Testing',
        progress: e.firstName === 'Riya' ? (progressStore['riya_sharma'] || 65) : e.firstName === 'Karan' ? (progressStore['karan_patel'] || 80) : (progressStore['priya_singh'] || 40),
        status: e.firstName === 'Riya' ? 'In Progress' : e.firstName === 'Karan' ? 'Completed' : 'To Do'
      }))
    },
    {
      id: 'sneha',
      name: 'Sneha Gupta',
      designation: 'Tech Lead / DB Lead',
      project: projects.find(p => p.assignedTeamLead?._id === 'tl2' || p.assignedTeamLead === 'tl2')?.name || 'None',
      progress: snehaProgress,
      size: employees.filter(e => e.reportingManager === 'tl2').length,
      avatar: 'SG',
      employees: employees.filter(e => e.reportingManager === 'tl2').map(e => ({
        name: `${e.firstName} ${e.lastName}`,
        task: e.firstName === 'Amit' ? 'DB Schema' : e.firstName === 'Neha' ? 'Backend APIs' : 'Frontend',
        progress: e.firstName === 'Amit' ? (progressStore['amit_verma'] || 90) : e.firstName === 'Neha' ? (progressStore['neha_joshi'] || 55) : (progressStore['rohit_das'] || 30),
        status: e.firstName === 'Amit' ? 'Review' : e.firstName === 'Neha' ? 'In Progress' : 'To Do'
      }))
    }
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-x-2">
        <Activity className="h-6 w-6 text-orange-500 animate-spin" />
        <span className="text-sm font-bold text-slate-500">Loading Manager workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      {/* Top statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Department" value="Engineering" colorAccent="orange" icon={Briefcase} desc="Platform Unit" />
        <StatCard label="Total Subordinates" value={`${employees.length} Employees`} colorAccent="orange" icon={Users} desc={`${teamLeads.length} Team Leads`} />
        <StatCard label="Active Projects" value={`${projects.filter(p => p.assignedTeamLead).length} Running`} colorAccent="orange" icon={Activity} desc={`${projects.filter(p => !p.assignedTeamLead).length} Backlog`} />
        <StatCard label="Pending Swaps" value={`${projectRequests.filter(r => r.status.includes('Pending')).length} Requests`} colorAccent="orange" icon={Clock} desc="Requires 2/3 agreement" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-indigo-500/20 pb-1 gap-4">
        {[
          ['supervised', 'Supervised Teams'],
          ['projects', 'Projects Workspace'],
          ['project-requests', `Project Requests (${projectRequests.filter(r => r.status.includes('Pending')).length})`],
          ['team-requests', `Team Requests (${teamRequests.filter(r => r.status === 'Pending').length})`],
          ['leaves', `Leave Claims (${leaves.filter(l => l.status === 'Pending').length})`]
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setActiveTab(k)}
            className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent border-0 ${activeTab === k ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-250'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Supervised Teams Tab */}
      {activeTab === 'supervised' && (
        <div className="glass-card border border-orange-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-4">My Supervised Teams</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supervisedTeams.map((t, idx) => (
              <div key={idx} className="p-5 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/40 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30 rounded-xl flex items-center justify-center font-black text-sm uppercase">{t.avatar}</div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.designation}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-200 dark:border-[#1F2647]/50 pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-755 dark:text-slate-350">{t.project}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Overall Progress</span>
                      <span className="text-slate-850 dark:text-white font-bold">{t.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-[#1F2647] h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300" style={{ width: `${t.progress}%` }} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-550">Team Size: {t.size} Developers</p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setExpandedTeam(expandedTeam === t.id ? null : t.id)}
                    className="w-full text-center py-2 bg-orange-600/10 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-500/20 hover:border-transparent rounded-xl text-xs font-bold transition-all"
                  >
                    {expandedTeam === t.id ? 'Hide Team Members' : 'View Team Roster'}
                  </button>
                </div>

                {expandedTeam === t.id && (
                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-[#1F2647] animate-fade-in font-mono text-[10px]">
                    {t.employees.map((emp, i) => (
                      <div key={i} className="p-2.5 bg-white dark:bg-[#0A0D1A]/50 border border-slate-200 dark:border-[#1F2647] rounded-xl space-y-2 shadow-sm">
                        <div className="flex justify-between items-center font-sans">
                          <span className="font-bold text-slate-900 dark:text-white">{emp.name}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] uppercase tracking-wider font-bold ${emp.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : emp.status === 'In Progress' ? 'bg-blue-500/10 text-blue-750' : 'bg-slate-500/10'}`}>{emp.status}</span>
                        </div>
                        <p className="text-slate-500 text-[9px] font-sans">&gt; Task: {emp.task}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] text-slate-400"><span>Progress</span><span>{emp.progress}%</span></div>
                          <div className="w-full bg-slate-200 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400" style={{ width: `${emp.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Workspace Tab */}
      {activeTab === 'projects' && (
        <div className="glass-card border border-orange-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest">Projects Workspace</h3>
            <div className="flex gap-2">
              <button onClick={() => setShowCreateProjectModal(true)} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold border-0 cursor-pointer">Create Project</button>
              <button onClick={() => setShowAssignProjectModal(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold border-0 cursor-pointer">Assign Project</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
              <thead>
                <tr className="text-slate-500 text-left font-mono">
                  <th className="pb-3">Project Name</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Assigned Lead</th>
                  <th className="pb-3">Staff Size</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200 font-mono">
                {projects.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                    <td className="py-3 font-bold font-sans">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{p.description}</div>
                    </td>
                    <td className="py-3">{p.department}</td>
                    <td className="py-3 text-orange-600 font-bold font-sans">
                      {p.assignedTeamLead ? `${p.assignedTeamLead.firstName} ${p.assignedTeamLead.lastName}` : 'Unassigned'}
                    </td>
                    <td className="py-3">{p.employees?.length || 0} Members</td>
                    <td className="py-3">
                      {p.pendingAgreement ? (
                        <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 text-[8px] uppercase tracking-wider font-bold">Awaiting Team Agreement</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[8px] uppercase tracking-wider font-bold">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Requests Tab */}
      {activeTab === 'project-requests' && (
        <div className="glass-card border border-orange-500/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest">Project Selection & Swaps Requests</h3>
          <div className="space-y-4">
            {projectRequests.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No pending project change requests.</p>
            ) : (
              projectRequests.map((r, i) => {
                const teamCount = employees.filter(emp => emp.reportingManager === r.teamLead?._id).length;
                const agreedCount = r.employeesAgreed?.length || 0;
                const ratio = teamCount > 0 ? agreedCount / teamCount : 0;
                const meetsAgreement = ratio >= 2 / 3;

                return (
                  <div key={i} className="p-4 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/30 rounded-xl space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Team Lead: {r.teamLead?.firstName} {r.teamLead?.lastName}</p>
                        <p className="text-[10px] text-slate-500">Request: Swap from <span className="font-bold text-red-500">{r.currentProject?.name || 'No Project'}</span> to <span className="font-bold text-emerald-600">{r.requestedProject?.name}</span></p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold font-mono ${r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-650' : r.status === 'Rejected' ? 'bg-red-550/10 text-red-500' : 'bg-yellow-500/10 text-yellow-600'}`}>{r.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      <span>Employee Agreement: {agreedCount} agreed out of {teamCount} team members ({Math.round(ratio * 100)}%)</span>
                      <div className="w-full bg-slate-200 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className={`h-full ${meetsAgreement ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                      </div>
                    </div>
                    {r.comments && <p className="text-[10px] text-slate-450 italic">&quot;{r.comments}&quot;</p>}

                    {r.status.includes('Pending') && (
                      <div className="flex gap-2">
                        <button
                          disabled={!meetsAgreement}
                          onClick={() => handleApproveProjectRequest(r._id)}
                          className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer border-0 text-white ${meetsAgreement ? 'bg-emerald-605 hover:bg-emerald-705' : 'bg-slate-500 opacity-50 cursor-not-allowed'}`}
                        >
                          Approve Swap
                        </button>
                        <button
                          onClick={() => handleRejectProjectRequest(r._id)}
                          className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded cursor-pointer border-0"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Team Requests Tab */}
      {activeTab === 'team-requests' && (
        <div className="glass-card border border-orange-500/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest">Team Transfer & Lead Change Requests</h3>
          <div className="space-y-4">
            {teamRequests.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No pending team or lead requests.</p>
            ) : (
              teamRequests.map((r, i) => {
                const isChangeLead = r.type === 'ChangeTeamLead';
                const teamCount = isChangeLead ? employees.filter(emp => emp.reportingManager === r.currentTeamLead?._id).length : 1;
                const agreedCount = isChangeLead ? r.employeesAgreed?.length || 0 : 1;
                const ratio = teamCount > 0 ? agreedCount / teamCount : 0;
                const meetsAgreement = !isChangeLead || (ratio >= 2 / 3);

                return (
                  <div key={i} className="p-4 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/30 rounded-xl space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-905 dark:text-white">
                          {isChangeLead ? 'Request: Change Team Lead' : `Request: Move Team (${r.employee?.firstName} ${r.employee?.lastName})`}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {isChangeLead 
                            ? `Move team under ${r.currentTeamLead?.firstName} ${r.currentTeamLead?.lastName} to report to ${r.requestedTeamLead?.firstName} ${r.requestedTeamLead?.lastName}`
                            : `Transfer from ${r.currentTeamLead?.firstName} ${r.currentTeamLead?.lastName}'s team to ${r.requestedTeamLead?.firstName} ${r.requestedTeamLead?.lastName}'s team`
                          }
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold font-mono ${r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-650' : r.status === 'Rejected' ? 'bg-red-550/10 text-red-500' : 'bg-yellow-500/10 text-yellow-600'}`}>{r.status}</span>
                    </div>

                    {isChangeLead && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        <span>Staff Agreement: {agreedCount} agreed out of {teamCount} members ({Math.round(ratio * 100)}%)</span>
                        <div className="w-full bg-slate-200 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className={`h-full ${meetsAgreement ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                        </div>
                      </div>
                    )}
                    {r.comments && <p className="text-[10px] text-slate-450 italic">&quot;{r.comments}&quot;</p>}

                    {r.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          disabled={!meetsAgreement}
                          onClick={() => handleApproveTeamRequest(r._id)}
                          className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer border-0 text-white ${meetsAgreement ? 'bg-emerald-605 hover:bg-emerald-705' : 'bg-slate-500 opacity-50 cursor-not-allowed'}`}
                        >
                          Approve Change
                        </button>
                        <button
                          onClick={() => handleRejectTeamRequest(r._id)}
                          className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded cursor-pointer border-0"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Leaves Tab */}
      {activeTab === 'leaves' && (
        <div className="glass-card border border-orange-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-4">Leave Claims Pending</h3>
          <div className="space-y-3">
            {leaves.filter(l => l.status === 'Pending').length === 0 ? (
              <p className="text-[10px] text-slate-405 italic py-4 text-center">No pending leave claims.</p>
            ) : (
              leaves.filter(l => l.status === 'Pending').map((l, i) => (
                <div key={i} className="p-3 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/30 rounded-xl flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{l.name}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-0.5">{l.type}</p>
                    </div>
                    <span className="text-[9px] text-orange-700 dark:text-orange-355 font-semibold font-mono">{l.dates}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-200/50 dark:border-[#1F2647]/50 pt-2.5">
                    <button onClick={() => handleLeaveAction(l.id, 'Approved')} className="bg-emerald-605 hover:bg-emerald-705 text-white font-bold py-1.5 rounded-lg text-[9px] transition-all border-0 cursor-pointer">Approve</button>
                    <button onClick={() => handleLeaveAction(l.id, 'Rejected')} className="bg-red-500 text-white font-bold py-1.5 rounded-lg text-[9px] transition-all border-0 cursor-pointer">Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateProjectModal && (
        <LocalModal title="Create New Project" onClose={() => setShowCreateProjectModal(false)}>
          <form onSubmit={handleCreateProjectSubmit} className="space-y-4 font-sans text-xs">
            <div className="space-y-1">
              <label className="block text-slate-500 dark:text-slate-450 font-bold uppercase text-[9px]">Project Name</label>
              <input
                type="text"
                required
                value={newProjectData.name}
                onChange={e => setNewProjectData({ ...newProjectData, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none"
                placeholder="e.g. Cloud Migration"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-500 dark:text-slate-450 font-bold uppercase text-[9px]">Description</label>
              <textarea
                value={newProjectData.description}
                onChange={e => setNewProjectData({ ...newProjectData, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none h-20"
                placeholder="Enter details..."
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-500 dark:text-slate-450 font-bold uppercase text-[9px]">Department</label>
              <select
                value={newProjectData.department}
                onChange={e => setNewProjectData({ ...newProjectData, department: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none font-bold"
              >
                <option>Engineering</option>
                <option>Finance</option>
                <option>Human Resources</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all border-0 cursor-pointer">Create Project</button>
          </form>
        </LocalModal>
      )}

      {/* ASSIGN PROJECT MODAL */}
      {showAssignProjectModal && (
        <LocalModal title="Assign Project to Team Lead" onClose={() => setShowAssignProjectModal(false)}>
          <form onSubmit={handleAssignProjectSubmit} className="space-y-4 font-sans text-xs">
            <div className="space-y-1">
              <label className="block text-slate-500 dark:text-slate-450 font-bold uppercase text-[9px]">Select Project</label>
              <select
                value={assignProjectData.projectId}
                onChange={e => setAssignProjectData({ ...assignProjectData, projectId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none font-semibold"
              >
                <option value="">-- Choose Project --</option>
                {projects.filter(p => !p.assignedTeamLead).map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-slate-500 dark:text-slate-450 font-bold uppercase text-[9px]">Assign to Team Lead</label>
              <select
                value={assignProjectData.teamLeadId}
                onChange={e => setAssignProjectData({ ...assignProjectData, teamLeadId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none font-semibold"
              >
                <option value="">-- Choose Team Lead --</option>
                {teamLeads.map(tl => (
                  <option key={tl._id} value={tl._id}>{tl.firstName} {tl.lastName} ({tl.employeeId})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-bold rounded-xl transition-all border-0 cursor-pointer">Assign Project</button>
          </form>
        </LocalModal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. TEAM LEAD DASHBOARD (Cyan)
// ═══════════════════════════════════════════════════════════════════════════════
const TeamLeadDashboard = () => {
  const { isDemoMode } = useContext(DemoContext);
  const { user: currentUser } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'reports' | 'objections' | 'proposals'
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [progressReports, setProgressReports] = useState([]);
  const [objections, setObjections] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [reassignTargetMember, setReassignTargetMember] = useState(null); // employee object
  const [reassignTargetLead, setReassignTargetLead] = useState('');
  const [reassigningMember, setReassigningMember] = useState(false);

  const [submitReportTarget, setSubmitReportTarget] = useState(null); // progress report request object
  const [reportProgress, setReportProgress] = useState(50);
  const [reportSummary, setReportSummary] = useState('');
  const [taskBreakdownList, setTaskBreakdownList] = useState([]); // [{ employeeId, taskName, completion, blockers, comments }]
  const [submittingReport, setSubmittingReport] = useState(false);

  const [objectionTarget, setObjectionTarget] = useState(null); // objection object
  const [objectionDecision, setObjectionDecision] = useState('Reassign'); // 'Reassign' | 'Reject'
  const [objectionComments, setObjectionComments] = useState('');
  const [objectionNewTaskId, setObjectionNewTaskId] = useState('');
  const [resolvingObjection, setResolvingObjection] = useState(false);

  const [proposalTarget, setProposalTarget] = useState(null); // proposal object
  const [proposalDecision, setProposalDecision] = useState('Approve'); // 'Approve' | 'Reject'
  const [proposalComments, setProposalComments] = useState('');
  const [proposalDeadline, setProposalDeadline] = useState('');
  const [reviewingProposal, setReviewingProposal] = useState(false);

  const loadTLData = async () => {
    try {
      setLoading(true);
      const [empRes, taskRes, reportRes, objRes, propRes, userRes] = await Promise.all([
        api.get('/employees').catch(() => ({ data: [] })),
        api.get('/tasks').catch(() => ({ data: [] })),
        api.get('/progress-reports').catch(() => ({ data: [] })),
        api.get('/objections').catch(() => ({ data: [] })),
        api.get('/proposals').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] }))
      ]);

      setEmployees(empRes.data || []);
      setTasks(taskRes.data || []);
      setProgressReports(reportRes.data || []);
      setObjections(objRes.data || []);
      setProposals(propRes.data || []);
      setTeamLeads(userRes.data?.filter(u => u.role?.name === 'Team Lead' && u._id !== currentUser._id) || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Team Lead workspace details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    loadTLData();
  }, [isDemoMode]);

  // Sync Kanban tasks state locally for drag-drop
  const [localTasks, setLocalTasks] = useState([]);
  useEffect(() => {
    if (tasks.length > 0) {
      setLocalTasks(tasks.map(t => ({
        id: t._id,
        title: t.title,
        assignee: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned',
        priority: t.priority || 'Medium',
        deadline: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A',
        status: t.status === 'Pending' ? 'To Do' : t.status === 'Completed' ? 'Completed' : t.status
      })));
    }
  }, [tasks]);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    if (isDemoMode) {
      setLocalTasks(localTasks.map(t => t.id === taskId ? { ...t, status: targetColumn } : t));
      toast.success(`Task moved to ${targetColumn}`);
      return;
    }

    try {
      const statusMap = {
        'To Do': 'Pending',
        'In Progress': 'In Progress',
        'Review': 'Review',
        'Completed': 'Completed',
        'Blocked': 'Blocked'
      };
      const apiStatus = statusMap[targetColumn] || 'Pending';
      await api.put(`/tasks/${taskId}`, { status: apiStatus });
      toast.success(`Task status updated to ${targetColumn}`);
      await loadTLData();
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  const handleAssignTaskSubmit = async (e) => {
    e.preventDefault();
    const title = e.target.taskName.value;
    const assigneeId = e.target.assignTo.value;
    const priority = e.target.priority.value;
    const deadline = e.target.deadline.value;

    if (!title || !assigneeId) return;

    try {
      await api.post('/tasks', {
        title,
        description: 'Assigned task from Sprint Command Board',
        assignedTo: assigneeId,
        dueDate: deadline,
        priority
      });
      toast.success('Task created and assigned successfully');
      setShowAssignModal(false);
      await loadTLData();
    } catch (err) {
      toast.error('Failed to assign task');
    }
  };

  const handleReassignTeamSubmit = async (e) => {
    e.preventDefault();
    if (!reassignTargetLead) {
      toast.warning('Please select a Team Lead');
      return;
    }

    try {
      setReassigningMember(true);
      await api.put('/teams/reassign', {
        targetLeadId: reassignTargetLead,
        employeeId: reassignTargetMember._id
      });
      toast.success('Team member reassigned successfully');
      setReassignTargetMember(null);
      setReassignTargetLead('');
      await loadTLData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reassign team member');
    } finally {
      setReassigningMember(false);
    }
  };

  const handlePrepareReportForm = (pr) => {
    setSubmitReportTarget(pr);
    setReportProgress(50);
    setReportSummary('');
    // Initialize task breakdown from team members
    const teamMembers = employees.filter(e => String(e.reportingManager) === String(currentUser.employeeRef));
    setTaskBreakdownList(teamMembers.map(m => ({
      employeeId: m._id,
      name: `${m.firstName} ${m.lastName}`,
      taskName: '',
      completion: 50,
      blockers: '',
      comments: ''
    })));
  };

  const handleUpdateBreakdown = (index, field, value) => {
    const updated = [...taskBreakdownList];
    updated[index][field] = value;
    setTaskBreakdownList(updated);
  };

  const handleSubmitProgressReport = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReport(true);
      await api.put(`/progress-reports/${submitReportTarget._id}/submit`, {
        overallProgress: reportProgress,
        teamSummary: reportSummary,
        taskBreakdown: taskBreakdownList.map(tb => ({
          employeeId: tb.employeeId,
          taskName: tb.taskName || 'General Tasks',
          completion: tb.completion,
          blockers: tb.blockers || 'None',
          comments: tb.comments || 'Good performance'
        }))
      });
      toast.success('Progress report submitted to HR successfully');
      setSubmitReportTarget(null);
      setReportSummary('');
      await loadTLData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit progress report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleResolveObjectionSubmit = async (e) => {
    e.preventDefault();
    try {
      setResolvingObjection(true);
      await api.put(`/objections/${objectionTarget._id}/resolve`, {
        decision: objectionDecision,
        comments: objectionComments,
        newTaskId: objectionDecision === 'Reassign' ? objectionNewTaskId || undefined : undefined
      });
      toast.success(`Objection resolved with decision: ${objectionDecision}`);
      setObjectionTarget(null);
      setObjectionComments('');
      setObjectionNewTaskId('');
      await loadTLData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resolve objection');
    } finally {
      setResolvingObjection(false);
    }
  };

  const handleReviewProposalSubmit = async (e) => {
    e.preventDefault();
    try {
      setReviewingProposal(true);
      await api.put(`/proposals/${proposalTarget._id}/review`, {
        decision: proposalDecision,
        comments: proposalComments,
        deadline: proposalDecision === 'Approve' ? proposalDeadline || undefined : undefined
      });
      toast.success(`Proposal reviewed: ${proposalDecision}`);
      setProposalTarget(null);
      setProposalComments('');
      setProposalDeadline('');
      await loadTLData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to review project proposal');
    } finally {
      setReviewingProposal(false);
    }
  };

  // Filters
  const myTeam = employees.filter(e => String(e.reportingManager) === String(currentUser.employeeRef));
  const pendingReportRequests = progressReports.filter(pr => pr.status === 'Requested');
  const columns = ['To Do', 'In Progress', 'Review', 'Completed', 'Blocked'];

  // Calculations
  const overallProgress = isDemoMode ? 62 : (() => {
    if (myTeam.length === 0) return 0;
    // Calculate simple overall team progress or mock
    return 65;
  })();

  return (
    <div className="space-y-6 text-slate-800 dark:text-white">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-indigo-500/20 pb-1 gap-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent border-0 ${activeTab === 'overview' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-250'}`}
        >
          Sprint Board & Team
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent border-0 relative ${activeTab === 'reports' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-250'}`}
        >
          Progress Reports
          {pendingReportRequests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-650 text-white animate-bounce">
              {pendingReportRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('objections')}
          className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent border-0 relative ${activeTab === 'objections' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-250'}`}
        >
          Work Objections
          {objections.filter(o => o.status === 'Open').length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-650 text-white animate-bounce">
              {objections.filter(o => o.status === 'Open').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('proposals')}
          className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent border-0 relative ${activeTab === 'proposals' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-250'}`}
        >
          Employee Proposals
          {proposals.filter(p => p.status === 'Submitted').length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-650 text-white animate-bounce">
              {proposals.filter(p => p.status === 'Submitted').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Sprint Overview Command Card */}
          <div className="glass-card border border-cyan-500/25 rounded-3xl p-6 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[9px] uppercase tracking-widest font-black">Project Leader Command</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Active Sprint Command Center</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Sprint milestone deadlines: <span className="text-cyan-650 dark:text-cyan-300 font-bold">2026-08-15</span> · Status: <span className="text-cyan-650 dark:text-cyan-300 uppercase tracking-widest font-bold font-mono">In Progress</span></p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { value: overallProgress },
                          { value: 100 - overallProgress }
                        ]}
                        innerRadius={26}
                        outerRadius={34}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                      >
                        <Cell fill="#06B6D4" />
                        <Cell fill="#cbd5e1" className="dark:fill-slate-800" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-900 dark:text-white">{overallProgress}%</div>
                </div>
                <div className="text-xs">
                  <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">Auto-Calculated Status</p>
                  <p className="text-sm font-black mt-0.5 text-slate-850 dark:text-white font-sans">Sprint Execution Status</p>
                </div>
              </div>
            </div>
          </div>

          {/* Development Team cards */}
          <div className="glass-card border border-cyan-500/20 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest">My Development Team</h3>
              <button onClick={() => setShowAssignModal(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all border-0 cursor-pointer"><Plus className="h-3.5 w-3.5" /> Assign Task</button>
            </div>
            {myTeam.length === 0 ? (
              <p className="text-xs text-slate-455 italic py-4 text-center">No reporting team members found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {myTeam.map((t, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/45 rounded-xl space-y-3 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-2.5 font-sans">
                      <div className="h-8 w-8 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/35 rounded-lg flex items-center justify-center font-bold text-xs">
                        {t.firstName[0]}{t.lastName[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{t.firstName} {t.lastName}</h4>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400">{t.designation || 'Developer'}</p>
                      </div>
                    </div>
                    
                    <div className="text-[10px] space-y-1.5 border-t border-slate-200 dark:border-[#1F2647] pt-2 font-sans">
                      <div className="flex justify-between font-mono">
                        <span>Current Department:</span>
                        <span className="font-bold text-slate-400">{t.department}</span>
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setReassignTargetMember(t)}
                          className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 rounded-lg cursor-pointer"
                        >
                          Reassign Team
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kanban Board */}
          <div className="glass-card border border-cyan-500/20 rounded-2xl p-5 overflow-hidden">
            <h3 className="text-xs font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest mb-4">Sprint Kanban Board</h3>
            <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-2">
              {columns.map((col, idx) => {
                const colTasks = localTasks.filter(t => t.status === col);
                return (
                  <div
                    key={idx}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col)}
                    className="flex-1 min-w-[200px] bg-slate-50/50 dark:bg-[#0E1325]/45 border border-slate-200 dark:border-[#1F2647] rounded-xl p-3 flex flex-col space-y-3 min-h-[300px]"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#1F2647] pb-2 font-sans">
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-355 uppercase tracking-wider">{col}</span>
                      <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 text-[8px] font-black rounded-md">{colTasks.length}</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto">
                      {colTasks.map((t) => (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, t.id)}
                          className="p-3 bg-white dark:bg-[#151A30]/80 border border-slate-200 dark:border-[#1F2647] hover:border-cyan-500/50 rounded-xl space-y-2 cursor-grab active:cursor-grabbing shadow-sm transition-all"
                        >
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white font-sans">{t.title}</h4>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 font-sans">
                            <span>{t.assignee}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                              t.priority === 'High' ? 'bg-red-500/10 text-red-655' :
                              t.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-655' :
                              'bg-green-500/10 text-green-655'
                            }`}>{t.priority}</span>
                          </div>
                        </div>
                      ))}
                      {colTasks.length === 0 && (
                        <div className="flex-1 border border-dashed border-slate-200 dark:border-[#1F2647]/50 rounded-xl flex items-center justify-center py-8 text-[10px] text-slate-500 italic font-sans">Drag cards here</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeTab === 'reports' && (
        <div className="glass-card border border-cyan-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest mb-4">
            Progress Reports Sent by HR
          </h3>
          {progressReports.length === 0 ? (
            <p className="text-xs text-slate-455 italic py-8 text-center font-sans">No requested progress reports found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                    <th className="pb-3 font-semibold">Request Period</th>
                    <th className="pb-3 font-semibold">Requested By</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Overall Progress</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200">
                  {progressReports.map((pr, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                      <td className="py-3 font-mono font-bold">
                        {new Date(pr.dateRange.from).toLocaleDateString()} - {new Date(pr.dateRange.to).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-sans text-slate-400">
                        {pr.requestedBy?.username || 'HR Admin'}
                      </td>
                      <td className="py-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          pr.status === 'Requested' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20 animate-pulse' :
                          pr.status === 'Submitted' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}>
                          {pr.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono">
                        {pr.status !== 'Requested' ? `${pr.teamLeadReport?.overallProgress}%` : 'N/A'}
                      </td>
                      <td className="py-3 text-right font-sans">
                        {pr.status === 'Requested' && (
                          <button
                            onClick={() => handlePrepareReportForm(pr)}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg cursor-pointer border-0"
                          >
                            Submit Progress
                          </button>
                        )}
                        {pr.status === 'Reviewed' && (
                          <span className="text-[10px] text-emerald-500 font-bold">HR Review Complete</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'objections' && (
        <div className="glass-card border border-cyan-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest mb-4">
            Team Work Objections Inbox
          </h3>
          {objections.length === 0 ? (
            <p className="text-xs text-slate-455 italic py-8 text-center font-sans">No work objections raised by your team.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                    <th className="pb-3 font-semibold">Employee</th>
                    <th className="pb-3 font-semibold">Task Title</th>
                    <th className="pb-3 font-semibold">Reason for Objection</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-202">
                  {objections.map((obj, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30 font-sans">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        {obj.employeeId?.firstName} {obj.employeeId?.lastName}
                      </td>
                      <td className="py-3 font-bold text-cyan-600 dark:text-cyan-400">
                        {obj.taskId?.title || 'General Task'}
                      </td>
                      <td className="py-3 text-slate-350 italic">"{obj.reason}"</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          obj.status === 'Open' ? 'bg-red-500/10 text-red-650 border border-red-500/20 animate-pulse' :
                          obj.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-655 border border-emerald-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-550/20'
                        }`}>
                          {obj.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {obj.status === 'Open' && (
                          <button
                            onClick={() => {
                              setObjectionTarget(obj);
                              setObjectionComments('');
                            }}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg cursor-pointer border-0"
                          >
                            Resolve Objection
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'proposals' && (
        <div className="glass-card border border-cyan-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest mb-4">
            Employee Project Proposals
          </h3>
          {proposals.length === 0 ? (
            <p className="text-xs text-slate-455 italic py-8 text-center font-sans">No project proposals submitted by your team.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                    <th className="pb-3 font-semibold">Employee</th>
                    <th className="pb-3 font-semibold">Project Title</th>
                    <th className="pb-3 font-semibold">Est. Duration</th>
                    <th className="pb-3 font-semibold">Tech Stack</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-202">
                  {proposals.map((prop, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30 font-sans">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        {prop.employeeId?.firstName} {prop.employeeId?.lastName}
                      </td>
                      <td className="py-3 font-bold text-cyan-600 dark:text-cyan-400">
                        {prop.title}
                      </td>
                      <td className="py-3 font-mono">{prop.estimatedDuration}</td>
                      <td className="py-3 font-mono font-bold text-slate-400">{prop.techStack?.join(', ')}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          prop.status === 'Submitted' ? 'bg-orange-500/10 text-orange-655 border border-orange-500/20 animate-pulse' :
                          prop.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-650 border border-emerald-500/20' :
                          'bg-red-500/10 text-red-650 border border-red-500/20'
                        }`}>
                          {prop.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {prop.status === 'Submitted' && (
                          <button
                            onClick={() => {
                              setProposalTarget(prop);
                              setProposalComments('');
                            }}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg cursor-pointer border-0"
                          >
                            Review Proposal
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Team Lead Modals */}
      <AnimatePresence>
        {/* Reassign Team Lead Modal */}
        {reassignTargetMember && (
          <LocalModal title={`Reassign ${reassignTargetMember.firstName} to Another Team Lead`} onClose={() => setReassignTargetMember(null)}>
            <form onSubmit={handleReassignTeamSubmit} className="space-y-4 font-sans">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-455 uppercase">Select Target Team Lead</label>
                <select
                  value={reassignTargetLead}
                  onChange={(e) => setReassignTargetLead(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Choose Team Lead --</option>
                  {teamLeads.map(lead => (
                    <option key={lead._id} value={lead._id}>{lead.username} ({lead.email})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-550 leading-normal">
                  Note: The employee will be transferred from your supervision reporting line to the selected lead.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setReassignTargetMember(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-405 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reassigningMember}
                  className="px-4 py-2 text-xs font-bold uppercase text-white btn-premium-gradient rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {reassigningMember ? 'Reassigning...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {/* Submit Progress Report Modal */}
        {submitReportTarget && (
          <LocalModal title="Submit Progress Report to HR" onClose={() => setSubmitReportTarget(null)}>
            <form onSubmit={handleSubmitProgressReport} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 text-xs font-sans">
              <div className="space-y-1">
                <label className="block text-slate-450 font-bold uppercase text-[10px]">Overall Team Sprint Progress ({reportProgress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={reportProgress}
                  onChange={(e) => setReportProgress(Number(e.target.value))}
                  className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-455 font-bold uppercase text-[10px]">Overall Team Summary</label>
                <textarea
                  required
                  rows={3}
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Provide overall sprint achievements and general status..."
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-[11px] text-cyan-500 uppercase tracking-wider border-b border-slate-805 pb-1">Employee Tasks Breakdown</h4>
                {taskBreakdownList.map((tb, idx) => (
                  <div key={idx} className="p-3 bg-black/30 border border-slate-850 rounded-xl space-y-2">
                    <div className="font-bold text-slate-200">{tb.name}</div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] uppercase text-slate-500">Active Task Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. API Integration"
                          value={tb.taskName}
                          onChange={(e) => handleUpdateBreakdown(idx, 'taskName', e.target.value)}
                          className="w-full text-[10px] p-1.5 bg-slate-955 border border-slate-800 rounded text-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase text-slate-500">Completion ({tb.completion}%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={tb.completion}
                          onChange={(e) => handleUpdateBreakdown(idx, 'completion', Number(e.target.value))}
                          className="w-full text-[10px] p-1.5 bg-slate-955 border border-slate-800 rounded text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] uppercase text-slate-500">Blockers</label>
                        <input
                          type="text"
                          placeholder="e.g. None"
                          value={tb.blockers}
                          onChange={(e) => handleUpdateBreakdown(idx, 'blockers', e.target.value)}
                          className="w-full text-[10px] p-1.5 bg-slate-955 border border-slate-800 rounded text-slate-350"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase text-slate-500">Comments</label>
                        <input
                          type="text"
                          placeholder="General comment"
                          value={tb.comments}
                          onChange={(e) => handleUpdateBreakdown(idx, 'comments', e.target.value)}
                          className="w-full text-[10px] p-1.5 bg-slate-955 border border-slate-800 rounded text-slate-350"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setSubmitReportTarget(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-4 py-2 text-xs font-bold uppercase text-white btn-premium-gradient rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Progress Report'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {/* Resolve Objection Modal */}
        {objectionTarget && (
          <LocalModal title="Resolve Work Objection" onClose={() => setObjectionTarget(null)}>
            <form onSubmit={handleResolveObjectionSubmit} className="space-y-4 text-xs font-sans">
              <div className="bg-black/30 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-[10px] text-slate-400 leading-normal">
                  Employee <strong>{objectionTarget.employeeId?.firstName} {objectionTarget.employeeId?.lastName}</strong> objected to task <strong>{objectionTarget.taskId?.title}</strong>:
                </div>
                <div className="text-[11px] text-slate-200 italic font-mono bg-slate-955 p-2.5 rounded border border-slate-900">
                  "{objectionTarget.reason}"
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-455 font-bold uppercase text-[10px]">Decision</label>
                <select
                  value={objectionDecision}
                  onChange={(e) => setObjectionDecision(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Reassign">Approve (Reassign original task)</option>
                  <option value="Reject">Reject (Enforce original task)</option>
                </select>
              </div>

              {objectionDecision === 'Reassign' && (
                <div className="space-y-2">
                  <label className="block text-slate-455 font-bold uppercase text-[10px]">Assign to Another Task (Optional)</label>
                  <select
                    value={objectionNewTaskId}
                    onChange={(e) => setObjectionNewTaskId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose New Task --</option>
                    {localTasks.filter(t => t.id !== objectionTarget.taskId?._id && t.status !== 'Completed').map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-slate-455 font-bold uppercase text-[10px]">Comments</label>
                <textarea
                  required
                  rows={2}
                  value={objectionComments}
                  onChange={(e) => setObjectionComments(e.target.value)}
                  placeholder="Provide resolution comments..."
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setObjectionTarget(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolvingObjection}
                  className="px-4 py-2 text-xs font-bold uppercase text-white btn-premium-gradient rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {resolvingObjection ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {/* Review Project Proposal Modal */}
        {proposalTarget && (
          <LocalModal title="Review Employee Project Proposal" onClose={() => setProposalTarget(null)}>
            <form onSubmit={handleReviewProposalSubmit} className="space-y-4 text-xs font-sans">
              <div className="bg-black/30 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="font-bold text-slate-200">"{proposalTarget.title}"</div>
                <div className="text-[10px] text-slate-400 leading-normal">{proposalTarget.description}</div>
                <div className="text-[9px] text-slate-500">Tech Stack: {proposalTarget.techStack?.join(', ')}</div>
                <div className="text-[9px] text-slate-500 font-mono">Expected Outcome: {proposalTarget.expectedOutcome}</div>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-455 font-bold uppercase text-[10px]">Decision</label>
                <select
                  value={proposalDecision}
                  onChange={(e) => setProposalDecision(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Approve">Approve (Creates active task dynamically)</option>
                  <option value="Reject">Reject (Provide comments)</option>
                </select>
              </div>

              {proposalDecision === 'Approve' && (
                <div className="space-y-2">
                  <label className="block text-slate-455 font-bold uppercase text-[10px]">Task Completion Deadline</label>
                  <input
                    type="date"
                    value={proposalDeadline}
                    onChange={(e) => setProposalDeadline(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-slate-455 font-bold uppercase text-[10px]">Feedback Comments</label>
                <textarea
                  required
                  rows={2}
                  value={proposalComments}
                  onChange={(e) => setProposalComments(e.target.value)}
                  placeholder="Provide feedback comments..."
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setProposalTarget(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewingProposal}
                  className="px-4 py-2 text-xs font-bold uppercase text-white btn-premium-gradient rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {reviewingProposal ? 'Reviewing...' : 'Save Review'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {/* Assign Task Modal */}
        {showAssignModal && (
          <LocalModal title="Assign New Sprint Task" onClose={() => setShowAssignModal(false)}>
            <form onSubmit={handleAssignTaskSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Task Title</label>
                <input name="taskName" required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. Design Dashboard Prototypes" />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Assign To Member</label>
                <select name="assignTo" required className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500">
                  {myTeam.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Task Priority</label>
                  <select name="priority" className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Task Deadline</label>
                  <input name="deadline" required type="date" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 rounded-xl transition-all border-0 cursor-pointer">Submit Task Assignment</button>
              </div>
            </form>
          </LocalModal>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. FINANCE EXECUTIVE DASHBOARD (Gold/Yellow)
// ═══════════════════════════════════════════════════════════════════════════════
const FinanceDashboard = () => {
  const { isDemoMode } = useContext(DemoContext);
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [holdTarget, setHoldTarget] = useState(null); // payroll/employee object
  const [holdReason, setHoldReason] = useState('');
  const [submittingHold, setSubmittingHold] = useState(false);
  const [showCreatePayrollModal, setShowCreatePayrollModal] = useState(false);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enterprise/payrolls');
      setPayrolls(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve corporate payroll register');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Error fetching employees for payroll:', err);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    loadPayrollData();
    fetchEmployees();
  }, [isDemoMode]);

  const handleCreatePayrollSubmit = async (e) => {
    e.preventDefault();
    const employee = e.target.payrollEmployee.value;
    const baseSalary = Number(e.target.payrollBaseSalary.value);
    const allowances = Number(e.target.payrollAllowances.value || 0);
    const deductions = Number(e.target.payrollDeductions.value || 0);
    const month = Number(e.target.payrollMonth.value);
    const year = Number(e.target.payrollYear.value);

    if (!employee || !baseSalary || !month || !year) {
      toast.warning('Please fill in all required fields');
      return;
    }

    try {
      setGeneratingPayroll(true);
      await api.post('/enterprise/payrolls', {
        employee,
        baseSalary,
        allowances,
        deductions,
        month,
        year
      });
      toast.success('Payroll generated successfully!');
      setShowCreatePayrollModal(false);
      await loadPayrollData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate payroll record');
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const handleHoldSalarySubmit = async (e) => {
    e.preventDefault();
    if (!holdReason) {
      toast.warning('Please enter hold reason');
      return;
    }

    try {
      setSubmittingHold(true);
      const employeeId = holdTarget.employee?._id || holdTarget.employee;
      await api.post(`/payroll/${employeeId}/hold`, { reason: holdReason });
      toast.success('Salary put on hold successfully');
      setHoldTarget(null);
      setHoldReason('');
      await loadPayrollData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place salary hold');
    } finally {
      setSubmittingHold(false);
    }
  };

  const handleReleaseSalary = async (payroll) => {
    try {
      const employeeId = payroll.employee?._id || payroll.employee;
      await api.post(`/payroll/${employeeId}/release`);
      toast.success('Salary hold released successfully');
      await loadPayrollData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to release salary hold');
    }
  };

  // Calculations
  const metrics = useMemo(() => {
    let gross = 0;
    let deductions = 0;
    let net = 0;
    let holdsCount = 0;

    payrolls.forEach(p => {
      const basic = Number(p.baseSalary || 0);
      const allowances = Number(p.allowances || 0);
      const deducts = Number(p.deductions || 0);
      
      gross += basic + allowances;
      deductions += deducts;
      
      if (p.salaryHold?.isOnHold) {
        holdsCount++;
      } else {
        net += p.netSalary || ((basic || 0) + (allowances || 0) - (deducts || 0));
      }
    });

    return { gross, deductions, net, holdsCount };
  }, [payrolls]);

  const taxAllocation = useMemo(() => {
    const departmentPayrolls = {};
    payrolls.forEach(p => {
      const dept = p.employee?.department || 'Unassigned';
      const net = (p.baseSalary || 0) + (p.allowances || 0) - (p.deductions || 0);
      departmentPayrolls[dept] = (departmentPayrolls[dept] || 0) + net;
    });
    const mapped = Object.entries(departmentPayrolls).map(([name, amount]) => ({ name, amount }));
    if (mapped.length === 0) {
      return [
        { name: 'Engineering', amount: 480000 },
        { name: 'Operations', amount: 280000 },
        { name: 'IT Support', amount: 150000 },
        { name: 'Finance Unit', amount: 120000 },
        { name: 'Human Res.', amount: 98000 }
      ];
    }
    return mapped;
  }, [payrolls]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-x-2">
        <Activity className="h-6 w-6 text-yellow-500 animate-spin" />
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading payroll ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      {/* Top statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Monthly Gross Payout" value={`₹${metrics.gross.toLocaleString()}`} colorAccent="yellow" icon={DollarSign} desc="Basic + HRA + Allowances" />
        <StatCard label="Total Deductions" value={`₹${metrics.deductions.toLocaleString()}`} colorAccent="yellow" icon={ShieldAlert} desc="Provident Fund / TDS" />
        <StatCard label="Net Disbursed" value={`₹${metrics.net.toLocaleString()}`} colorAccent="yellow" icon={CheckCircle} desc="Transferred to Staff Accounts" />
        <StatCard label="Active Salary Holds" value={`${metrics.holdsCount} Employees`} colorAccent="yellow" icon={Clock} desc="Salary Temporarily Locked" />
      </div>

      {/* Pipeline step tracker */}
      <div className="glass-card border border-yellow-500/20 rounded-2xl p-5">
        <h3 className="text-xs font-black text-yellow-755 dark:text-yellow-400 uppercase tracking-widest mb-4">Payroll Pipeline Execution</h3>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold font-mono">
          <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            <span>Attendance Locked</span>
          </div>
          <div className="h-0.5 w-8 bg-emerald-550/40 hidden md:block" />
          
          <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            <span>Calculation Done</span>
          </div>
          <div className="h-0.5 w-8 bg-emerald-550/40 hidden md:block" />

          <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            <span>Manager Review</span>
          </div>
          <div className="h-0.5 w-8 bg-yellow-500/40 hidden md:block" />

          <div className="flex items-center gap-2 p-2 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-750 dark:text-yellow-400 animate-pulse">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Finance Approval</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-700 hidden md:block" />

          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-[#1A203E] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
            <Lock className="h-4 w-4" />
            <span>Payslips Generated</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salary table */}
        <div className="lg:col-span-2 glass-card border border-yellow-500/20 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-yellow-755 dark:text-yellow-400 uppercase tracking-widest">Corporate Salary Register</h3>
            <button onClick={() => setShowCreatePayrollModal(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all border-0 cursor-pointer"><Plus className="h-3.5 w-3.5" /> Generate Payroll</button>
          </div>
          <div className="overflow-x-auto font-sans">
            <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                  <th className="pb-3 font-semibold">Staff Name</th>
                  <th className="pb-3 font-semibold">Period</th>
                  <th className="pb-3 font-semibold">Basic (₹)</th>
                  <th className="pb-3 font-semibold">Allowances (₹)</th>
                  <th className="pb-3 font-semibold">Deductions (₹)</th>
                  <th className="pb-3 font-semibold">Net Salary (₹)</th>
                  <th className="pb-3 font-semibold">Hold Status</th>
                  <th className="pb-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200 font-mono">
                {payrolls.map((p, i) => {
                  const empName = p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : 'Unassigned Employee';
                  const isOnHold = p.salaryHold?.isOnHold;

                  return (
                    <tr key={i} className={`hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30 ${isOnHold ? 'bg-red-500/5 border-l-2 border-red-500' : ''}`}>
                      <td className="py-2.5 font-bold font-sans text-left">
                        <div>{empName}</div>
                        <div className="text-[9px] text-slate-500">{p.employee?.department || 'Staff'}</div>
                      </td>
                      <td className="py-2.5 text-left">{p.month}/{p.year}</td>
                      <td className="py-2.5 text-left">₹{(p.baseSalary || 0).toLocaleString()}</td>
                      <td className="py-2.5 text-left">₹{(p.allowances || 0).toLocaleString()}</td>
                      <td className="py-2.5 text-left text-red-650 dark:text-red-400">-₹{(p.deductions || 0).toLocaleString()}</td>
                      <td className="py-2.5 text-left text-emerald-600 dark:text-emerald-400 font-bold">₹{(p.netSalary || 0).toLocaleString()}</td>
                      <td className="py-2.5 text-left font-sans">
                        {isOnHold ? (
                          <span className="text-[10px] text-red-500 font-bold" title={p.salaryHold.holdReason}>
                            Hold: "{p.salaryHold.holdReason}"
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500 font-mono">Active Release</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-sans">
                        {isOnHold ? (
                          <button
                            onClick={() => handleReleaseSalary(p)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2.5 py-1 rounded cursor-pointer border-0"
                          >
                            Release Salary
                          </button>
                        ) : (
                          <button
                            onClick={() => setHoldTarget(p)}
                            className="bg-red-500 hover:bg-red-655 text-white font-bold text-[9px] px-2.5 py-1 rounded cursor-pointer border-0"
                          >
                            Hold Salary
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tax allocation chart */}
        <div className="glass-card border border-yellow-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-yellow-755 dark:text-yellow-400 uppercase tracking-widest mb-4">Departmental Tax Allocations</h3>
          <div className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taxAllocation} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={9} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#151A30', borderColor: '#EAB308' }} />
                <Bar dataKey="amount" fill="#EAB308" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* NEW FINANCE MODALS */}
      <AnimatePresence>
        {holdTarget && (
          <LocalModal title={`Place Salary Hold`} onClose={() => setHoldTarget(null)}>
            <form onSubmit={handleHoldSalarySubmit} className="space-y-4 font-sans text-xs">
              <div className="bg-black/30 border border-slate-800 rounded-xl p-4 space-y-1">
                <div>Employee Name: <strong>{holdTarget.employee?.firstName} {holdTarget.employee?.lastName}</strong></div>
                <div>Payroll Month/Year: <strong>{holdTarget.month}/{holdTarget.year}</strong></div>
                <div>Net Salary amount: <strong>₹{(holdTarget.netSalary || 0).toLocaleString()}</strong></div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase">Reason for Salary Hold</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Compliance audit, pending timesheet confirmation, onboarding review..."
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setHoldTarget(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHold}
                  className="px-4 py-2 text-xs font-bold uppercase text-white bg-red-655 hover:bg-red-700 rounded-xl disabled:opacity-50 border-0 cursor-pointer"
                >
                  {submittingHold ? 'Confirming...' : 'Place Hold'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}

        {showCreatePayrollModal && (
          <LocalModal title="Generate New Payroll Entry" onClose={() => setShowCreatePayrollModal(false)}>
            <form onSubmit={handleCreatePayrollSubmit} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Select Employee</label>
                <select name="payrollEmployee" required className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                     <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} ({emp.employeeId} - {emp.department})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Month (1 - 12)</label>
                  <select name="payrollMonth" defaultValue={new Date().getMonth() + 1} className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Year</label>
                  <input name="payrollYear" required type="number" defaultValue={2026} className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Base Salary (₹)</label>
                  <input name="payrollBaseSalary" required type="number" placeholder="50000" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Allowances (₹)</label>
                  <input name="payrollAllowances" type="number" defaultValue="0" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Deductions (₹)</label>
                  <input name="payrollDeductions" type="number" defaultValue="0" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={generatingPayroll} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2.5 rounded-xl transition-all border-0 cursor-pointer disabled:opacity-50">
                  {generatingPayroll ? 'Generating...' : 'Generate Payroll Ledger'}
                </button>
              </div>
            </form>
          </LocalModal>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. IT ADMINISTRATOR DASHBOARD (Red)
// ═══════════════════════════════════════════════════════════════════════════════
const ITAdminDashboard = () => {
  const [tickets, setTickets] = useState([
    { id: 'TCK_881', employee: 'Sarah Jenkins', cat: 'Hardware', priority: 'High', status: 'Open', age: '2 hours' },
    { id: 'TCK_882', employee: 'Arjun Mehta', cat: 'Software', priority: 'Medium', status: 'In Progress', age: '4 hours' },
    { id: 'TCK_883', employee: 'Sneha Gupta', cat: 'Access', priority: 'High', status: 'Open', age: '1 day' },
    { id: 'TCK_884', employee: 'Marcus Vane', cat: 'Network', priority: 'Low', status: 'Resolved', age: '2 days' },
    { id: 'TCK_885', employee: 'Karan Patel', cat: 'Software', priority: 'High', status: 'Open', age: '5 mins' }
  ]);

  const [resets] = useState([
    { name: 'Riya Sharma', time: '12:00:15', status: 'Pending' },
    { name: 'Karan Patel', time: '11:45:00', status: 'Completed' },
    { name: 'Sneha Gupta', time: '10:12:30', status: 'Completed' },
    { name: 'Elena Rostova', time: '09:00:00', status: 'Completed' }
  ]);

  const handleActionClick = (action) => {
    toast.info(`Triggered IT Admin action: ${action}`);
  };

  const handleCloseTicket = (id) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status: 'Closed' } : t));
    toast.success(`Ticket ${id} closed successfully!`);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-white">
      {/* Grid KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total IT Assets" value="156 Assets" colorAccent="red" icon={Cpu} desc="Assigned: 134 | Unassigned: 22" />
        <StatCard label="Pending resets" value="1 Request" colorAccent="red" icon={Lock} desc="Requires manual override keys" />
        <StatCard label="Hardware Under Repair" value="8 Systems" colorAccent="red" icon={Settings} desc="Estimated checkout: 3 days" />
        <StatCard label="System Vitals" value="CPU: 4% | 4.6G" colorAccent="red" icon={Activity} desc="Ping: 16ms · Stable" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets queue */}
        <div className="lg:col-span-2 glass-card border border-red-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest mb-4">Support Ticket Queue</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-left">
                  <th className="pb-3 font-semibold">Ticket ID</th>
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Age</th>
                  <th className="pb-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200">
                {tickets.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                    <td className="py-2.5 font-bold text-red-655 dark:text-red-400">{t.id}</td>
                    <td className="py-2.5 text-slate-900 dark:text-white font-bold">{t.employee}</td>
                    <td className="py-2.5 font-semibold text-slate-500 dark:text-slate-400">{t.cat}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.2 rounded font-black text-[8px] tracking-widest uppercase ${t.priority === 'High' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-400'}`}>{t.priority}</span>
                    </td>
                    <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1A203E] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 text-[9px] uppercase font-black font-mono">{t.status}</span></td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-450">{t.age}</td>
                    <td className="py-2.5">
                      {t.status !== 'Closed' && t.status !== 'Resolved' ? (
                        <button onClick={() => handleCloseTicket(t.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold text-[8px] px-2 py-0.5 rounded transition-all">Close</button>
                      ) : <span className="text-slate-450 dark:text-slate-550 italic">Closed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side actions and resets */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="glass-card border border-red-500/20 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest">IT Operations</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleActionClick('Reset password flow initiated')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-red-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-red-650/10 border border-slate-200 dark:border-[#1F2647] hover:border-red-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between"><span>Reset Staff Password</span><ArrowRight className="h-4 w-4 text-red-655 dark:text-red-400" /></button>
              <button onClick={() => handleActionClick('Onboarding new Asset...')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-red-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-red-650/10 border border-slate-200 dark:border-[#1F2647] hover:border-red-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between"><span>Add New Asset Entry</span><ArrowRight className="h-4 w-4 text-red-655 dark:text-red-400" /></button>
              <button onClick={() => handleActionClick('Viewing system security logs...')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-red-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-red-655/10 border border-slate-200 dark:border-[#1F2647] hover:border-red-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between"><span>Close Support Ticket</span><ArrowRight className="h-4 w-4 text-red-655 dark:text-red-400" /></button>
            </div>
          </div>

          {/* Password resets timeline */}
          <div className="glass-card border border-red-500/20 rounded-2xl p-5">
            <h3 className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest mb-4">Password Resets Timeline</h3>
            <div className="space-y-3 font-mono text-[10px] text-slate-600 dark:text-slate-350">
              {resets.map((r, i) => (
                <div key={i} className="p-2 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/10 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-red-750 dark:text-red-400 font-bold">&gt; {r.name}</span>
                    <p className="text-slate-500 dark:text-slate-450 mt-0.5">Reset Requested at {r.time}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${r.status === 'Pending' ? 'bg-red-500/10 text-red-655 dark:text-red-400 border border-red-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 8. AUDITOR DASHBOARD (Gray/Silver)
// ═══════════════════════════════════════════════════════════════════════════════
const AuditorDashboard = () => {
  // Hardcoded audit logs
  const rawAuditLogs = [
    { time: '2026-07-05 12:04:12', user: 'super_admin', role: 'Super Admin', action: 'ROTATE_JWT_SECRET', module: 'Security', ip: '192.168.1.1' },
    { time: '2026-07-05 11:45:00', user: 'finance_lead', role: 'Finance', action: 'DISPATCH_PAYROLL', module: 'Finance', ip: '192.168.1.4' },
    { time: '2026-07-05 11:32:18', user: 'hr_manager', role: 'HR Manager', action: 'CREATE_EMPLOYEE', module: 'HR Directory', ip: '192.168.1.25' },
    { time: '2026-07-05 11:15:45', user: 'it_admin', role: 'IT Administrator', action: 'ASSIGN_ASSET', module: 'Assets', ip: '192.168.1.12' },
    { time: '2026-07-05 10:55:12', user: 'org_admin', role: 'Organization Admin', action: 'CREATE_DEPARTMENT', module: 'Org Setup', ip: '192.168.1.2' },
    { time: '2026-07-05 10:44:00', user: 'super_admin', role: 'Super Admin', action: 'SUSPEND_ORG', module: 'Org Setup', ip: '192.168.1.1' },
    { time: '2026-07-05 10:12:30', user: 'auditor_01', role: 'Auditor', action: 'EXPORT_COMPLIANCE', module: 'Audits', ip: '192.168.1.99' },
    { time: '2026-07-05 09:55:00', user: 'system_core', role: 'System Engine', action: 'DB_REPLICATION', module: 'Database', ip: '127.0.0.1' },
    { time: '2026-07-05 09:30:15', user: 'it_admin', role: 'IT Administrator', action: 'RESET_PASSWORD', module: 'Security', ip: '192.168.1.12' },
    { time: '2026-07-05 09:00:00', user: 'system_core', role: 'System Engine', action: 'DAILY_HEALTH_CHECK', module: 'Database', ip: '127.0.0.1' },
    { time: '2026-07-04 18:30:00', user: 'finance_lead', role: 'Finance', action: 'LOCK_ATTENDANCE', module: 'Finance', ip: '192.168.1.4' },
    { time: '2026-07-04 17:15:22', user: 'hr_manager', role: 'HR Manager', action: 'POST_JOB_VACANCY', module: 'HR Directory', ip: '192.168.1.25' },
    { time: '2026-07-04 16:45:10', user: 'manager_arjun', role: 'Manager', action: 'APPROVE_LEAVE_REQ', module: 'HR Directory', ip: '192.168.1.55' },
    { time: '2026-07-04 15:30:00', user: 'sneha_lead', role: 'Team Lead', action: 'CREATE_SPRINT_TASK', module: 'Projects', ip: '192.168.1.72' },
    { time: '2026-07-04 14:12:45', user: 'riya_sharma', role: 'Employee', action: 'CLOCK_IN_ENTRY', module: 'Attendance', ip: '192.168.1.101' },
    { time: '2026-07-04 13:00:00', user: 'riya_sharma', role: 'Employee', action: 'UPDATE_TASK_PROGRESS', module: 'Projects', ip: '192.168.1.101' },
    { time: '2026-07-04 11:22:15', user: 'karan_patel', role: 'Employee', action: 'SUBMIT_LEAVE_REQ', module: 'HR Directory', ip: '192.168.1.102' },
    { time: '2026-07-04 10:15:30', user: 'super_admin', role: 'Super Admin', action: 'UPDATE_SYSTEM_POLICY', module: 'Security', ip: '192.168.1.1' },
    { time: '2026-07-04 09:12:00', user: 'it_admin', role: 'IT Administrator', action: 'ALLOCATE_ASSET_IP', module: 'Assets', ip: '192.168.1.12' },
    { time: '2026-07-04 08:30:00', user: 'system_core', role: 'System Engine', action: 'ROTATE_API_KEYS', module: 'Security', ip: '127.0.0.1' }
  ];

  // React state filters
  const [filterModule, setFilterModule] = useState('All');
  const [filterRole, setFilterRole] = useState('All');

  const filteredLogs = rawAuditLogs.filter(l => {
    const matchMod = filterModule === 'All' || l.module === filterModule;
    const matchRole = filterRole === 'All' || l.role === filterRole;
    return matchMod && matchRole;
  });

  const modules = ['All', 'Security', 'Finance', 'HR Directory', 'Assets', 'Org Setup', 'Audits', 'Database', 'Projects', 'Attendance'];
  const roles = ['All', 'Super Admin', 'Finance', 'HR Manager', 'IT Administrator', 'Organization Admin', 'Auditor', 'System Engine', 'Manager', 'Team Lead', 'Employee'];

  const handleExport = () => {
    toast.success('Export initiated! Preparing CSV and PDF bundles.');
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-white">
      {/* Alert alert cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-red-655 dark:text-red-400 uppercase tracking-widest text-[10px]">Failed Logins</p>
            <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">3 Incidents</p>
          </div>
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest text-[10px]">Permission Violations</p>
            <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">1 Incident</p>
          </div>
          <span className="text-2xl">🚫</span>
        </div>
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-[10px]">Suspicious Activity</p>
            <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">0 Incidents</p>
          </div>
          <span className="text-2xl">🛡️</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass-card border border-slate-200 dark:border-slate-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="space-y-1">
            <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Filter by Module</label>
            <select
              value={filterModule}
              onChange={e => setFilterModule(e.target.value)}
              className="bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl py-1.5 px-3 focus:outline-none focus:border-slate-550 text-slate-800 dark:text-white font-mono"
            >
              {modules.map((m, i) => <option key={i}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Filter by Role</label>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl py-1.5 px-3 focus:outline-none focus:border-slate-550 text-slate-800 dark:text-white font-mono"
            >
              {roles.map((r, i) => <option key={i}>{r}</option>)}
            </select>
          </div>
        </div>
        
        <button
          onClick={handleExport}
          className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-700 border border-slate-350 dark:border-slate-500/30 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-xl text-xs transition-all hover:scale-[1.02]"
        >
          Export Logs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table audit log */}
        <div className="lg:col-span-2 glass-card border border-slate-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Immutable Audit Log Register</h3>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="min-w-full text-[10px] divide-y divide-slate-100 dark:divide-[#1F2647]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Action Event</th>
                  <th className="pb-3 font-semibold">Module</th>
                  <th className="pb-3 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200 font-mono">
                {filteredLogs.map((l, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                    <td className="py-2.5 text-slate-550 dark:text-slate-400 font-bold">{l.time}</td>
                    <td className="py-2.5 text-slate-900 dark:text-white font-bold">{l.user}</td>
                    <td className="py-2.5"><span className="px-1.5 py-0.2 bg-slate-200/50 dark:bg-slate-500/10 text-slate-650 dark:text-slate-350 border border-slate-300 dark:border-slate-500/20 rounded uppercase text-[8px] font-black">{l.role}</span></td>
                    <td className="py-2.5 text-slate-900 dark:text-slate-200 font-bold font-mono">{l.action}</td>
                    <td className="py-2.5 text-cyan-650 dark:text-cyan-400">{l.module}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-450">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance coverage */}
        <div className="glass-card border border-slate-500/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Compliance Audit Status</h3>
          
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex justify-between font-bold text-emerald-800 dark:text-emerald-400"><span>Security Settings</span><span>100% COVERAGE</span></div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Audit trail active, secrets rotation verified.</p>
            </div>
            <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex justify-between font-bold text-emerald-800 dark:text-emerald-400"><span>Finance Modules</span><span>100% COVERAGE</span></div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Audited payroll workflows matching tax limits.</p>
            </div>
            <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex justify-between font-bold text-amber-800 dark:text-amber-400"><span>Projects & Taskboards</span><span>GAPS DETECTED</span></div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Task deletions do not log full state metadata.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC DASHBOARD ROUTER SWITCH
// ═══════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { isDemoMode, demoRole } = useContext(DemoContext);

  const activeRoleName = isDemoMode ? demoRole : (user?.role?.name || user?.role || '');

  switch (activeRoleName) {
    case 'Super Admin':         return <SuperAdminDashboard />;
    case 'Organization Admin':  return <OrgAdminDashboard />;
    case 'HR Manager':          return <HRManagerDashboard />;
    case 'IT Administrator':    return <ITAdminDashboard />;
    case 'Auditor':             return <AuditorDashboard />;
    case 'Finance Executive':   return <FinanceDashboard />;
    case 'Finance':             return <FinanceDashboard />;
    case 'Team Lead':           return <TeamLeadDashboard />;
    case 'Manager':             return <ManagerDashboard />;
    case 'Department Manager':  return <ManagerDashboard />;
    default:
      return (
        <div className="flex h-64 items-center justify-center text-red-500 text-xl font-bold">
          Unauthorized Access Dashboard
        </div>
      );
  }
};

export default AdminDashboard;
