import React, { useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { DemoContext, DemoProgressContext } from '../context/DemoContext';
import {
  Calendar, Clock, CheckCircle, AlertTriangle, Play, Plus, FileText,
  MessageSquare, User, ArrowRight, Layers, Award, ShieldAlert, Cpu
} from 'lucide-react';

// ─── Modal Component ──────────────────────────────────────────────────────────
const Modal = ({ title, subtitle, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-white dark:bg-[#151A30] border border-slate-200 dark:border-emerald-500/30 rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6 text-slate-800 dark:text-white"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1F2647] pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{title}</h3>
          {subtitle && <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="text-slate-400 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white text-xl font-light">&times;</button>
      </div>
      {children}
    </motion.div>
  </div>
);

const Field = ({ label, required, children }) => (
  <div className="space-y-1">
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "block w-full border border-slate-200 dark:border-[#1F2647] bg-slate-50 dark:bg-[#0E1325]/60 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white";
const Input = (props) => <input {...props} className={inputCls} />;
const Textarea = (props) => <textarea {...props} className={`${inputCls} resize-none`} />;
const Select = ({ children, ...props }) => (
  <select {...props} className={`${inputCls} bg-slate-50 dark:bg-[#0E1325]`}>{children}</select>
);

const Btn = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all focus:outline-none disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98]';
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    success: 'bg-teal-600 hover:bg-teal-700 text-white',
    danger: 'bg-red-500 hover:bg-red-650 text-white',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-[#1F2647] dark:hover:bg-[#2A335B] dark:text-slate-200 dark:border-[#2F3A6E]'
  };
  return <button {...props} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
};

const LEAVE_BADGE = {
  Pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  Approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  Rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
};

const TICKET_BADGE = {
  Open: 'bg-blue-500/10 text-blue-605 dark:text-blue-400 border border-blue-500/20',
  'In Progress': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-605 dark:text-emerald-400 border border-emerald-500/20',
  Closed: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
};

// ─── Main Component ────────────────────────────────────────────────────────────
const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const { progressStore, setProgress } = useContext(DemoProgressContext);
  const emp = user?.employeeRef || {};
  const firstName = emp.firstName || user?.username || 'Riya';

  const [leaves, setLeaves] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);

  // Modal states
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Form states
  const [leaveForm, setLeaveForm] = useState({ type: 'Casual', startDate: '', endDate: '', reason: '' });
  const [ticketForm, setTicketForm] = useState({ category: 'General', subject: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleDownloadLatestPayslip = async () => {
    try {
      const { data } = await api.get('/enterprise/payrolls');
      if (data && data.length > 0) {
        const latest = data[0];
        const empName = `${emp.firstName || user?.username || ''} ${emp.lastName || ''}`.trim();
        const empId = emp.employeeId || 'N/A';
        const designation = emp.designation || 'Staff Member';
        const role = user?.role?.name || user?.role || '';
        const department = emp.department || 'N/A';
        const orgName = user?.organization?.name || 'EWAP Corporate';
        const portalName = 'EWAP Portal';
        const tagLine = 'Great Place to Work';
        
        const baseSalary = latest.baseSalary || 0;
        const allowances = latest.allowances || 0;
        const deductions = latest.deductions || 0;
        const netSalary = latest.netSalary || 0;
        const period = `${latest.month} ${latest.year}`;
        
        const printHTML = `
          <html>
            <head>
              <title>Payslip - ${period}</title>
              <style>
                body {
                  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                  color: #333;
                  padding: 40px;
                  line-height: 1.6;
                }
                .header-table {
                  width: 100%;
                  border-bottom: 2px solid #4f46e5;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                }
                .portal-name {
                  font-size: 14px;
                  font-weight: bold;
                  color: #4f46e5;
                  text-transform: uppercase;
                }
                .org-name {
                  font-size: 24px;
                  font-weight: 900;
                  text-align: center;
                  color: #1e1b4b;
                }
                .tagline {
                  font-size: 12px;
                  font-weight: bold;
                  color: #10b981;
                  text-align: right;
                  text-transform: uppercase;
                }
                .title {
                  text-align: center;
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 30px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                .details-table {
                  width: 100%;
                  margin-bottom: 30px;
                  border-collapse: collapse;
                }
                .details-table td {
                  padding: 8px 12px;
                  font-size: 13px;
                }
                .details-label {
                  font-weight: bold;
                  color: #666;
                  width: 25%;
                }
                .details-value {
                  color: #111;
                  width: 25%;
                }
                .financials-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 30px;
                }
                .financials-table th, .financials-table td {
                  border: 1px solid #e2e8f0;
                  padding: 12px;
                  text-align: left;
                  font-size: 13px;
                }
                .financials-table th {
                  background-color: #f8fafc;
                  font-weight: bold;
                }
                .total-row {
                  font-weight: bold;
                  background-color: #f1f5f9;
                }
                .footer {
                  margin-top: 50px;
                  text-align: center;
                  font-size: 11px;
                  color: #94a3b8;
                  border-top: 1px solid #e2e8f0;
                  padding-top: 20px;
                }
              </style>
            </head>
            <body>
              <table class="header-table">
                <tr>
                  <td class="portal-name" style="width: 30%;">${portalName}</td>
                  <td class="org-name" style="width: 40%;">${orgName}</td>
                  <td class="tagline" style="width: 30%;">${tagLine}</td>
                </tr>
              </table>
              
              <div class="title">Payslip Advice - ${period}</div>
              
              <table class="details-table">
                <tr>
                  <td class="details-label">Employee Name:</td>
                  <td class="details-value">${empName}</td>
                  <td class="details-label">Employee ID:</td>
                  <td class="details-value">${empId}</td>
                </tr>
                <tr>
                  <td class="details-label">Designation:</td>
                  <td class="details-value">${designation}</td>
                  <td class="details-label">Department:</td>
                  <td class="details-value">${department}</td>
                </tr>
                <tr>
                  <td class="details-label">Security Role:</td>
                  <td class="details-value">${role}</td>
                  <td class="details-label">Disbursement:</td>
                  <td class="details-value">${latest.status || 'Paid'}</td>
                </tr>
              </table>
              
              <table class="financials-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Allowances / Earnings (₹)</th>
                    <th style="text-align: right;">Deductions (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Basic Base Salary</td>
                    <td style="text-align: right;">₹${baseSalary.toLocaleString()}</td>
                    <td style="text-align: right;">-</td>
                  </tr>
                  <tr>
                    <td>HRA & Perks Allowances</td>
                    <td style="text-align: right;">₹${allowances.toLocaleString()}</td>
                    <td style="text-align: right;">-</td>
                  </tr>
                  <tr>
                    <td>Taxes & Compliance Deductions</td>
                    <td style="text-align: right;">-</td>
                    <td style="text-align: right;">₹${deductions.toLocaleString()}</td>
                  </tr>
                  <tr class="total-row">
                    <td>Net Take-home Salary</td>
                    <td colspan="2" style="text-align: right; color: #10b981; font-size: 15px;">₹${netSalary.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              
              <div class="footer">
                This is a computer-generated salary slip and requires no physical signature.<br/>
                Generated via EWAP SaaS System at ${new Date().toLocaleString()}. All rights reserved.
              </div>
              
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }
              </script>
            </body>
          </html>
        `;
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(printHTML);
        printWindow.document.close();
      } else {
        toast.info('No payroll records found for this account.');
      }
    } catch (err) {
      toast.error('Failed to generate payslip document.');
    }
  };

  // Local state for Riya Sharma's task status
  const [riyaTaskStatus, setRiyaTaskStatus] = useState('In Progress');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leaveRes, ticketRes, todayRes, tasksRes, teamRes] = await Promise.all([
        api.get('/leaves'),
        api.get('/support'),
        api.get('/attendance/today').catch(() => ({ data: null })),
        api.get('/enterprise/tasks').catch(() => ({ data: [] })),
        api.get('/teams/my-team').catch(() => ({ data: [] }))
      ]);
      setLeaves(leaveRes.data);
      setTickets(ticketRes.data);
      setTodayLog(todayRes.data);
      setAllTasks(tasksRes.data || []);
      setTeamMembers(teamRes.data || []);
      if (tasksRes.data && user?.employeeRef) {
        const empId = user.employeeRef._id || user.employeeRef;
        setTasks(tasksRes.data.filter(t => String(t.assignedTo?._id || t.assignedTo) === String(empId)));
      }
    } catch (err) {
      /* silently handle */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);



  // Clock In / Out
  const handleClockIn = async () => {
    try {
      const location = { lat: 12.9716, lng: 77.5946, address: 'Bangalore Office' };
      const res = await api.post('/attendance/clock-in', { location });
      toast.success(res.data.message || 'Clocked in successfully!');
      setTodayLog(res.data.log);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Clock in failed');
    }
  };

  const handleClockOut = async () => {
    try {
      const res = await api.post('/attendance/clock-out');
      toast.success(res.data.message || 'Clocked out successfully!');
      setTodayLog(res.data.log);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Clock out failed');
    }
  };

  // Leave Submit
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      toast.error('Please fill all fields');
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

  // Raise Ticket
  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/support', ticketForm);
      toast.success('Support ticket raised!');
      setShowTicketModal(false);
      setTicketForm({ category: 'General', subject: '', description: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to raise ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // Sync state values
  const riyaProgress = progressStore['riya_sharma'] !== undefined ? progressStore['riya_sharma'] : 65;
  const karanProgress = progressStore['karan_patel'] !== undefined ? progressStore['karan_patel'] : 80;
  const priyaProgress = progressStore['priya_singh'] !== undefined ? progressStore['priya_singh'] : 40;

  const handleSliderChange = (e) => {
    const newVal = parseInt(e.target.value, 10);
    setProgress('riya_sharma', 't1', newVal);
  };

  if (loading) {
    return (
      <div className="space-y-6 text-slate-800 dark:text-white">
        <div className="h-44 w-full skeleton-shimmer bg-[#151A30]/50 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-24 skeleton-shimmer bg-[#151A30]/50 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
  const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
  const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      
      {/* Welcome Banner */}
      <div className="rounded-3xl overflow-hidden shadow-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/5 via-[#151A30]/5 to-teal-500/5 dark:from-emerald-950 dark:via-[#151A30] dark:to-teal-950 p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Good day, {firstName}! 👋</h2>
            <p className="text-emerald-700 dark:text-emerald-350 text-xs font-semibold">
              Software Developer · Engineering
            </p>
            <span className="inline-block bg-emerald-500/10 text-emerald-800 dark:bg-emerald-500/20 dark:text-cyan-300 text-[10px] font-mono px-3 py-1 rounded-full border border-emerald-500/30">
              Staff ID: EMP_103
            </span>
          </div>

          {/* Clock In / Out */}
          <div className="glass-card border border-emerald-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Daily Attendance</p>
              {todayLog ? (
                <p className="text-xs font-black mt-1 font-mono text-slate-900 dark:text-white">
                  Status: <span className="text-emerald-600 dark:text-emerald-450 uppercase tracking-widest font-black">{todayLog.status}</span>
                  {todayLog.clockIn && ` (${todayLog.clockIn} - ${todayLog.clockOut || 'Working'})`}
                </p>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-350 mt-0.5 font-semibold">Not clocked in today.</p>
              )}
            </div>
            <div className="flex gap-2">
              {!todayLog && (
                <Btn variant="primary" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleClockIn}>Clock In</Btn>
              )}
              {todayLog && !todayLog.clockOut && (
                <Btn variant="danger" className="bg-red-500 hover:bg-red-650" onClick={handleClockOut}>Clock Out</Btn>
              )}
              {todayLog && todayLog.clockOut && (
                <span className="text-xs bg-slate-100 dark:bg-[#1F2647] text-slate-500 dark:text-slate-400 font-bold py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 select-none">Completed</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Leave Requests', value: leaves.length, sub: `${pendingLeaves} pending`, color: 'border-emerald-400', icon: Calendar, bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
          { label: 'Approved Leaves', value: approvedLeaves, sub: 'This month', color: 'border-teal-400', icon: CheckCircle, bg: 'bg-teal-500/10 text-teal-605 dark:text-teal-400' },
          { label: 'Support Tickets', value: tickets.length, sub: `${openTickets} active`, color: 'border-cyan-400', icon: ShieldAlert, bg: 'bg-cyan-500/10 text-cyan-655 dark:text-cyan-400' },
          { label: 'Work Shift', value: '09:00 - 18:00', sub: 'Engineering Standard', color: 'border-indigo-400', icon: Clock, bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' }
        ].map((card, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -3 }}
            className={`glass-card rounded-2xl p-5 border-l-4 ${card.color} border-y border-r border-indigo-500/10 flex items-center justify-between`}
          >
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">{card.value}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{card.sub}</p>
            </div>
            <div className={`p-2.5 rounded-xl ${card.bg}`}>
              <card.icon className="h-4.5 w-4.5" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Core Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Tasks and Team Progress */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MY TASKS */}
          <div className="glass-card border border-emerald-500/20 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">My Assigned Tasks</h3>
            
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map(task => {
                  const statusMapToSlider = {
                    'Pending': 0,
                    'In Progress': 50,
                    'Review': 85,
                    'Completed': 100
                  };
                  const progressValue = statusMapToSlider[task.status] || 0;

                  return (
                    <div key={task._id} className="p-4 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/45 rounded-xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{task.title}</h4>
                          <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1">{task.description}</p>
                        </div>
                      </div>

                      {/* Status Selector Dropdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200/50 dark:border-[#1F2647]/50 pt-3 text-xs">
                        <div className="space-y-1">
                          <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Task Status</label>
                          <select 
                            value={task.status} 
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                await api.put(`/enterprise/tasks/${task._id}`, { status: newStatus });
                                toast.success(`Task status marked as ${newStatus}!`);
                                load();
                              } catch (err) {
                                toast.error('Failed to update task status');
                              }
                            }} 
                            className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold font-mono"
                          >
                            <option value="Pending">To Do / Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Review">Review</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Deadline</label>
                          <p className="p-2 border border-slate-200 dark:border-[#1F2647] bg-slate-50/20 dark:bg-[#0E1325]/30 rounded-xl font-semibold font-mono text-cyan-705 dark:text-cyan-300">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Deadline'}
                          </p>
                        </div>
                      </div>

                      {/* Progress representation */}
                      <div className="space-y-2 border-t border-slate-200/50 dark:border-[#1F2647]/50 pt-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-550 dark:text-slate-400 uppercase font-black tracking-widest text-[9px]">Task Progress Completion</span>
                          <span className="text-slate-900 dark:text-white font-bold font-mono">{progressValue}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-900 border border-slate-250 dark:border-[#1F2647] h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${progressValue}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/45 rounded-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">API Integration</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Project: <span className="text-emerald-700 dark:text-emerald-350 font-semibold">Employee Portal v2</span></p>
                  </div>
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20 text-[9px] uppercase tracking-widest font-black">HIGH PRIORITY</span>
                </div>

                {/* Status Selector Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200/50 dark:border-[#1F2647]/50 pt-3 text-xs">
                  <div className="space-y-1">
                    <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Task Status</label>
                    <select 
                      value={riyaTaskStatus} 
                      onChange={(e) => {
                        setRiyaTaskStatus(e.target.value);
                        toast.success(`Task status marked as ${e.target.value}!`);
                      }} 
                      className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold font-mono"
                    >
                      <option>To Do</option>
                      <option>In Progress</option>
                      <option>Review</option>
                      <option>Completed</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Deadline</label>
                    <p className="p-2 border border-slate-200 dark:border-[#1F2647] bg-slate-50/20 dark:bg-[#0E1325]/30 rounded-xl font-semibold font-mono text-cyan-705 dark:text-cyan-300">2026-07-15</p>
                  </div>
                </div>

                {/* Progress Slider (Updates synced store context in real time) */}
                <div className="space-y-2 border-t border-slate-200/50 dark:border-[#1F2647]/50 pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-550 dark:text-slate-400 uppercase font-black tracking-widest text-[9px]">Task Progress Completion</span>
                    <span className="text-slate-900 dark:text-white font-bold font-mono">{riyaProgress}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={riyaProgress}
                      onChange={handleSliderChange}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-[#0E1325] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MY TEAM'S PROGRESS */}
          <div className="glass-card border border-emerald-500/20 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">My Team's Progress</h3>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black tracking-wider uppercase">Live — updates as team marks progress</span>
            </div>
            
            <div className="space-y-3.5">
              {teamMembers.length > 0 ? (
                teamMembers.map(member => {
                  const memberTasks = allTasks.filter(t => {
                    const assignedId = t.assignedTo?._id || t.assignedTo;
                    return String(assignedId) === String(member._id);
                  });
                  const latestTask = memberTasks.length > 0 
                    ? memberTasks.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0] 
                    : null;

                  const statusMapToSlider = {
                    'Pending': 0,
                    'In Progress': 50,
                    'Review': 85,
                    'Completed': 100
                  };
                  const progressValue = latestTask ? (statusMapToSlider[latestTask.status] || 0) : 0;
                  const taskTitle = latestTask ? latestTask.title : 'No active tasks';
                  const isCurrentUser = String(member._id) === String(user?.employeeRef?._id || user?.employeeRef);

                  return (
                    <div key={member._id} className="p-3 border border-slate-200 dark:border-[#1F2647] bg-slate-50/30 dark:bg-[#0E1325]/30 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-850 dark:text-white">
                          {member.firstName} {member.lastName} {isCurrentUser && '(You)'}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">{progressValue}%</span>
                      </div>
                      <p className="text-[10px] text-slate-550 dark:text-slate-455 font-mono">&gt; Task: {taskTitle}</p>
                      <div className="w-full bg-slate-200 dark:bg-slate-900 border border-slate-250 dark:border-[#1F2647] h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${progressValue}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  {/* Riya Sharma */}
                  <div className="p-3 border border-slate-200 dark:border-[#1F2647] bg-slate-50/30 dark:bg-[#0E1325]/30 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-850 dark:text-white">{firstName} Sharma (You)</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">{riyaProgress}%</span>
                    </div>
                    <p className="text-[10px] text-slate-550 dark:text-slate-450 font-mono">&gt; Task: API Integration</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-900 border border-slate-250 dark:border-[#1F2647] h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${riyaProgress}%` }} />
                    </div>
                  </div>

                  {/* Karan Patel */}
                  <div className="p-3 border border-slate-200 dark:border-[#1F2647] bg-slate-50/30 dark:bg-[#0E1325]/30 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-850 dark:text-white">Karan Patel</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">{karanProgress}%</span>
                    </div>
                    <p className="text-[10px] text-slate-550 dark:text-slate-455 font-mono">&gt; Task: UI Components</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-900 border border-slate-250 dark:border-[#1F2647] h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${karanProgress}%` }} />
                    </div>
                  </div>

                  {/* Priya Singh */}
                  <div className="p-3 border border-slate-200 dark:border-[#1F2647] bg-slate-50/30 dark:bg-[#0E1325]/30 rounded-xl space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-850 dark:text-white">Priya Singh</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">{priyaProgress}%</span>
                    </div>
                    <p className="text-[10px] text-slate-550 dark:text-slate-455 font-mono">&gt; Task: Testing</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-900 border border-slate-250 dark:border-[#1F2647] h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${priyaProgress}%` }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
{/* Right Columns: Actions and Schedule */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="glass-card border border-emerald-500/20 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Self Service Portal</h3>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => setShowLeaveModal(true)} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-[#1E2544]/5 dark:bg-[#1E2544]/60 border border-slate-200 dark:border-[#1F2647] hover:border-emerald-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between">
                <span>Apply for Personal Leave</span>
                <ArrowRight className="h-4 w-4 text-emerald-605 dark:text-emerald-400" />
              </button>
              <button onClick={handleDownloadLatestPayslip} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-[#1E2544]/5 dark:bg-[#1E2544]/60 border border-slate-200 dark:border-[#1F2647] hover:border-emerald-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between">
                <span>Download Salary Payslip</span>
                <ArrowRight className="h-4 w-4 text-emerald-605 dark:text-emerald-400" />
              </button>
              <button onClick={() => setShowTicketModal(true)} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-[#1E2544]/5 dark:bg-[#1E2544]/60 border border-slate-200 dark:border-[#1F2647] hover:border-emerald-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between">
                <span>Raise Helpdesk Support Ticket</span>
                <ArrowRight className="h-4 w-4 text-emerald-605 dark:text-emerald-400" />
              </button>
              <button onClick={() => toast.info('Launching Workforce AI assistant session...')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-[#1E2544]/5 dark:bg-[#1E2544]/60 border border-slate-200 dark:border-[#1F2647] hover:border-emerald-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between">
                <span>Ask AI Workforce Assistant</span>
                <ArrowRight className="h-4 w-4 text-emerald-605 dark:text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Today's schedule info */}
          <div className="glass-card border border-emerald-500/20 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Shift Schedule Calendar</h3>
            <div className="space-y-3 font-mono text-[10px] text-slate-600 dark:text-slate-350">
              <div className="p-3 border border-slate-200 dark:border-[#1F2647] bg-slate-50/25 dark:bg-[#0E1325]/25 rounded-xl space-y-1.5">
                <span className="text-emerald-605 dark:text-emerald-400 font-bold">Standard Day Shift</span>
                <p className="text-slate-500 dark:text-slate-400">Regular hours: 09:00 AM to 06:00 PM</p>
                <div className="flex justify-between border-t border-slate-200/50 dark:border-[#1F2647]/50 pt-1.5 text-[9px] text-slate-550">
                  <span>Weekly Target: 40 hrs</span>
                  <span>Completed: 36.5 hrs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-2 border-b border-slate-200 dark:border-[#1F2647] bg-slate-50/40 dark:bg-[#151A30]/40 rounded-t-2xl px-4 py-2">
          {[['overview', 'My Overview'], ['projects', 'My Projects'], ['leaves', `My Leaves (${leaves.length})`], ['tickets', `Support tickets (${tickets.length})`]].map(([k, l]) => (
            <button key={k} onClick={() => setActiveTab(k)} className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${activeTab === k ? 'border-emerald-555 text-emerald-650 dark:border-emerald-500 dark:text-emerald-450 font-extrabold' : 'border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div className="glass-card rounded-b-2xl border-x border-b border-slate-200 dark:border-[#1F2647] p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest">Recent Activity Logs</p>
              {leaves.length === 0 && tickets.length === 0 ? (
                <div className="text-center py-8 text-slate-450 dark:text-slate-500 text-xs">No active transactions reported yet.</div>
              ) : (
                <div className="space-y-3">
                  {[...leaves.map(l => ({ type: 'leave', d: l })), ...tickets.map(t => ({ type: 'ticket', d: t }))]
                    .sort((a, b) => new Date(b.d.createdAt) - new Date(a.d.createdAt))
                    .slice(0, 5)
                    .map((item, idx) => (
                      <div key={idx} className="p-3 border border-slate-200 dark:border-[#1F2647] bg-slate-50/30 dark:bg-[#0E1325]/30 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-850 dark:text-white">
                            {item.type === 'leave' ? `[Leave] Applied: ${item.d.type} - ${item.d.reason}` : `[Support] ${item.d.subject}`}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-455 mt-1">{new Date(item.d.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${item.type === 'leave' ? LEAVE_BADGE[item.d.status] : TICKET_BADGE[item.d.status]}`}>
                          {item.d.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Leave Logs</h4>
                <Btn onClick={() => setShowLeaveModal(true)}>Apply Leave</Btn>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs divide-y divide-slate-200 dark:divide-[#1F2647]">
                  <thead>
                    <tr className="text-slate-550 dark:text-slate-400 text-left font-mono">
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Duration</th>
                      <th className="pb-3 font-semibold">Reason</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200 font-mono">
                    {leaves.map(l => (
                      <tr key={l._id} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                        <td className="py-3 text-emerald-600 dark:text-emerald-450 font-bold">{l.type}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-350">{new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-350 truncate max-w-xs">{l.reason}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${LEAVE_BADGE[l.status]}`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Support Tickets</h4>
                <Btn onClick={() => setShowTicketModal(true)}>Raise Ticket</Btn>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs divide-y divide-slate-200 dark:divide-[#1F2647]">
                  <thead>
                    <tr className="text-slate-550 dark:text-slate-400 text-left font-mono">
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Subject</th>
                      <th className="pb-3 font-semibold">Details</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200 font-mono">
                    {tickets.map(t => (
                      <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                        <td className="py-3 text-slate-900 dark:text-white font-bold">{t.category}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-350">{t.subject}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-350 truncate max-w-xs">{t.description}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${TICKET_BADGE[t.status]}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Projects & Tasks</h4>
              </div>
              
              <div className="space-y-4">
                <h5 className="font-black text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-emerald-500/20 pb-1">Present / Ongoing</h5>
                {tasks.filter(t => t.status !== 'Completed').length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No ongoing tasks.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tasks.filter(t => t.status !== 'Completed').map(t => (
                      <div key={t._id} className="p-4 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/45 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t.title}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{t.description}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[9px] uppercase tracking-widest font-black">{t.status}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Deadline: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4">
                <h5 className="font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-500/20 pb-1">Previous / Completed</h5>
                {tasks.filter(t => t.status === 'Completed').length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No completed tasks.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tasks.filter(t => t.status === 'Completed').map(t => (
                      <div key={t._id} className="p-4 border border-slate-200 dark:border-[#1F2647] bg-slate-50/20 dark:bg-[#0E1325]/20 rounded-xl space-y-3 opacity-75 hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t.title}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{t.description}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] uppercase tracking-widest font-black">COMPLETED</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Deadline: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leave Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <Modal title="Apply for Leave" onClose={() => setShowLeaveModal(false)}>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <Field label="Leave Type" required>
                <Select value={leaveForm.type} onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value }))}>
                  <option>Casual</option><option>Sick</option><option>Annual</option><option>Maternity</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date" required><Input type="date" required value={leaveForm.startDate} onChange={e => setLeaveForm(f => ({ ...f, startDate: e.target.value }))} /></Field>
                <Field label="End Date" required><Input type="date" required value={leaveForm.endDate} onChange={e => setLeaveForm(f => ({ ...f, endDate: e.target.value }))} /></Field>
              </div>
              <Field label="Reason Details" required>
                <Textarea required value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for leave..." />
              </Field>
              <Btn type="submit" disabled={submitting} className="w-full">Submit request</Btn>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Support Modal */}
      <AnimatePresence>
        {showTicketModal && (
          <Modal title="Raise Support Ticket" onClose={() => setShowTicketModal(false)}>
            <form onSubmit={handleRaiseTicket} className="space-y-4">
              <Field label="Category" required>
                <Select value={ticketForm.category} onChange={e => setTicketForm(f => ({ ...f, category: e.target.value }))}>
                  <option>General</option><option>Hardware</option><option>Software</option><option>Access Request</option>
                </Select>
              </Field>
              <Field label="Subject Summary" required><Input required value={ticketForm.subject} onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))} /></Field>
              <Field label="Details Description">
                <Textarea value={ticketForm.description} onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))} placeholder="Explain the issue..." />
              </Field>
              <Btn type="submit" disabled={submitting} className="w-full">Submit ticket</Btn>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeDashboard;
