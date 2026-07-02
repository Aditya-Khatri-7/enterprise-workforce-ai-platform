import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

// ─── Shared Stat Card ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center border border-gray-100">
    <div className={`flex-shrink-0 ${color} rounded-lg p-3 text-white`}>
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
      </svg>
    </div>
    <div className="ml-5">
      <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

// ─── Shared Badge ──────────────────────────────────────────────────────────────
const Badge = ({ value, map }) => {
  const cfg = map[value] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${cfg}`}>{value}</span>
  );
};

const STATUS_COLORS = {
  Active: 'bg-green-100 text-green-800',
  Suspended: 'bg-yellow-100 text-yellow-800',
  Deleted: 'bg-red-100 text-red-800',
};

const LEAVE_STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

const TICKET_STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Resolved: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-700',
};

// ─── Modal Wrapper ─────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="fixed inset-0 bg-gray-800 bg-opacity-60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  </div>
);

// ─── Form Input ────────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
);

const Select = ({ children, ...props }) => (
  <select {...props} className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
    {children}
  </select>
);

const Btn = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all focus:outline-none disabled:opacity-60';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
  };
  return <button {...props} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPER ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const SuperAdminDashboard = () => {
  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('orgs');
  const [loading, setLoading] = useState(true);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const [orgForm, setOrgForm] = useState({ name: '', email: '', phone: '', address: '', subscriptionPlan: 'Basic' });
  const [adminForm, setAdminForm] = useState({ organizationId: '', name: '', email: '', phone: '', password: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgsRes, usersRes, logsRes] = await Promise.all([
        api.get('/organizations'),
        api.get('/users'),
        api.get('/audit'),
      ]);
      setOrgs(orgsRes.data);
      setUsers(usersRes.data);
      setLogs(logsRes.data.slice(0, 8));
    } catch { toast.error('Failed to load dashboard data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const admins = users.filter(u => u.role?.name === 'Organization Admin');

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      await api.post('/organizations', orgForm);
      toast.success('Organization created!');
      setOrgForm({ name: '', email: '', phone: '', address: '', subscriptionPlan: 'Basic' });
      setShowOrgModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create org'); }
  };

  const handleAssignAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/organizations/assign-admin', adminForm);
      toast.success('Organization Admin created and assigned!');
      setAdminForm({ organizationId: '', name: '', email: '', phone: '', password: '' });
      setShowAdminModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to assign admin'); }
  };

  const handleStatusChange = async (orgId, status) => {
    try {
      await api.put(`/organizations/${orgId}/status`, { status });
      toast.success(`Organization ${status.toLowerCase()}`);
      load();
    } catch (err) { toast.error('Failed to update status'); }
  };

  if (loading) return <LoadingSpinner />;

  const planCount = (p) => orgs.filter(o => o.subscriptionPlan === p).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Organizations" value={orgs.length} color="bg-blue-500" icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
        <StatCard label="Active Orgs" value={orgs.filter(o => o.status === 'Active').length} color="bg-green-500" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Org Administrators" value={admins.length} color="bg-purple-500" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        <StatCard label="Audit Events" value={logs.length + '+'} color="bg-indigo-500" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-3 gap-4">
        {['Basic', 'Premium', 'Enterprise'].map(p => (
          <div key={p} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-400 text-center">
            <p className="text-sm text-gray-500 font-medium">{p} Plan</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{planCount(p)}</p>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 border-b border-gray-200">
        {[['orgs', 'Organizations'], ['admins', 'Administrators'], ['logs', 'Recent Audit Logs']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`py-3 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Organizations Tab */}
      {tab === 'orgs' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900">All Tenants</h4>
            <Btn variant="primary" onClick={() => setShowOrgModal(true)}>+ Create Organization</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['ID', 'Name', 'Email', 'Phone', 'Plan', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orgs.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No organizations yet. Create one above.</td></tr>
                ) : orgs.map(org => (
                  <tr key={org._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{org.organizationId}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{org.name}</td>
                    <td className="px-4 py-3 text-gray-600">{org.email}</td>
                    <td className="px-4 py-3 text-gray-600">{org.phone}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700">{org.subscriptionPlan}</span>
                    </td>
                    <td className="px-4 py-3"><Badge value={org.status} map={STATUS_COLORS} /></td>
                    <td className="px-4 py-3 space-x-1">
                      <Btn variant="secondary" className="py-1 px-2 text-xs" onClick={() => { setSelectedOrg(org); setAdminForm(f => ({ ...f, organizationId: org._id })); setShowAdminModal(true); }}>
                        Assign Admin
                      </Btn>
                      {org.status !== 'Active' && (
                        <Btn variant="success" className="py-1 px-2 text-xs" onClick={() => handleStatusChange(org._id, 'Active')}>Activate</Btn>
                      )}
                      {org.status === 'Active' && (
                        <Btn variant="danger" className="py-1 px-2 text-xs" onClick={() => handleStatusChange(org._id, 'Suspended')}>Suspend</Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admins Tab */}
      {tab === 'admins' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900">Organization Administrators</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Username', 'Email', 'Organization', 'Account Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No administrators assigned yet.</td></tr>
                ) : admins.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{a.username}</td>
                    <td className="px-4 py-3 text-gray-600">{a.email}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{a.organization?.name || '—'}</td>
                    <td className="px-4 py-3"><Badge value={a.isActive ? 'Active' : 'Inactive'} map={{ Active: 'bg-green-100 text-green-800', Inactive: 'bg-red-100 text-red-800' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {tab === 'logs' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900">Recent System Events</h4>
            <Link to="/admin/audit" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View all logs →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {logs.map(log => (
              <div key={log._id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
                <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{log.action}</span>
                <span className="text-sm text-gray-700 flex-1">{log.userRef?.username || 'System'}</span>
                <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Org Modal */}
      {showOrgModal && (
        <Modal title="Create New Organization" onClose={() => setShowOrgModal(false)}>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <Field label="Organization Name"><Input required value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Acme Corporation" /></Field>
            <Field label="Organization Email"><Input required type="email" value={orgForm.email} onChange={e => setOrgForm(f => ({ ...f, email: e.target.value }))} placeholder="e.g. info@acme.com" /></Field>
            <Field label="Phone Number"><Input required value={orgForm.phone} onChange={e => setOrgForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. +91 9876543210" /></Field>
            <Field label="Address"><Input value={orgForm.address} onChange={e => setOrgForm(f => ({ ...f, address: e.target.value }))} placeholder="Head office address" /></Field>
            <Field label="Subscription Plan">
              <Select value={orgForm.subscriptionPlan} onChange={e => setOrgForm(f => ({ ...f, subscriptionPlan: e.target.value }))}>
                <option>Basic</option><option>Premium</option><option>Enterprise</option>
              </Select>
            </Field>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="primary" className="flex-1">Create Organization</Btn>
              <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowOrgModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Admin Modal */}
      {showAdminModal && (
        <Modal title={`Assign Admin${selectedOrg ? ` — ${selectedOrg.name}` : ''}`} onClose={() => setShowAdminModal(false)}>
          <form onSubmit={handleAssignAdmin} className="space-y-4">
            <Field label="Select Organization">
              <Select required value={adminForm.organizationId} onChange={e => setAdminForm(f => ({ ...f, organizationId: e.target.value }))}>
                <option value="">Choose organization...</option>
                {orgs.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
              </Select>
            </Field>
            <Field label="Admin Full Name"><Input required value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John Smith" /></Field>
            <Field label="Email Address"><Input required type="email" value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))} placeholder="e.g. john@acme.com" /></Field>
            <Field label="Phone Number"><Input value={adminForm.phone} onChange={e => setAdminForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" /></Field>
            <Field label="Temporary Password"><Input required type="password" value={adminForm.password} onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" /></Field>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="success" className="flex-1">Assign Administrator</Btn>
              <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowAdminModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIZATION ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const OrgAdminDashboard = () => {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', roleName: 'HR Manager', firstName: '', lastName: '', department: '', designation: '' });
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes, leavesRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments'),
        api.get('/leaves'),
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setLeaves(leavesRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', userForm);
      toast.success('User created successfully!');
      setShowUserModal(false);
      setUserForm({ username: '', email: '', password: '', roleName: 'HR Manager', firstName: '', lastName: '', department: '', designation: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create user'); }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', deptForm);
      toast.success('Department created!');
      setShowDeptModal(false);
      setDeptForm({ name: '', code: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create department'); }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await api.put(`/leaves/${leaveId}/status`, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      load();
    } catch { toast.error('Failed to update leave'); }
  };

  const handleToggleUser = async (userId, isActive) => {
    try {
      await api.put(`/users/${userId}/status`, { isActive: !isActive });
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'}`);
      load();
    } catch { toast.error('Failed to toggle user status'); }
  };

  if (loading) return <LoadingSpinner />;

  const hrManagers = users.filter(u => u.role?.name === 'HR Manager');
  const itAdmins = users.filter(u => u.role?.name === 'IT Administrator');
  const employees = users.filter(u => u.role?.name === 'Employee');
  const pendingLeaves = leaves.filter(l => l.status === 'Pending');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="HR Managers" value={hrManagers.length} color="bg-blue-500" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        <StatCard label="IT Administrators" value={itAdmins.length} color="bg-purple-500" icon="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
        <StatCard label="Employees" value={employees.length} color="bg-green-500" icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
        <StatCard label="Pending Leaves" value={pendingLeaves.length} color="bg-yellow-500" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[['users', 'Manage Users'], ['depts', 'Departments'], ['leaves', `Leave Requests${pendingLeaves.length > 0 ? ` (${pendingLeaves.length})` : ''}`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`py-3 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900">Organization Users</h4>
            <Btn variant="primary" onClick={() => setShowUserModal(true)}>+ Add User</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Name', 'Email', 'Role', 'Department', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0
                  ? <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No users in your organization yet.</td></tr>
                  : users.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{u.username}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3"><span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{u.role?.name}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.employeeRef?.department || '—'}</td>
                      <td className="px-4 py-3"><Badge value={u.isActive ? 'Active' : 'Inactive'} map={{ Active: 'bg-green-100 text-green-800', Inactive: 'bg-red-100 text-red-800' }} /></td>
                      <td className="px-4 py-3">
                        <Btn variant={u.isActive ? 'danger' : 'success'} className="py-1 px-2 text-xs" onClick={() => handleToggleUser(u._id, u.isActive)}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Btn>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {tab === 'depts' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900">Departments</h4>
            <Btn variant="primary" onClick={() => setShowDeptModal(true)}>+ Add Department</Btn>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
            {departments.length === 0
              ? <p className="col-span-3 text-center text-gray-400 py-8">No departments yet. Create one to get started.</p>
              : departments.map(d => (
                <div key={d._id} className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-gray-50 hover:bg-white transition-colors">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">{d.code.slice(0, 2)}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{d.code}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Leaves Tab */}
      {tab === 'leaves' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b"><h4 className="font-bold text-gray-900">Leave Requests</h4></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Employee', 'Type', 'Dates', 'Reason', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaves.length === 0
                  ? <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No leave requests found.</td></tr>
                  : leaves.map(l => (
                    <tr key={l._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{l.employee?.firstName} {l.employee?.lastName}<div className="text-xs text-gray-400">{l.employee?.employeeId}</div></td>
                      <td className="px-4 py-3"><span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{l.type}</span></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={l.reason}>{l.reason}</td>
                      <td className="px-4 py-3"><Badge value={l.status} map={LEAVE_STATUS_COLORS} /></td>
                      <td className="px-4 py-3 space-x-1">
                        {l.status === 'Pending' && (<>
                          <Btn variant="success" className="py-1 px-2 text-xs" onClick={() => handleLeaveAction(l._id, 'Approved')}>Approve</Btn>
                          <Btn variant="danger" className="py-1 px-2 text-xs" onClick={() => handleLeaveAction(l._id, 'Rejected')}>Reject</Btn>
                        </>)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && (
        <Modal title="Add Organization User" onClose={() => setShowUserModal(false)}>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name"><Input required value={userForm.firstName} onChange={e => setUserForm(f => ({ ...f, firstName: e.target.value }))} /></Field>
              <Field label="Last Name"><Input required value={userForm.lastName} onChange={e => setUserForm(f => ({ ...f, lastName: e.target.value }))} /></Field>
              <Field label="Username"><Input required value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} /></Field>
              <Field label="Email"><Input required type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} /></Field>
              <Field label="Password"><Input required type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 chars" /></Field>
              <Field label="Role">
                <Select value={userForm.roleName} onChange={e => setUserForm(f => ({ ...f, roleName: e.target.value }))}>
                  <option>HR Manager</option>
                  <option>IT Administrator</option>
                </Select>
              </Field>
              <Field label="Department"><Input value={userForm.department} onChange={e => setUserForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. HR" /></Field>
              <Field label="Designation"><Input value={userForm.designation} onChange={e => setUserForm(f => ({ ...f, designation: e.target.value }))} placeholder="e.g. HR Manager" /></Field>
            </div>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="primary" className="flex-1">Create User</Btn>
              <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowUserModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Dept Modal */}
      {showDeptModal && (
        <Modal title="Create Department" onClose={() => setShowDeptModal(false)}>
          <form onSubmit={handleCreateDept} className="space-y-4">
            <Field label="Department Name"><Input required value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Engineering" /></Field>
            <Field label="Department Code"><Input required value={deptForm.code} onChange={e => setDeptForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. ENG" /></Field>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="primary" className="flex-1">Create</Btn>
              <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowDeptModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HR MANAGER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const HRManagerDashboard = () => {
  const [tab, setTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    department: '', designation: '', roleName: 'Employee', joiningDate: ''
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, leaveRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments'),
        api.get('/leaves'),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setLeaves(leaveRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/employees', form);
      toast.success('Employee created!');
      alert(`Credentials:\nUsername: ${res.data.credentials?.username}\nTemp Password: ${res.data.credentials?.temporaryPassword}`);
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', department: '', designation: '', roleName: 'Employee', joiningDate: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create employee'); }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this employee?')) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee archived');
      load();
    } catch { toast.error('Failed to archive'); }
  };

  if (loading) return <LoadingSpinner />;

  const active = employees.filter(e => e.status === 'Active').length;
  const onLeave = employees.filter(e => e.status === 'On Leave').length;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={employees.length} color="bg-blue-500" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        <StatCard label="Active" value={active} color="bg-green-500" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="On Leave" value={onLeave} color="bg-yellow-500" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Departments" value={departments.length} color="bg-purple-500" icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[['employees', 'Employee Records'], ['leaves', `Leave Tracker${pendingLeaves > 0 ? ` (${pendingLeaves} pending)` : ''}`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`py-3 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'employees' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900">Employee Directory</h4>
            <Btn variant="primary" onClick={() => setShowModal(true)}>+ Add Employee</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Employee', 'ID', 'Department', 'Designation', 'Joining Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.length === 0
                  ? <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No employees found.</td></tr>
                  : employees.map(emp => (
                    <tr key={emp._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
                          <div>
                            <p className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-gray-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.employeeId}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.designation}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(emp.joiningDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><Badge value={emp.status} map={{ Active: 'bg-green-100 text-green-800', 'On Leave': 'bg-yellow-100 text-yellow-800', Archived: 'bg-red-100 text-red-800' }} /></td>
                      <td className="px-4 py-3">
                        <Btn variant="danger" className="py-1 px-2 text-xs" onClick={() => handleArchive(emp._id)}>Archive</Btn>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'leaves' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b"><h4 className="font-bold text-gray-900">Leave Requests Overview</h4></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Employee', 'Type', 'Duration', 'Reason', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaves.length === 0
                  ? <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No leave requests found.</td></tr>
                  : leaves.map(l => (
                    <tr key={l._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{l.employee?.firstName} {l.employee?.lastName}</td>
                      <td className="px-4 py-3"><span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{l.type}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{l.reason}</td>
                      <td className="px-4 py-3"><Badge value={l.status} map={LEAVE_STATUS_COLORS} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title="Onboard New Employee" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreateEmployee} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name"><Input required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></Field>
              <Field label="Last Name"><Input required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></Field>
              <Field label="Email"><Input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
              <Field label="Department">
                {departments.length > 0 ? (
                  <Select required value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                  </Select>
                ) : (
                  <Input required value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="No departments yet, type manually" />
                )}
              </Field>
              <Field label="Designation"><Input required value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} /></Field>
              <Field label="Joining Date"><Input required type="date" value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} /></Field>
              <Field label="Role">
                <Select value={form.roleName} onChange={e => setForm(f => ({ ...f, roleName: e.target.value }))}>
                  <option value="Employee">Employee</option>
                </Select>
              </Field>
            </div>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="primary" className="flex-1">Create Employee Account</Btn>
              <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// IT ADMINISTRATOR DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const ITAdminDashboard = () => {
  const [tab, setTab] = useState('accounts');
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pwdModal, setPwdModal] = useState(null);
  const [newPwd, setNewPwd] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, ticketsRes, logsRes] = await Promise.all([
        api.get('/users'),
        api.get('/support'),
        api.get('/audit'),
      ]);
      setUsers(usersRes.data);
      setTickets(ticketsRes.data);
      setAuditLogs(logsRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUnlock = async (userId) => {
    try {
      await api.post(`/users/${userId}/unlock`);
      toast.success('Account unlocked successfully!');
      load();
    } catch { toast.error('Failed to unlock account'); }
  };

  const handleResetPwd = async (e) => {
    e.preventDefault();
    if (newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    try {
      await api.post(`/users/${pwdModal._id}/reset-password`, { newPassword: newPwd });
      toast.success(`Password reset for ${pwdModal.username}`);
      setPwdModal(null); setNewPwd('');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to reset password'); }
  };

  const handleTicketStatus = async (id, status) => {
    try {
      await api.put(`/support/${id}/status`, { status });
      toast.success(`Ticket updated to ${status}`);
      load();
    } catch { toast.error('Failed to update ticket'); }
  };

  if (loading) return <LoadingSpinner />;

  const locked = users.filter(u => u.isLocked);
  const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Locked Accounts" value={locked.length} color="bg-red-500" icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        <StatCard label="Total Users" value={users.length} color="bg-blue-500" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        <StatCard label="Open Tickets" value={openTickets.length} color="bg-yellow-500" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <StatCard label="Audit Events" value={auditLogs.length} color="bg-indigo-500" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[['accounts', 'Account Security'], ['tickets', `Support Tickets${openTickets.length > 0 ? ` (${openTickets.length})` : ''}`], ['logs', 'Access Logs']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`py-3 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Accounts Tab */}
      {tab === 'accounts' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b gap-4">
            <h4 className="font-bold text-gray-900">User Account Management</h4>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="border border-gray-300 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Username', 'Email', 'Role', 'Lock Status', 'Account', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0
                  ? <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No matching users found.</td></tr>
                  : filtered.map(u => (
                    <tr key={u._id} className={`hover:bg-gray-50 ${u.isLocked ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 font-semibold text-gray-900">{u.username}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3"><span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{u.role?.name}</span></td>
                      <td className="px-4 py-3"><Badge value={u.isLocked ? '🔒 Locked' : '🔓 Unlocked'} map={{ '🔒 Locked': 'bg-red-100 text-red-800', '🔓 Unlocked': 'bg-green-100 text-green-800' }} /></td>
                      <td className="px-4 py-3"><Badge value={u.isActive ? 'Active' : 'Inactive'} map={{ Active: 'bg-green-100 text-green-800', Inactive: 'bg-gray-100 text-gray-600' }} /></td>
                      <td className="px-4 py-3 flex gap-1 flex-wrap">
                        {u.isLocked && <Btn variant="success" className="py-1 px-2 text-xs" onClick={() => handleUnlock(u._id)}>Unlock</Btn>}
                        <Btn variant="secondary" className="py-1 px-2 text-xs" onClick={() => { setPwdModal(u); setNewPwd(''); }}>Reset Pwd</Btn>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Support Tickets Tab */}
      {tab === 'tickets' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b"><h4 className="font-bold text-gray-900">IT Support Tickets</h4></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Employee', 'Category', 'Subject', 'Status', 'Submitted', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.length === 0
                  ? <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No support tickets.</td></tr>
                  : tickets.map(t => (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{t.employee?.firstName} {t.employee?.lastName}<div className="text-xs text-gray-400">{t.employee?.email}</div></td>
                      <td className="px-4 py-3"><span className="text-xs font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded">{t.category}</span></td>
                      <td className="px-4 py-3 text-gray-700">{t.subject}</td>
                      <td className="px-4 py-3"><Badge value={t.status} map={TICKET_STATUS_COLORS} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {t.status === 'Open' && <Btn variant="secondary" className="py-1 px-2 text-xs" onClick={() => handleTicketStatus(t._id, 'In Progress')}>Start</Btn>}
                        {t.status === 'In Progress' && <Btn variant="success" className="py-1 px-2 text-xs" onClick={() => handleTicketStatus(t._id, 'Resolved')}>Resolve</Btn>}
                        {t.status === 'Resolved' && <Btn variant="secondary" className="py-1 px-2 text-xs" onClick={() => handleTicketStatus(t._id, 'Closed')}>Close</Btn>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {tab === 'logs' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900">Organization Access Log</h4>
            <Link to="/admin/audit" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Full log →</Link>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {auditLogs.length === 0
              ? <p className="px-6 py-8 text-center text-gray-400">No audit events.</p>
              : auditLogs.map(log => (
                <div key={log._id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded whitespace-nowrap">{log.action}</span>
                  <span className="text-sm text-gray-700 flex-1">{log.userRef?.username || 'System'} {log.details ? `— ${log.details}` : ''}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {pwdModal && (
        <Modal title={`Reset Password — ${pwdModal.username}`} onClose={() => setPwdModal(null)}>
          <form onSubmit={handleResetPwd} className="space-y-4">
            <p className="text-sm text-gray-500">This will force the user to change their password on next login.</p>
            <Field label="New Password">
              <Input required type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min 8 characters" />
            </Field>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="primary" className="flex-1">Update Password</Btn>
              <Btn type="button" variant="secondary" className="flex-1" onClick={() => setPwdModal(null)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─── Loading Spinner ───────────────────────────────────────────────────────────
const LoadingSpinner = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600 font-medium">Loading workspace data...</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT: DYNAMIC DASHBOARD ROUTER
// ═══════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  switch (user?.role) {
    case 'Super Admin':         return <SuperAdminDashboard />;
    case 'Organization Admin':  return <OrgAdminDashboard />;
    case 'HR Manager':          return <HRManagerDashboard />;
    case 'IT Administrator':    return <ITAdminDashboard />;
    default:
      return (
        <div className="flex h-64 items-center justify-center text-red-500 text-xl font-bold">
          Unauthorized Role Dashboard
        </div>
      );
  }
};

export default AdminDashboard;
