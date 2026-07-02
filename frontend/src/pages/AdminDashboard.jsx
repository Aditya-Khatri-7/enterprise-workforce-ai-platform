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
  const { user: superUser } = useContext(AuthContext);
  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('orgs');
  const [loading, setLoading] = useState(true);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const [orgSearch, setOrgSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  const [orgSort, setOrgSort] = useState({ key: '', direction: '' });
  const [adminSort, setAdminSort] = useState({ key: '', direction: '' });

  const [orgForm, setOrgForm] = useState({ name: '', email: '', address: '', subscriptionPlan: 'Basic' });
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
      setOrgForm({ name: '', email: '', address: '', subscriptionPlan: 'Basic' });
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

  const handleDeleteOrg = async (orgId, orgName) => {
    if (window.confirm(`Are you sure you want to permanently delete the organization "${orgName}"? This will delete all associated administrators, employees, departments, and other records under it.`)) {
      try {
        await api.delete(`/organizations/${orgId}`);
        toast.success(`Organization "${orgName}" deleted successfully`);
        load();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to delete organization');
      }
    }
  };

  const handleToggleAdminStatus = async (adminId, isActive) => {
    const admin = users.find(u => u._id === adminId);
    if (!isActive && admin && admin.organization?.status === 'Suspended') {
      toast.error('Cannot activate an administrator account belonging to a suspended organization.');
      return;
    }
    try {
      await api.put(`/users/${adminId}/status`, { isActive: !isActive });
      toast.success(`Admin account ${!isActive ? 'activated' : 'suspended'}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update admin status');
    }
  };

  const handleOrgSort = (key) => {
    setOrgSort(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleAdminSort = (key) => {
    setAdminSort(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  if (loading) return <LoadingSpinner />;

  const filteredOrgs = orgs.filter(org => {
    const term = orgSearch.toLowerCase();
    return (
      org.name?.toLowerCase().includes(term) ||
      org.email?.toLowerCase().includes(term) ||
      org.organizationId?.toLowerCase().includes(term) ||
      org.subscriptionPlan?.toLowerCase().includes(term) ||
      org.status?.toLowerCase().includes(term)
    );
  });

  const sortedOrgs = [...filteredOrgs].sort((a, b) => {
    if (!orgSort.key) return 0;
    const aVal = (a[orgSort.key] || '').toString().toLowerCase();
    const bVal = (b[orgSort.key] || '').toString().toLowerCase();
    if (aVal < bVal) return orgSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return orgSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredAdmins = admins.filter(admin => {
    const term = adminSearch.toLowerCase();
    const phone = admin.employeeRef?.mobile || '';
    return (
      admin.username?.toLowerCase().includes(term) ||
      admin.email?.toLowerCase().includes(term) ||
      phone.toLowerCase().includes(term) ||
      admin.organization?.name?.toLowerCase().includes(term) ||
      (admin.isActive ? 'active' : 'inactive').includes(term)
    );
  });

  const sortedAdmins = [...filteredAdmins].sort((a, b) => {
    if (!adminSort.key) return 0;
    let aVal = '';
    let bVal = '';

    if (adminSort.key === 'username') {
      aVal = a.username || '';
    } else if (adminSort.key === 'email') {
      aVal = a.email || '';
    } else if (adminSort.key === 'phone') {
      aVal = a.employeeRef?.mobile || '';
    } else if (adminSort.key === 'organization') {
      aVal = a.organization?.name || '';
    } else if (adminSort.key === 'status') {
      aVal = a.isActive ? 'active' : 'inactive';
    }

    aVal = aVal.toString().toLowerCase();

    if (adminSort.key === 'username') {
      bVal = b.username || '';
    } else if (adminSort.key === 'email') {
      bVal = b.email || '';
    } else if (adminSort.key === 'phone') {
      bVal = b.employeeRef?.mobile || '';
    } else if (adminSort.key === 'organization') {
      bVal = b.organization?.name || '';
    } else if (adminSort.key === 'status') {
      bVal = b.isActive ? 'active' : 'inactive';
    }

    bVal = bVal.toString().toLowerCase();

    if (aVal < bVal) return adminSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return adminSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const planCount = (p) => orgs.filter(o => o.subscriptionPlan === p).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold">Welcome, Super Admin 👋</h2>
        <p className="opacity-80 text-sm mt-1">Logged in as: {superUser?.username || 'Super Admin'} · System-wide control panel</p>
      </div>

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b gap-4">
            <h4 className="font-bold text-gray-900">All Tenants</h4>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search organizations..."
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                className="w-full sm:w-64 border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <Btn variant="primary" onClick={() => setShowOrgModal(true)} className="whitespace-nowrap">+ Create Organization</Btn>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th onClick={() => handleOrgSort('organizationId')} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    ID {orgSort.key === 'organizationId' ? (orgSort.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th onClick={() => handleOrgSort('name')} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Name {orgSort.key === 'name' ? (orgSort.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th onClick={() => handleOrgSort('email')} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Email {orgSort.key === 'email' ? (orgSort.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th onClick={() => handleOrgSort('subscriptionPlan')} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Plan {orgSort.key === 'subscriptionPlan' ? (orgSort.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th onClick={() => handleOrgSort('status')} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Status {orgSort.key === 'status' ? (orgSort.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold select-none">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedOrgs.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No organizations found.</td></tr>
                ) : sortedOrgs.map(org => (
                  <tr key={org._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{org.organizationId}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{org.name}</td>
                    <td className="px-4 py-3 text-gray-600">{org.email}</td>
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
                      <Btn variant="danger" className="py-1 px-2 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteOrg(org._id, org.name)}>Delete</Btn>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b gap-4">
            <h4 className="font-bold text-gray-900">Organization Administrators</h4>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search administrators..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th onClick={() => handleAdminSort('username')} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Username {adminSort.key === 'username' ? (adminSort.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th onClick={() => handleAdminSort('email')} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Email {adminSort.key === 'email' ? (adminSort.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th onClick={() => handleAdminSort('phone')} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Phone {adminSort.key === 'phone' ? (adminSort.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th onClick={() => handleAdminSort('organization')} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Organization {adminSort.key === 'organization' ? (adminSort.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th onClick={() => handleAdminSort('status')} className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Account Status {adminSort.key === 'status' ? (adminSort.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold select-none">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedAdmins.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No administrators found.</td></tr>
                ) : sortedAdmins.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{a.username}</td>
                    <td className="px-4 py-3 text-gray-600">{a.email}</td>
                    <td className="px-4 py-3 text-gray-600">{a.employeeRef?.mobile || '—'}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{a.organization?.name || '—'}</td>
                    <td className="px-4 py-3"><Badge value={a.isActive ? 'Active' : 'Inactive'} map={{ Active: 'bg-green-100 text-green-800', Inactive: 'bg-red-100 text-red-800' }} /></td>
                    <td className="px-4 py-3 space-x-1">
                      <Btn variant={a.isActive ? 'danger' : 'success'} className="py-1 px-2 text-xs" onClick={() => handleToggleAdminStatus(a._id, a.isActive)}>
                        {a.isActive ? 'Suspend' : 'Activate'}
                      </Btn>
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
            <Field label="Organization">
              <Input
                readOnly
                value={selectedOrg ? selectedOrg.name : ''}
                className="block w-full bg-gray-100 border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-500 cursor-not-allowed focus:outline-none"
              />
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
  const { user: orgAdminUser } = useContext(AuthContext);
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [workShifts, setWorkShifts] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Form States
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showDesigModal, setShowDesigModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);

  const [userForm, setUserForm] = useState({
    username: '', email: '', password: '', roleName: 'HR Manager',
    firstName: '', lastName: '', department: '', designation: ''
  });
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [desigForm, setDesigForm] = useState({ name: '', code: '' });
  const [policyForm, setPolicyForm] = useState({ title: '', category: 'General', content: '' });
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '09:00', endTime: '18:00' });

  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes, desigsRes, policiesRes, shiftsRes, leavesRes, tasksRes, correctionsRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments'),
        api.get('/designations').catch(() => ({ data: [] })),
        api.get('/policies').catch(() => ({ data: [] })),
        api.get('/workshifts').catch(() => ({ data: [] })),
        api.get('/leaves').catch(() => ({ data: [] })),
        api.get('/enterprise/tasks').catch(() => ({ data: [] })),
        api.get('/enterprise/corrections').catch(() => ({ data: [] })),
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setDesignations(desigsRes.data);
      setPolicies(policiesRes.data);
      setWorkShifts(shiftsRes.data);
      setLeaves(leavesRes.data);
      setTasks(tasksRes.data);
      setCorrections(correctionsRes.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', deptForm);
      toast.success('Department created!');
      setShowDeptModal(false);
      setDeptForm({ name: '', code: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create department');
    }
  };

  const handleCreateDesig = async (e) => {
    e.preventDefault();
    try {
      await api.post('/designations', desigForm);
      toast.success('Designation created!');
      setShowDesigModal(false);
      setDesigForm({ name: '', code: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create designation');
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    try {
      await api.post('/policies', policyForm);
      toast.success('Policy created!');
      setShowPolicyModal(false);
      setPolicyForm({ title: '', category: 'General', content: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create policy');
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      await api.post('/workshifts', shiftForm);
      toast.success('Work Shift created!');
      setShowShiftModal(false);
      setShiftForm({ name: '', startTime: '09:00', endTime: '18:00' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create work shift');
    }
  };

  const handleToggleUser = async (userId, isActive) => {
    try {
      await api.put(`/users/${userId}/status`, { isActive: !isActive });
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'}`);
      load();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Delete department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Department deleted');
      load();
    } catch {
      toast.error('Failed to delete department');
    }
  };

  const handleDeleteDesig = async (id) => {
    if (!window.confirm('Delete designation?')) return;
    try {
      await api.delete(`/designations/${id}`);
      toast.success('Designation deleted');
      load();
    } catch {
      toast.error('Failed to delete designation');
    }
  };

  const handleDeletePolicy = async (id) => {
    if (!window.confirm('Delete policy?')) return;
    try {
      await api.delete(`/policies/${id}`);
      toast.success('Policy deleted');
      load();
    } catch {
      toast.error('Failed to delete policy');
    }
  };

  const handleDeleteShift = async (id) => {
    if (!window.confirm('Delete shift?')) return;
    try {
      await api.delete(`/workshifts/${id}`);
      toast.success('Work shift deleted');
      load();
    } catch {
      toast.error('Failed to delete work shift');
    }
  };

  if (loading) return <LoadingSpinner />;

  // Computed Stats
  const totalEmployees = users.filter(u => ['Employee', 'Manager', 'Team Lead', 'HR Manager', 'Finance', 'IT Administrator'].includes(u.role?.name)).length;
  const activeProjects = tasks.filter(t => t.status === 'In Progress').length;
  const pendingApprovalsCount = leaves.filter(l => l.status === 'Pending').length + corrections.filter(c => c.status === 'Pending').length;

  // Exclude own account and other Organization Admin accounts from the Users table
  // (Org Admin should not see/deactivate their own account or other admins in the user management table)
  const filteredUsers = users.filter(u => {
    if (u.role?.name === 'Organization Admin') return false; // hide all org admin accounts
    const q = searchQuery.toLowerCase();
    return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold">Welcome, Organization Admin 👋</h2>
        <p className="opacity-80 text-sm mt-1">Logged in as: {orgAdminUser?.username || 'Admin'} · Organization Management Panel</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="Total Employees" value={totalEmployees} color="bg-blue-500" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        <StatCard label="Departments" value={departments.length} color="bg-purple-500" icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
        <StatCard label="Active Projects" value={activeProjects} color="bg-green-500" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <StatCard label="Open Positions" value="5" color="bg-teal-500" icon="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        <StatCard label="Pending Approvals" value={pendingApprovalsCount} color="bg-yellow-500" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200">
        {[
          ['overview', 'Overview'],
          ['users', 'Manage Users'],
          ['depts', 'Departments'],
          ['desigs', 'Designations'],
          ['shifts', 'Work Shifts'],
          ['policies', 'Policies']
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`py-3 px-4 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200 space-y-4">
            <h4 className="font-bold text-gray-900 text-lg">Organization Directory Overview</h4>
            <p className="text-sm text-gray-500">Quick count breakdown of all system accounts configured inside your organization:</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { r: 'HR Manager', l: 'HR Managers' },
                { r: 'Finance', l: 'Finance Executives' },
                { r: 'IT Administrator', l: 'IT Administrators' },
                { r: 'Manager', l: 'Department Managers' },
                { r: 'Team Lead', l: 'Team Leads' },
                { r: 'Employee', l: 'Employees' }
              ].map(item => (
                <div key={item.r} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-600">{item.l}</span>
                  <span className="text-lg font-bold text-gray-900">{users.filter(u => u.role?.name === item.r).length}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-200 space-y-4">
            <h4 className="font-bold text-gray-900 text-lg">Organization Details</h4>
            <div className="space-y-3 text-sm text-gray-700">
              <p><strong>Departments:</strong> {departments.map(d => `${d.name} (${d.code})`).join(', ') || 'None created yet'}</p>
              <p><strong>Designations:</strong> {designations.map(d => d.name).join(', ') || 'None created yet'}</p>
              <p><strong>Work Shifts:</strong> {workShifts.map(s => `${s.name} (${s.startTime}-${s.endTime})`).join(', ') || 'None created yet'}</p>
              <p><strong>Active Policies:</strong> {policies.length} uploaded policies</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <h4 className="font-bold text-gray-900 text-lg">User Accounts</h4>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search name, email, role..." className="border border-gray-300 rounded-lg py-1 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
            </div>
            <Btn variant="primary" onClick={() => setShowUserModal(true)}>+ Add User Account</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No user accounts found.</td></tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{u.username}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                          {u.role?.name === 'Finance' ? 'Finance Executive' : u.role?.name === 'Manager' ? 'Department Manager' : u.role?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={u.isActive ? 'Active' : 'Inactive'} map={{ Active: 'bg-green-100 text-green-800', Inactive: 'bg-red-100 text-red-800' }} />
                      </td>
                      <td className="px-4 py-3">
                        <Btn variant={u.isActive ? 'danger' : 'success'} className="py-1 px-2 text-xs font-semibold" onClick={() => handleToggleUser(u._id, u.isActive)}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Btn>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {tab === 'depts' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900 text-lg">Departments</h4>
            <Btn variant="primary" onClick={() => setShowDeptModal(true)}>+ Add Department</Btn>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
            {departments.length === 0 ? (
              <p className="col-span-3 text-center text-gray-400 py-8">No departments defined yet.</p>
            ) : (
              departments.map(d => (
                <div key={d._id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-gray-50 hover:bg-white transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">{d.code.slice(0, 2)}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{d.code}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteDept(d._id)} className="text-red-500 hover:text-red-700 text-lg">&times;</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Designations Tab */}
      {tab === 'desigs' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900 text-lg">Designations</h4>
            <Btn variant="primary" onClick={() => setShowDesigModal(true)}>+ Add Designation</Btn>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
            {designations.length === 0 ? (
              <p className="col-span-3 text-center text-gray-400 py-8">No designations defined yet.</p>
            ) : (
              designations.map(d => (
                <div key={d._id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-gray-50 hover:bg-white transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{d.code}</p>
                  </div>
                  <button onClick={() => handleDeleteDesig(d._id)} className="text-red-500 hover:text-red-700 text-lg">&times;</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Work Shifts Tab */}
      {tab === 'shifts' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900 text-lg">Work Shifts</h4>
            <Btn variant="primary" onClick={() => setShowShiftModal(true)}>+ Add Work Shift</Btn>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
            {workShifts.length === 0 ? (
              <p className="col-span-3 text-center text-gray-400 py-8">No shifts defined yet.</p>
            ) : (
              workShifts.map(s => (
                <div key={s._id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-gray-50 hover:bg-white transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.startTime} — {s.endTime}</p>
                  </div>
                  <button onClick={() => handleDeleteShift(s._id)} className="text-red-500 hover:text-red-700 text-lg">&times;</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Policies Tab */}
      {tab === 'policies' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900 text-lg">Organization Policies</h4>
            <Btn variant="primary" onClick={() => setShowPolicyModal(true)}>+ Add Policy Document</Btn>
          </div>
          <div className="p-6 space-y-4">
            {policies.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No active policies found.</p>
            ) : (
              policies.map(p => (
                <div key={p._id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 rounded">{p.category}</span>
                      <h5 className="font-bold text-gray-900">{p.title}</h5>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{p.content}</p>
                  </div>
                  <Btn variant="danger" className="py-1 px-2 text-xs font-semibold" onClick={() => handleDeletePolicy(p._id)}>Remove</Btn>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && (
        <Modal title="Create Organization User" onClose={() => setShowUserModal(false)}>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name"><Input required value={userForm.firstName} onChange={e => setUserForm(f => ({ ...f, firstName: e.target.value }))} /></Field>
              <Field label="Last Name"><Input required value={userForm.lastName} onChange={e => setUserForm(f => ({ ...f, lastName: e.target.value }))} /></Field>
              <Field label="Username"><Input required value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} /></Field>
              <Field label="Email"><Input required type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} /></Field>
              <Field label="Temporary Password"><Input required type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 chars" /></Field>
              <Field label="Role">
                <Select value={userForm.roleName} onChange={e => setUserForm(f => ({ ...f, roleName: e.target.value }))}>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Finance">Finance Executive</option>
                  <option value="IT Administrator">IT Administrator</option>
                  <option value="Manager">Department Manager</option>
                  <option value="Team Lead">Team Lead</option>
                </Select>
              </Field>
              <Field label="Department">
                <Select value={userForm.department} onChange={e => setUserForm(f => ({ ...f, department: e.target.value }))}>
                  <option value="">Select department...</option>
                  {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                </Select>
              </Field>
              <Field label="Designation">
                <Select value={userForm.designation} onChange={e => setUserForm(f => ({ ...f, designation: e.target.value }))}>
                  <option value="">Select designation...</option>
                  {designations.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                </Select>
              </Field>
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

      {/* Create Designation Modal */}
      {showDesigModal && (
        <Modal title="Create Designation" onClose={() => setShowDesigModal(false)}>
          <form onSubmit={handleCreateDesig} className="space-y-4">
            <Field label="Designation Name"><Input required value={desigForm.name} onChange={e => setDesigForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Senior Software Engineer" /></Field>
            <Field label="Designation Code"><Input required value={desigForm.code} onChange={e => setDesigForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SSE" /></Field>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="primary" className="flex-1">Create</Btn>
              <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowDesigModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Policy Modal */}
      {showPolicyModal && (
        <Modal title="Create Policy Document" onClose={() => setShowPolicyModal(false)}>
          <form onSubmit={handleCreatePolicy} className="space-y-4">
            <Field label="Policy Title"><Input required value={policyForm.title} onChange={e => setPolicyForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Remote Work Guidelines" /></Field>
            <Field label="Category"><Input required value={policyForm.category} onChange={e => setPolicyForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. HR / Compliance / Security" /></Field>
            <Field label="Content Details">
              <textarea required value={policyForm.content} onChange={e => setPolicyForm(f => ({ ...f, content: e.target.value }))} rows={4} className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type policy details..." />
            </Field>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="primary" className="flex-1">Create</Btn>
              <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowPolicyModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Shift Modal */}
      {showShiftModal && (
        <Modal title="Create Work Shift" onClose={() => setShowShiftModal(false)}>
          <form onSubmit={handleCreateShift} className="space-y-4">
            <Field label="Shift Name"><Input required value={shiftForm.name} onChange={e => setShiftForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Night Shift" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Time"><Input required type="time" value={shiftForm.startTime} onChange={e => setShiftForm(f => ({ ...f, startTime: e.target.value }))} /></Field>
              <Field label="End Time"><Input required type="time" value={shiftForm.endTime} onChange={e => setShiftForm(f => ({ ...f, endTime: e.target.value }))} /></Field>
            </div>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="primary" className="flex-1">Create</Btn>
              <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowShiftModal(false)}>Cancel</Btn>
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
  const { user: hrUser } = useContext(AuthContext);
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

  const handleToggleSuspend = async (emp) => {
    const isSuspended = !emp.userRef?.isActive;
    const action = isSuspended ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} ${emp.firstName} ${emp.lastName}'s account?`)) return;
    try {
      await api.put(`/users/${emp.userRef?._id}/status`, { isActive: isSuspended });
      toast.success(`Employee account ${isSuspended ? 'activated' : 'suspended'} successfully`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || `Failed to ${action} employee`); }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Permanently delete ${name}'s record? This cannot be undone.`)) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee record deleted');
      load();
    } catch { toast.error('Failed to delete employee'); }
  };

  if (loading) return <LoadingSpinner />;

  // Filter out Org Admins, HR Managers, and Archived employees from the directory
  const visibleEmployees = employees.filter(e => {
    const role = e.userRef?.role?.name;
    return role !== 'Organization Admin' && role !== 'HR Manager' && e.status !== 'Archived';
  });

  const active = visibleEmployees.filter(e => e.status === 'Active').length;
  const allActive = employees.filter(e => e.status === 'Active').length;
  const onLeave = employees.filter(e => e.status === 'On Leave').length;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold">Welcome, HR Manager 👋</h2>
        <p className="opacity-80 text-sm mt-1">Logged in as: {hrUser?.username || 'HR Manager'} · Human Resources Management Panel</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Staff" value={visibleEmployees.length} color="bg-blue-500" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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
                {visibleEmployees.length === 0
                  ? <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No employees found.</td></tr>
                  : visibleEmployees.map(emp => (
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
                      <td className="px-4 py-3">
                        {(() => {
                          const isSuspended = emp.userRef?.isActive === false;
                          const statusLabel = isSuspended ? 'Suspended' : (emp.status || 'Active');
                          const statusColor = isSuspended
                            ? 'bg-orange-100 text-orange-800'
                            : emp.status === 'Active' ? 'bg-green-100 text-green-800'
                            : emp.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600';
                          return <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusColor}`}>{statusLabel}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <Btn
                            variant={emp.userRef?.isActive !== false ? 'danger' : 'success'}
                            className="py-1 px-2 text-xs"
                            onClick={() => handleToggleSuspend(emp)}
                          >
                            {emp.userRef?.isActive !== false ? 'Suspend' : 'Activate'}
                          </Btn>
                          <Btn
                            variant="secondary"
                            className="py-1 px-2 text-xs !text-red-600 !border-red-300 hover:!bg-red-50"
                            onClick={() => handleDeleteEmployee(emp._id, `${emp.firstName} ${emp.lastName}`)}
                          >
                            Delete
                          </Btn>
                        </div>
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
  const { user: itUser } = useContext(AuthContext);
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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold">Welcome, IT Administrator 👋</h2>
        <p className="opacity-80 text-sm mt-1">Logged in as: {itUser?.username || 'IT Admin'} · IT Security & Support Panel</p>
      </div>

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
// DEPARTMENT MANAGER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const ManagerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState('team');
  const [managerEmp, setManagerEmp] = useState(null);
  const [team, setTeam] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ employee: '', rating: 5, reviewText: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get Manager Employee Profile
      let managerProfile = null;
      if (user?.employeeRef) {
        const profileRes = await api.get(`/employees/${user.employeeRef}`);
        managerProfile = profileRes.data;
        setManagerEmp(managerProfile);
      }

      // 2. Get Employees, Leaves, Corrections, Reviews
      const [empRes, leavesRes, correctionsRes, reviewsRes] = await Promise.all([
        api.get('/employees'),
        api.get('/leaves'),
        api.get('/enterprise/corrections').catch(() => ({ data: [] })),
        api.get('/enterprise/reviews').catch(() => ({ data: [] }))
      ]);

      // Filter employees by Manager's department
      let managerDeptTeam = [];
      if (managerProfile) {
        managerDeptTeam = empRes.data.filter(
          emp => emp.department === managerProfile.department && emp._id !== managerProfile._id
        );
      } else {
        managerDeptTeam = empRes.data;
      }
      setTeam(managerDeptTeam);

      // Filter leaves, corrections, reviews related to this department team
      setLeaves(leavesRes.data.filter(l => managerDeptTeam.some(t => t._id === l.employee?._id)));
      setCorrections(correctionsRes.data.filter(c => managerDeptTeam.some(t => t._id === c.employee?._id)));
      setReviews(reviewsRes.data.filter(r => managerDeptTeam.some(t => t._id === r.employee?._id)));
    } catch {
      toast.error('Failed to load Manager Dashboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await api.put(`/leaves/${leaveId}/status`, { status });
      toast.success(`Leave request ${status.toLowerCase()}`);
      load();
    } catch {
      toast.error('Failed to update leave status');
    }
  };

  const handleCorrectionAction = async (id, status) => {
    try {
      await api.put(`/enterprise/corrections/${id}`, { status });
      toast.success(`Correction request ${status.toLowerCase()}`);
      load();
    } catch {
      toast.error('Failed to update attendance correction');
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enterprise/reviews', reviewForm);
      toast.success('Performance review submitted!');
      setShowReviewModal(false);
      setReviewForm({ employee: '', rating: 5, reviewText: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    }
  };

  if (loading) return <LoadingSpinner />;

  const pendingLeaves = leaves.filter(l => l.status === 'Pending');
  const pendingCorrections = corrections.filter(c => c.status === 'Pending');
  const reviewsDue = team.filter(t => !reviews.some(r => r.employee?._id === t._id)).length;

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold">Welcome Back, {managerEmp ? `${managerEmp.firstName} ${managerEmp.lastName}` : 'Manager'}</h2>
        <p className="opacity-90 text-sm mt-1">Department: {managerEmp?.department || 'Not Assigned'} Manager Dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="Team Size" value={team.length} color="bg-blue-500" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        <StatCard label="Present Today" value={team.filter(e => e.status === 'Active').length} color="bg-green-500" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Pending Leaves" value={pendingLeaves.length} color="bg-yellow-500" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Pending Corrections" value={pendingCorrections.length} color="bg-purple-500" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Reviews Due" value={reviewsDue} color="bg-red-500" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          ['team', 'My Team'],
          ['leaves', `Leave Requests${pendingLeaves.length > 0 ? ` (${pendingLeaves.length})` : ''}`],
          ['corrections', `Attendance Corrections${pendingCorrections.length > 0 ? ` (${pendingCorrections.length})` : ''}`],
          ['reviews', 'Performance Reviews']
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`py-3 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {tab === 'team' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b"><h4 className="font-bold text-gray-900 text-lg">Department Employees</h4></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Name', 'Employee ID', 'Designation', 'Joining Date', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {team.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No team members onboarded under your department.</td></tr>
                ) : (
                  team.map(emp => (
                    <tr key={emp._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{emp.firstName} {emp.lastName}<div className="text-xs text-gray-400">{emp.email}</div></td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.employeeId}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.designation}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(emp.joiningDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><Badge value={emp.status} map={{ Active: 'bg-green-100 text-green-800', 'On Leave': 'bg-yellow-100 text-yellow-800', Terminated: 'bg-red-100 text-red-800' }} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'leaves' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b"><h4 className="font-bold text-gray-900 text-lg">Team Leave Requests</h4></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Employee', 'Type', 'Dates', 'Reason', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaves.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No leave requests found.</td></tr>
                ) : (
                  leaves.map(l => (
                    <tr key={l._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{l.employee?.firstName} {l.employee?.lastName}</td>
                      <td className="px-4 py-3"><span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{l.type}</span></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={l.reason}>{l.reason}</td>
                      <td className="px-4 py-3"><Badge value={l.status} map={LEAVE_STATUS_COLORS} /></td>
                      <td className="px-4 py-3 space-x-1">
                        {l.status === 'Pending' && (
                          <>
                            <Btn variant="success" className="py-1 px-2 text-xs" onClick={() => handleLeaveAction(l._id, 'Approved')}>Approve</Btn>
                            <Btn variant="danger" className="py-1 px-2 text-xs" onClick={() => handleLeaveAction(l._id, 'Rejected')}>Reject</Btn>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'corrections' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b"><h4 className="font-bold text-gray-900 text-lg">Attendance Corrections</h4></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Employee', 'Date', 'Times Requested', 'Reason', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {corrections.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No attendance corrections.</td></tr>
                ) : (
                  corrections.map(c => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{c.employee?.firstName} {c.employee?.lastName}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{new Date(c.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.clockInTime || '—'} / {c.clockOutTime || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={c.reason}>{c.reason}</td>
                      <td className="px-4 py-3"><Badge value={c.status} map={{ Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800' }} /></td>
                      <td className="px-4 py-3 space-x-1">
                        {c.status === 'Pending' && (
                          <>
                            <Btn variant="success" className="py-1 px-2 text-xs" onClick={() => handleCorrectionAction(c._id, 'Approved')}>Approve</Btn>
                            <Btn variant="danger" className="py-1 px-2 text-xs" onClick={() => handleCorrectionAction(c._id, 'Rejected')}>Reject</Btn>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="bg-white shadow rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-gray-900 text-lg">Performance Reviews</h4>
            <Btn variant="primary" onClick={() => setShowReviewModal(true)}>+ New Review</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Employee ID', 'Employee Name', 'Rating', 'Review Details', 'Submitted'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No review logs.</td></tr>
                ) : (
                  reviews.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.employee?.employeeId}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{r.employee?.firstName} {r.employee?.lastName}</td>
                      <td className="px-4 py-3 font-bold text-yellow-600">{r.rating} / 5 ★</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={r.reviewText}>{r.reviewText}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <Modal title="Create Performance Review" onClose={() => setShowReviewModal(false)}>
          <form onSubmit={handleCreateReview} className="space-y-4">
            <Field label="Select Employee">
              <Select required value={reviewForm.employee} onChange={e => setReviewForm(f => ({ ...f, employee: e.target.value }))}>
                <option value="">Choose employee...</option>
                {team.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                ))}
              </Select>
            </Field>
            <Field label="Rating (1-5 Star)">
              <Select value={reviewForm.rating} onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Satisfactory</option>
                <option value="2">2 - Needs Improvement</option>
                <option value="1">1 - Poor</option>
              </Select>
            </Field>
            <Field label="Review Details">
              <textarea required rows={4} value={reviewForm.reviewText} onChange={e => setReviewForm(f => ({ ...f, reviewText: e.target.value }))} className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe employee performance and goals..." />
            </Field>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="success" className="flex-1">Submit Review</Btn>
              <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowReviewModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM LEAD DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const TeamLeadDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState('tasks');
  const [leadEmp, setLeadEmp] = useState(null);
  const [team, setTeam] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // New task form state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let leadProfile = null;
      if (user?.employeeRef) {
        const profileRes = await api.get(`/employees/${user.employeeRef}`);
        leadProfile = profileRes.data;
        setLeadEmp(leadProfile);
      }

      const [empRes, tasksRes] = await Promise.all([
        api.get('/employees'),
        api.get('/enterprise/tasks').catch(() => ({ data: [] }))
      ]);

      let leadTeam = [];
      if (leadProfile) {
        leadTeam = empRes.data.filter(emp => emp.department === leadProfile.department && emp._id !== leadProfile._id);
      } else {
        leadTeam = empRes.data;
      }
      setTeam(leadTeam);

      // Filter tasks related to department employees
      setTasks(tasksRes.data.filter(t => leadTeam.some(te => te._id === t.assignedTo?._id)));
    } catch {
      toast.error('Failed to load Team Lead Dashboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enterprise/tasks', taskForm);
      toast.success('Task created and assigned!');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignedTo: '', dueDate: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign task');
    }
  };

  const handleToggleTaskStatus = async (taskId, currentStatus) => {
    const nextStatusMap = {
      'Pending': 'In Progress',
      'In Progress': 'Review',
      'Review': 'Completed',
      'Completed': 'Pending'
    };
    const status = nextStatusMap[currentStatus] || 'Pending';
    try {
      await api.put(`/enterprise/tasks/${taskId}`, { status });
      toast.success(`Task status updated to ${status}`);
      load();
    } catch {
      toast.error('Failed to update task status');
    }
  };

  if (loading) return <LoadingSpinner />;

  const activeTasks = tasks.filter(t => t.status === 'In Progress');
  const overdueTasks = tasks.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < new Date());

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold">Welcome Back, {leadEmp ? `${leadEmp.firstName} ${leadEmp.lastName}` : 'Team Lead'}</h2>
        <p className="opacity-90 text-sm mt-1">Department: {leadEmp?.department || 'Not Assigned'} Team Lead Dashboard</p>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value="2" color="bg-blue-500" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <StatCard label="Active Tasks" value={activeTasks.length} color="bg-yellow-500" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Overdue Tasks" value={overdueTasks.length} color="bg-red-500" icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        <StatCard label="Team Utilization" value="88%" color="bg-green-500" icon="M13 10V3L4 14h7v7l9-11h-7z" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          ['tasks', 'Sprint Planning & Tasks'],
          ['team', 'Team Utilization']
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`py-3 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h4 className="font-bold text-gray-900 text-lg">Active Tasks</h4>
            <Btn variant="primary" onClick={() => setShowTaskModal(true)}>+ Assign New Task</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Task Title', 'Description', 'Assigned To', 'Due Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No active tasks in your sprint.</td></tr>
                ) : (
                  tasks.map(t => (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{t.title}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={t.description}>{t.description || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{t.assignedTo?.firstName} {t.assignedTo?.lastName}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No limit'}</td>
                      <td className="px-4 py-3">
                        <Badge value={t.status} map={{ Pending: 'bg-yellow-100 text-yellow-800', 'In Progress': 'bg-blue-100 text-blue-800', Review: 'bg-orange-100 text-orange-800', Completed: 'bg-green-100 text-green-800' }} />
                      </td>
                      <td className="px-4 py-3">
                        <Btn variant="secondary" className="py-1 px-2 text-xs font-semibold" onClick={() => handleToggleTaskStatus(t._id, t.status)}>
                          Advance Status
                        </Btn>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team tab */}
      {tab === 'team' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b"><h4 className="font-bold text-gray-900 text-lg">Team Members Workload</h4></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Name', 'Employee ID', 'Designation', 'Total Tasks Assigned'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {team.map(emp => (
                  <tr key={emp._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{emp.firstName} {emp.lastName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.employeeId}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.designation}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800">
                      {tasks.filter(t => t.assignedTo?._id === emp._id).length} tasks
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <Modal title="Create Sprint Task" onClose={() => setShowTaskModal(false)}>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <Field label="Task Title"><Input required value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Develop login frontend" /></Field>
            <Field label="Assign To Team Member">
              <Select required value={taskForm.assignedTo} onChange={e => setTaskForm(f => ({ ...f, assignedTo: e.target.value }))}>
                <option value="">Select team member...</option>
                {team.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                ))}
              </Select>
            </Field>
            <Field label="Due Date"><Input required type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} /></Field>
            <Field label="Description details">
              <textarea rows={3} value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Provide step details..." />
            </Field>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="success" className="flex-1">Assign Task</Btn>
              <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowTaskModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCE EXECUTIVE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const FinanceDashboard = () => {
  const { user: financeUser } = useContext(AuthContext);
  const [tab, setTab] = useState('generate');
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal payroll generation states
  const [showPayrollModal, setShowPayrollModal] = useState(null);
  const [payrollForm, setPayrollForm] = useState({ baseSalary: 55000, allowances: 0, deductions: 0, month: 'January', year: 2026 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, payrollsRes] = await Promise.all([
        api.get('/employees'),
        api.get('/enterprise/payrolls').catch(() => ({ data: [] }))
      ]);
      setEmployees(empRes.data.filter(e => e.status !== 'Archived'));
      setPayrolls(payrollsRes.data);
    } catch {
      toast.error('Failed to load Finance Dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enterprise/payrolls', {
        employee: showPayrollModal._id,
        ...payrollForm
      });
      toast.success('Payroll generated successfully!');
      setShowPayrollModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate payroll');
    }
  };

  const handleUpdatePayrollStatus = async (id, status) => {
    try {
      await api.put(`/enterprise/payrolls/${id}`, { status });
      toast.success(`Payroll successfully ${status.toLowerCase()}`);
      load();
    } catch {
      toast.error('Failed to update payroll status');
    }
  };

  if (loading) return <LoadingSpinner />;

  // Computed details
  const totalSalariesExpense = payrolls.filter(p => p.status === 'Processed').reduce((acc, curr) => acc + curr.netSalary, 0);
  const overtimeCost = payrolls.reduce((acc, curr) => acc + (curr.allowances || 0), 0);
  const processedPayrolls = payrolls.filter(p => p.status === 'Processed').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold">Welcome, Finance Executive 👋</h2>
        <p className="opacity-90 text-sm mt-1">Logged in as: {financeUser?.username || 'Finance Executive'} · Payroll & Compensation Management Panel</p>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Employees Configured" value={employees.length} color="bg-blue-500" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        <StatCard label="Payrolls Processed" value={processedPayrolls} color="bg-green-500" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Total Expense Paid" value={`$${totalSalariesExpense.toLocaleString()}`} color="bg-emerald-600" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Overtime Allowances" value={`$${overtimeCost.toLocaleString()}`} color="bg-yellow-500" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          ['generate', 'Onboard / Generate Payroll'],
          ['records', 'Salary Records & Payslips']
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`py-3 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {tab === 'generate' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b"><h4 className="font-bold text-gray-900 text-lg">Employee Directory</h4></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Employee ID', 'Name', 'Department', 'Designation', 'Joining Date', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map(emp => (
                  <tr key={emp._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.employeeId}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{emp.firstName} {emp.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.designation}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(emp.joiningDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Btn variant="primary" className="py-1 px-2 text-xs font-semibold" onClick={() => {
                        setShowPayrollModal(emp);
                        setPayrollForm({ baseSalary: 55000, allowances: 0, deductions: 0, month: 'January', year: 2026 });
                      }}>
                        Run Payroll
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Records Tab */}
      {tab === 'records' && (
        <div className="bg-white shadow rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b"><h4 className="font-bold text-gray-900 text-lg">Salary Compensation Ledger</h4></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Employee ID', 'Name', 'Period', 'Base Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payrolls.length === 0 ? (
                  <tr><td colSpan="9" className="px-6 py-8 text-center text-gray-400">No salary records generated.</td></tr>
                ) : (
                  payrolls.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.employee?.employeeId}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{p.employee?.firstName} {p.employee?.lastName}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{p.month} {p.year}</td>
                      <td className="px-4 py-3 text-gray-600">${p.baseSalary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-600">+${(p.allowances || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-red-600">-${(p.deductions || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">${p.netSalary.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge value={p.status} map={{ Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-blue-100 text-blue-800', Processed: 'bg-green-100 text-green-800' }} />
                      </td>
                      <td className="px-4 py-3 space-x-1 whitespace-nowrap">
                        {p.status === 'Pending' && (
                          <Btn variant="primary" className="py-1 px-2 text-xs font-semibold" onClick={() => handleUpdatePayrollStatus(p._id, 'Approved')}>Approve</Btn>
                        )}
                        {p.status === 'Approved' && (
                          <Btn variant="success" className="py-1 px-2 text-xs font-semibold" onClick={() => handleUpdatePayrollStatus(p._id, 'Processed')}>Process</Btn>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Run Payroll Modal */}
      {showPayrollModal && (
        <Modal title={`Generate Salary — ${showPayrollModal.firstName} ${showPayrollModal.lastName}`} onClose={() => setShowPayrollModal(null)}>
          <form onSubmit={handleGeneratePayroll} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Month">
                <Select value={payrollForm.month} onChange={e => setPayrollForm(f => ({ ...f, month: e.target.value }))}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Year">
                <Select value={payrollForm.year} onChange={e => setPayrollForm(f => ({ ...f, year: Number(e.target.value) }))}>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </Select>
              </Field>
              <Field label="Base Salary ($)"><Input required type="number" value={payrollForm.baseSalary} onChange={e => setPayrollForm(f => ({ ...f, baseSalary: Number(e.target.value) }))} /></Field>
              <Field label="Allowances ($)"><Input type="number" value={payrollForm.allowances} onChange={e => setPayrollForm(f => ({ ...f, allowances: Number(e.target.value) }))} /></Field>
              <Field label="Deductions ($)"><Input type="number" value={payrollForm.deductions} onChange={e => setPayrollForm(f => ({ ...f, deductions: Number(e.target.value) }))} /></Field>
            </div>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" variant="success" className="flex-1">Generate Slip</Btn>
              <Btn type="button" variant="secondary" className="flex-1" onClick={() => setShowPayrollModal(null)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

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
    case 'Manager':             return <ManagerDashboard />;
    case 'Team Lead':           return <TeamLeadDashboard />;
    case 'Finance':             return <FinanceDashboard />;
    default:
      return (
        <div className="flex h-64 items-center justify-center text-red-500 text-xl font-bold">
          Unauthorized Role Dashboard
        </div>
      );
  }
};

export default AdminDashboard;
