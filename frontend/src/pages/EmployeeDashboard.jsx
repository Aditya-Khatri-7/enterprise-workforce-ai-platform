import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

// ─── Reusable sub-components ──────────────────────────────────────────────────
const Modal = ({ title, subtitle, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600 text-2xl leading-none font-light">&times;</button>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const Input = (props) => <input {...props} className={inputCls} />;
const Textarea = (props) => <textarea {...props} className={`${inputCls} resize-none`} />;
const Select = ({ children, ...props }) => (
  <select {...props} className={`${inputCls} bg-white`}>{children}</select>
);

const Btn = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const sizes = { sm: 'py-1.5 px-3 text-xs', md: 'py-2 px-4 text-sm', lg: 'py-2.5 px-5 text-sm' };
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm',
    ghost: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm',
  };
  return (
    <button {...props} className={`inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-60 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const LEAVE_BADGE = {
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border border-red-200',
};

const TICKET_BADGE = {
  Open: 'bg-blue-50 text-blue-700 border border-blue-200',
  'In Progress': 'bg-amber-50 text-amber-700 border border-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Closed: 'bg-gray-100 text-gray-600 border border-gray-200',
};

// ─── Main Component ────────────────────────────────────────────────────────────
const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const emp = user?.employeeRef || {};
  const firstName = emp.firstName || user?.username || 'there';

  const [leaves, setLeaves] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Form states
  const [leaveForm, setLeaveForm] = useState({ type: 'Casual', startDate: '', endDate: '', reason: '' });
  const [ticketForm, setTicketForm] = useState({ category: 'General', subject: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leaveRes, ticketRes] = await Promise.all([
        api.get('/leaves'),
        api.get('/support'),
      ]);
      setLeaves(leaveRes.data);
      setTickets(ticketRes.data);
    } catch (err) {
      // silently handle — user might not have employee ref yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Leave Application ───────────────────────────────────────────────────────
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/leaves', leaveForm);
      toast.success('Leave request submitted successfully!');
      setShowLeaveModal(false);
      setLeaveForm({ type: 'Casual', startDate: '', endDate: '', reason: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Support Ticket ──────────────────────────────────────────────────────────
  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/support', ticketForm);
      toast.success('Support ticket raised! IT team will assist you shortly.');
      setShowTicketModal(false);
      setTicketForm({ category: 'General', subject: '', description: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to raise ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Computed values ─────────────────────────────────────────────────────────
  const pendingLeaves  = leaves.filter(l => l.status === 'Pending').length;
  const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
  const openTickets    = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;

  const profileFields = [emp.firstName, emp.lastName, emp.mobile, emp.address, emp.emergencyContact];
  const profileComplete = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Good day, {firstName}! 👋</h2>
              <p className="mt-1 text-blue-100">
                {emp.designation ? `${emp.designation} · ` : ''}{emp.department || 'Your workspace is ready'}
              </p>
              {emp.employeeId && (
                <span className="mt-3 inline-block bg-white/20 text-white text-xs font-mono px-3 py-1 rounded-full">
                  ID: {emp.employeeId}
                </span>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              <Btn variant="success" onClick={() => setShowLeaveModal(true)}>
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Apply Leave
              </Btn>
              <Btn variant="ghost" className="!bg-white/20 !text-white !border-white/30 hover:!bg-white/30" onClick={() => setShowTicketModal(true)}>
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                IT Support
              </Btn>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Leave Requests', value: leaves.length, sub: `${pendingLeaves} pending`, color: 'border-amber-400', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', iconBg: 'bg-amber-50 text-amber-600' },
          { label: 'Approved Leaves', value: approvedLeaves, sub: 'this period', color: 'border-emerald-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', iconBg: 'bg-emerald-50 text-emerald-600' },
          { label: 'Support Tickets', value: tickets.length, sub: `${openTickets} open`, color: 'border-blue-400', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', iconBg: 'bg-blue-50 text-blue-600' },
          { label: 'Profile Complete', value: `${profileComplete}%`, sub: 'of your profile', color: 'border-purple-400', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', iconBg: 'bg-purple-50 text-purple-600' },
        ].map(card => (
          <div key={card.label} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${card.color} hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="mt-0.5 text-xs text-gray-500">{card.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Info Cards Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Department & Manager */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">My Work Info</h4>
          <dl className="space-y-3">
            {[
              { label: 'Department', value: emp.department },
              { label: 'Designation', value: emp.designation },
              { label: 'Employee ID', value: emp.employeeId, mono: true },
              { label: 'Joining Date', value: emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : null },
              { label: 'Status', value: emp.status },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value || <span className="text-gray-300 font-normal">—</span>}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <Link to="/profile" className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
              Edit Profile
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Profile Completion</h4>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3"
                  strokeDasharray={`${profileComplete} ${100 - profileComplete}`} strokeDashoffset="0" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{profileComplete}%</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            {[
              { label: 'Name', done: !!(emp.firstName && emp.lastName) },
              { label: 'Mobile', done: !!emp.mobile },
              { label: 'Address', done: !!emp.address },
              { label: 'Emergency Contact', done: !!emp.emergencyContact },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${item.done ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  {item.done ? '✓' : ''}
                </div>
                <span className={`text-sm ${item.done ? 'text-gray-700' : 'text-gray-400'}`}>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/profile" className="w-full block text-center bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm py-2 rounded-lg transition-colors">
              Complete Profile →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Quick Actions</h4>
          <div className="space-y-2">
            {[
              { label: 'Apply for Leave', desc: 'Submit a new leave application', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-blue-600 bg-blue-50', action: () => setShowLeaveModal(true) },
              { label: 'IT Support Ticket', desc: 'Raise a technical support request', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', color: 'text-orange-600 bg-orange-50', action: () => setShowTicketModal(true) },
              { label: 'View My Leaves', desc: 'See all leave requests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3', color: 'text-emerald-600 bg-emerald-50', action: () => setActiveTab('leaves') },
              { label: 'Update Profile', desc: 'Edit your personal information', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'text-purple-600 bg-purple-50', action: null, link: '/profile' },
            ].map(item => (
              item.link ? (
                <Link key={item.label} to={item.link} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                  </div>
                  <div className="min-w-0"><p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
                </Link>
              ) : (
                <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group text-left">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                  </div>
                  <div className="min-w-0"><p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
                </button>
              )
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex gap-1 border-b border-gray-200 bg-white rounded-t-xl px-4 shadow-sm">
          {[['overview', 'Overview'], ['leaves', `My Leaves (${leaves.length})`], ['tickets', `Support Tickets (${tickets.length})`]].map(([k, l]) => (
            <button key={k} onClick={() => setActiveTab(k)}
              className={`py-3.5 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${activeTab === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-b-xl shadow-sm border-x border-b border-gray-100 p-6">
            {leaves.length === 0 && tickets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <svg className="mx-auto w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="font-medium">No activity yet</p>
                <p className="text-sm mt-1">Use the quick actions above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recent Activity</p>
                {[...leaves.slice(0, 3).map(l => ({ type: 'leave', data: l })),
                  ...tickets.slice(0, 3).map(t => ({ type: 'ticket', data: t }))]
                  .sort((a, b) => new Date(b.data.createdAt) - new Date(a.data.createdAt))
                  .slice(0, 5)
                  .map(item => (
                    <div key={item.data._id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${item.type === 'leave' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.type === 'leave' ? '🌴' : '🎫'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{item.type === 'leave' ? `${item.data.type} Leave — ${item.data.reason}` : `[${item.data.category}] ${item.data.subject}`}</p>
                        <p className="text-xs text-gray-400">{new Date(item.data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.type === 'leave' ? LEAVE_BADGE[item.data.status] : TICKET_BADGE[item.data.status]}`}>
                        {item.data.status}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Leaves Tab */}
        {activeTab === 'leaves' && (
          <div className="bg-white rounded-b-xl shadow-sm border-x border-b border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h4 className="font-bold text-gray-900">My Leave Requests</h4>
              <Btn variant="primary" size="sm" onClick={() => setShowLeaveModal(true)}>+ Apply Leave</Btn>
            </div>
            {loading ? (
              <div className="py-12 text-center text-gray-400">Loading...</div>
            ) : leaves.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="font-medium">No leave requests submitted yet</p>
                <p className="text-sm mt-1">Apply for your first leave above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>{['Type', 'From', 'To', 'Reason', 'Applied On', 'Status'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leaves.map(l => (
                      <tr key={l._id} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700">{l.type}</span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-gray-900">{new Date(l.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                        <td className="px-5 py-3.5 text-gray-600">{new Date(l.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate" title={l.reason}>{l.reason}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(l.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${LEAVE_BADGE[l.status]}`}>{l.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="bg-white rounded-b-xl shadow-sm border-x border-b border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h4 className="font-bold text-gray-900">My Support Tickets</h4>
              <Btn variant="primary" size="sm" onClick={() => setShowTicketModal(true)}>+ New Ticket</Btn>
            </div>
            {loading ? (
              <div className="py-12 text-center text-gray-400">Loading...</div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="font-medium">No support tickets raised yet</p>
                <p className="text-sm mt-1">Raise a ticket if you need IT assistance</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>{['Category', 'Subject', 'Description', 'Raised On', 'Status'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tickets.map(t => (
                      <tr key={t._id} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-50 text-orange-700">{t.category}</span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-900">{t.subject}</td>
                        <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate" title={t.description}>{t.description || '—'}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${TICKET_BADGE[t.status]}`}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Leave Application Modal ───────────────────────────────────────────── */}
      {showLeaveModal && (
        <Modal
          title="Apply for Leave"
          subtitle="Your request will be reviewed by the organization admin"
          onClose={() => setShowLeaveModal(false)}
        >
          <form onSubmit={handleApplyLeave} className="space-y-4">
            <Field label="Leave Type" required>
              <Select value={leaveForm.type} onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value }))}>
                {['Casual', 'Sick', 'Annual', 'Maternity', 'Paternity'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date" required>
                <Input type="date" required value={leaveForm.startDate} onChange={e => setLeaveForm(f => ({ ...f, startDate: e.target.value }))} />
              </Field>
              <Field label="End Date" required>
                <Input type="date" required value={leaveForm.endDate} onChange={e => setLeaveForm(f => ({ ...f, endDate: e.target.value }))} />
              </Field>
            </div>
            <Field label="Reason" required>
              <Textarea required rows="3" value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} placeholder="Briefly describe the reason for your leave..." />
            </Field>
            <div className="flex gap-3 pt-1">
              <Btn type="submit" variant="primary" className="flex-1" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</Btn>
              <Btn type="button" variant="ghost" className="flex-1" onClick={() => setShowLeaveModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* ── IT Support Ticket Modal ───────────────────────────────────────────── */}
      {showTicketModal && (
        <Modal
          title="Raise IT Support Ticket"
          subtitle="The IT team will review and respond to your request"
          onClose={() => setShowTicketModal(false)}
        >
          <form onSubmit={handleRaiseTicket} className="space-y-4">
            <Field label="Issue Category" required>
              <Select value={ticketForm.category} onChange={e => setTicketForm(f => ({ ...f, category: e.target.value }))}>
                {['Password Reset', 'Account Lock', 'Technical', 'General'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Subject" required>
              <Input required value={ticketForm.subject} onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief summary of the issue..." />
            </Field>
            <Field label="Description">
              <Textarea rows="3" value={ticketForm.description} onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))} placeholder="Provide any additional details that may help resolve this faster..." />
            </Field>
            <div className="flex gap-3 pt-1">
              <Btn type="submit" variant="primary" className="flex-1" disabled={submitting}>{submitting ? 'Raising...' : 'Raise Ticket'}</Btn>
              <Btn type="button" variant="ghost" className="flex-1" onClick={() => setShowTicketModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeDashboard;
