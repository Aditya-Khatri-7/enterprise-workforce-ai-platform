import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
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

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SUPER ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const SuperAdminDashboard = () => {
  const roleColors = ['#A855F7', '#3B82F6', '#14B8A6', '#F97316', '#06B6D4', '#EAB308', '#EF4444', '#64748B'];
  
  const roleDistribution = [
    { name: 'Super Admin', value: 3 },
    { name: 'Org Admin', value: 12 },
    { name: 'HR Manager', value: 24 },
    { name: 'Dept Manager', value: 30 },
    { name: 'Team Lead', value: 45 },
    { name: 'Employee', value: 120 },
    { name: 'Finance', value: 8 },
    { name: 'IT Admin', value: 5 }
  ];

  const recentAudits = [
    { time: '12:04:12', user: 'super_admin', event: 'Rotated global SSL API secrets', status: 'success' },
    { time: '11:45:00', user: 'finance_lead', event: 'Initiated monthly payroll dispatch', status: 'success' },
    { time: '11:32:18', user: 'hr_manager', event: 'Created employee file [EMP_884]', status: 'success' },
    { time: '11:15:45', user: 'it_admin', event: 'Assigned asset ASST_889 to Karan Patel', status: 'success' },
    { time: '10:55:12', user: 'org_admin', event: 'Onboarded department [R&D]', status: 'success' },
    { time: '10:44:00', user: 'super_admin', event: 'Suspended legacy org node [TechM]', status: 'success' },
    { time: '10:12:30', user: 'auditor', event: 'Exported security logs [Q2]', status: 'success' },
    { time: '09:55:00', user: 'system', event: 'Triggered DB replica shard replication', status: 'success' },
    { time: '09:30:15', user: 'it_admin', event: 'Reset password for Sneakers_Lead', status: 'success' },
    { time: '09:00:00', user: 'system', event: 'Performed automatic daily health checklist', status: 'success' }
  ];

  const departmentBreakdown = [
    { name: 'Engineering', headcount: 85, manager: 'Arjun Mehta', projects: 8 },
    { name: 'Finance', headcount: 14, manager: 'Sneha Gupta', projects: 3 },
    { name: 'Human Resources', headcount: 12, manager: 'Riya Sharma', projects: 2 },
    { name: 'Operations', headcount: 45, manager: 'Amit Verma', projects: 3 },
    { name: 'Information Technology', headcount: 18, manager: 'Marcus Vane', projects: 2 }
  ];

  return (
    <div className="space-y-6 text-slate-800 dark:text-white">
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
        <StatCard label="Total Employees" value="247" colorAccent="purple" icon={Users} desc="Org-wide Headcount" />
        <StatCard label="Departments" value="12" colorAccent="purple" icon={Layers} desc="Across 4 Locations" />
        <StatCard label="Active Projects" value="18" colorAccent="purple" icon={Activity} desc="In Active Sprint" />
        <StatCard label="Open Support Tickets" value="34" colorAccent="purple" icon={ShieldAlert} desc="IT / HR Pipelines" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side Table & Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Breakdown */}
          <div className="glass-card border border-purple-200 dark:border-purple-500/20 rounded-2xl p-5">
            <h3 className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-4">Department breakdown metric</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 text-left">
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Headcount</th>
                    <th className="pb-3 font-semibold">Manager</th>
                    <th className="pb-3 font-semibold">Active Projects</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200">
                  {departmentBreakdown.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{d.name}</td>
                      <td className="py-3">{d.headcount} Members</td>
                      <td className="py-3 text-purple-700 dark:text-purple-300 font-semibold">{d.manager}</td>
                      <td className="py-3 font-mono">{d.projects} Projects</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Audit Log Feed */}
          <div className="glass-card border border-purple-200 dark:border-purple-500/20 rounded-2xl p-5">
            <h3 className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-4">Core Platform Audit Logs</h3>
            <div className="space-y-3 font-mono text-[10px] text-slate-600 dark:text-slate-350">
              {recentAudits.map((a, i) => (
                <div key={i} className="p-2.5 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/40 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-purple-750 dark:text-purple-400 font-bold">&gt; {a.time}</span>
                    <span className="text-slate-800 dark:text-white ml-2">[{a.user}]</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">{a.event}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20 uppercase font-black tracking-wider text-[8px]">{a.status}</span>
                </div>
              ))}
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

          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-[#1F2647] pt-4">
            {roleDistribution.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 font-mono">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: roleColors[i % roleColors.length] }} />
                <span>{r.name}: <span className="text-slate-900 dark:text-white font-bold">{r.value}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ORG ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const OrgAdminDashboard = () => {
  const [modalType, setModalType] = useState(null); // 'dept' | 'desig' | 'holiday' | 'shift'
  const [departments, setDepartments] = useState([
    { name: 'Engineering', manager: 'Arjun Mehta', headcount: 85, status: 'Active' },
    { name: 'Finance', manager: 'Sneha Gupta', headcount: 14, status: 'Active' },
    { name: 'Human Resources', manager: 'Riya Sharma', headcount: 12, status: 'Active' },
    { name: 'IT Support', manager: 'Marcus Vane', headcount: 18, status: 'Active' },
    { name: 'Operations', manager: 'Amit Verma', headcount: 45, status: 'Active' }
  ]);

  const [alerts, setAlerts] = useState([
    { text: 'Missing organization secondary recovery email', type: 'warning' },
    { text: 'Enforcement of Multi-Factor Authentication pending', type: 'critical' },
    { text: 'Q3 compliance policies signature pending', type: 'info' }
  ]);

  const handleCreateDept = (e) => {
    e.preventDefault();
    const name = e.target.deptName.value;
    const manager = e.target.deptManager.value;
    if (!name || !manager) return;
    setDepartments([...departments, { name, manager, headcount: 1, status: 'Active' }]);
    toast.success('Department created successfully!');
    setModalType(null);
  };

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
              <button onClick={() => setAlerts(alerts.filter((_, i) => i !== idx))} className="hover:text-slate-900 dark:hover:text-white font-bold">&times;</button>
            </div>
          ))}
        </div>
      )}

      {/* Grid KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Locations" value="3 Offices" colorAccent="blue" icon={Layers} desc="Bangalore, London, NY" />
        <StatCard label="Corporate Holidays" value="14 Days" colorAccent="blue" icon={Calendar} desc="Year 2026 Calendar" />
        <StatCard label="Total Designations" value="18 Profiles" colorAccent="blue" icon={Award} desc="Grade Scale Levels" />
        <StatCard label="Staff Shifts" value="4 Active" colorAccent="blue" icon={Clock} desc="24/7 Ops Coverage" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Tree & Card Layouts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Org tree structure visual */}
          <div className="glass-card border border-blue-500/20 rounded-2xl p-5">
            <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">Corporate Hierarchy Tree</h3>
            <div className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-blue-500/10 bg-slate-50/50 dark:bg-[#0E1325]/30 rounded-xl relative">
              <div className="px-5 py-2.5 bg-blue-600 border border-blue-500 rounded-xl font-black text-xs uppercase shadow text-center text-white">TechNova Global Head</div>
              
              {/* Vertical link line */}
              <div className="h-8 w-0.5 bg-blue-500/40 my-1" />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full pt-1">
                {departments.slice(0, 3).map((d, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="h-4 w-0.5 bg-blue-500/40" />
                    <div className="w-full p-3 bg-white dark:bg-[#1A203E]/80 border border-slate-200 dark:border-blue-500/20 rounded-xl text-center text-xs font-semibold shadow-sm">
                      <p className="font-bold text-slate-800 dark:text-white uppercase">{d.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Mgr: {d.manager}</p>
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
              <button onClick={() => setModalType('dept')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all"><Plus className="h-3.5 w-3.5" /> New Dept</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((d, i) => (
                <div key={i} className="p-4 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/40 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{d.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Manager: <span className="text-blue-700 dark:text-blue-300 font-semibold">{d.manager}</span></p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Headcount: <span className="text-slate-850 dark:text-white font-bold">{d.headcount}</span></p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20 text-[9px] uppercase tracking-widest font-black">{d.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel Actions & Locations */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="glass-card border border-blue-500/20 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Global Administrative Actions</h3>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => setModalType('dept')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-blue-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-[#1F2647] hover:border-blue-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between"><span>Create New Department</span><ArrowRight className="h-4 w-4 text-blue-655 dark:text-blue-400" /></button>
              <button onClick={() => setModalType('desig')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-blue-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-[#1F2647] hover:border-blue-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between"><span>Configure Designations</span><ArrowRight className="h-4 w-4 text-blue-655 dark:text-blue-400" /></button>
              <button onClick={() => setModalType('holiday')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-blue-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-[#1F2647] hover:border-blue-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between"><span>Set Corporate Holiday</span><ArrowRight className="h-4 w-4 text-blue-655 dark:text-blue-400" /></button>
              <button onClick={() => setModalType('shift')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-blue-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-blue-600/10 border border-slate-200 dark:border-[#1F2647] hover:border-blue-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between"><span>Modify Roster Work Shifts</span><ArrowRight className="h-4 w-4 text-blue-655 dark:text-blue-400" /></button>
            </div>
          </div>

          {/* Office Locations */}
          <div className="glass-card border border-blue-500/20 rounded-2xl p-5">
            <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">Office Location Nodes</h3>
            <div className="space-y-3 font-mono text-[10px] text-slate-600 dark:text-slate-350">
              <div className="p-2.5 border border-slate-200 dark:border-[#1F2647] bg-slate-50/30 dark:bg-[#0E1325]/20 rounded-xl">
                <span className="text-blue-700 dark:text-blue-400 font-bold">BANGALORE HQ (Primary)</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">E-City Outer Ring, Block D, Bangalore, KA</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Total Employees: 180</p>
              </div>
              <div className="p-2.5 border border-slate-200 dark:border-[#1F2647] bg-slate-50/30 dark:bg-[#0E1325]/20 rounded-xl">
                <span className="text-blue-700 dark:text-blue-400 font-bold">LONDON TECH (Branch Office)</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">32 Finsbury Square, London, EC2A 1DX</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Total Employees: 45</p>
              </div>
              <div className="p-2.5 border border-slate-200 dark:border-[#1F2647] bg-slate-50/30 dark:bg-[#0E1325]/20 rounded-xl">
                <span className="text-blue-700 dark:text-blue-400 font-bold">NEW YORK SALON (Hub)</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Times Square Broadway Plaza, Suite 4B, NY</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Total Employees: 22</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Local Modals */}
      <AnimatePresence>
        {modalType === 'dept' && (
          <LocalModal title="Add New Department" onClose={() => setModalType(null)}>
            <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Department Name</label>
                <input name="deptName" required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Research and Development" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Department Manager</label>
                <input name="deptManager" required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Elena Rostova" />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all">Submit Entry</button>
              </div>
            </form>
          </LocalModal>
        )}

        {modalType === 'desig' && (
          <LocalModal title="Add New Designation" onClose={() => setModalType(null)}>
            <form onSubmit={(e) => { e.preventDefault(); toast.success('Designation Added!'); setModalType(null); }} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Designation Title</label>
                <input required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Lead Devops Architect" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Grade Level</label>
                <select className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
                  <option>Grade L1 - Entry</option>
                  <option>Grade L2 - Intermediate</option>
                  <option>Grade L3 - Specialist</option>
                  <option>Grade L4 - Director</option>
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all">Submit Designation</button>
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
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all">Save Calendar</button>
              </div>
            </form>
          </LocalModal>
        )}

        {modalType === 'shift' && (
          <LocalModal title="Configure Work Shifts" onClose={() => setModalType(null)}>
            <form onSubmit={(e) => { e.preventDefault(); toast.success('Shifts Configured!'); setModalType(null); }} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Shift Name</label>
                <input required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" placeholder="e.g. EMEA Night Shift" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">Start Time</label>
                  <input required type="time" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">End Time</label>
                  <input required type="time" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all">Apply Config</button>
              </div>
            </form>
          </LocalModal>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. HR MANAGER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const HRManagerDashboard = () => {
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

  return (
    <div className="space-y-6 text-slate-800 dark:text-white">
      {/* Grid KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Recruitment Pipeline" value="180 Candidates" colorAccent="teal" icon={Users} desc="All Active Openings" />
        <StatCard label="Active Leaves" value="12 Members" colorAccent="teal" icon={Calendar} desc="This Week Roster" />
        <StatCard label="Open Job Postings" value="6 Roles" colorAccent="teal" icon={Briefcase} desc="3 Referral Bonuses Active" />
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
        {/* Left Side: Leaves and New Joiners */}
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
                      <button onClick={() => handleLeaveAction(l._id, 'Approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2.5 py-1 rounded transition-all">Approve</button>
                      <button onClick={() => handleLeaveAction(l._id, 'Rejected')} className="bg-red-500 hover:bg-red-650 text-white font-bold text-[9px] px-2.5 py-1 rounded transition-all">Reject</button>
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

        {/* Right Side Alerts and Quick Links */}
        <div className="space-y-6">
          {/* Quick links */}
          <div className="glass-card border border-teal-500/20 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest">HR Shortcuts</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => toast.info('Navigating to Add Employee workflow...')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-teal-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-teal-650/10 border border-slate-200 dark:border-[#1F2647] hover:border-teal-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between"><span>Onboard New Employee</span><ArrowRight className="h-4 w-4 text-teal-655 dark:text-teal-400" /></button>
              <button onClick={() => toast.info('Navigating to Job Postings...')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-teal-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-teal-650/10 border border-slate-200 dark:border-[#1F2647] hover:border-teal-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between"><span>Post Job Vacancy</span><ArrowRight className="h-4 w-4 text-teal-655 dark:text-teal-400" /></button>
              <button onClick={() => toast.info('Navigating to Payroll Registry...')} className="w-full text-left py-2.5 px-4 bg-slate-50 hover:bg-teal-500/5 dark:bg-[#1E2544]/60 dark:hover:bg-teal-650/10 border border-slate-200 dark:border-[#1F2647] hover:border-teal-500/40 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-white flex items-center justify-between"><span>Run Staff Payroll</span><ArrowRight className="h-4 w-4 text-teal-655 dark:text-teal-400" /></button>
            </div>
          </div>

          {/* Attendance Alerts */}
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
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. DEPARTMENT MANAGER DASHBOARD (Orange)
// ═══════════════════════════════════════════════════════════════════════════════
const ManagerDashboard = () => {
  const { progressStore } = useContext(DemoProgressContext);
  const [expandedTeam, setExpandedTeam] = useState(null); // 'arjun' | 'sneha' | null
  
  // Pending leaves in local state
  const [leaves, setLeaves] = useState([
    { id: 1, name: 'Riya Sharma', type: 'Sick Leave', dates: '2026-07-06 to 2026-07-08', status: 'Pending' },
    { id: 2, name: 'Amit Verma', type: 'Earned Leave', dates: '2026-07-10 to 2026-07-12', status: 'Pending' }
  ]);

  const handleLeaveAction = (id, status) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, status } : l));
    toast.success(`Request ${status} successfully`);
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

  const teams = [
    {
      id: 'arjun',
      name: 'Arjun Mehta',
      designation: 'Tech Lead / Eng Lead',
      project: 'Employee Portal v2',
      deadline: '2026-08-15',
      progress: arjunProgress,
      size: 3,
      avatar: 'AM',
      employees: [
        { name: 'Riya Sharma', task: 'API Integration', progress: progressStore['riya_sharma'] || 65, status: 'In Progress' },
        { name: 'Karan Patel', task: 'UI Components', progress: progressStore['karan_patel'] || 80, status: 'Completed' },
        { name: 'Priya Singh', task: 'Testing', progress: progressStore['priya_singh'] || 40, status: 'To Do' }
      ]
    },
    {
      id: 'sneha',
      name: 'Sneha Gupta',
      designation: 'Tech Lead / DB Lead',
      project: 'Payroll Automation',
      deadline: '2026-09-01',
      progress: snehaProgress,
      size: 3,
      avatar: 'SG',
      employees: [
        { name: 'Amit Verma', task: 'DB Schema', progress: progressStore['amit_verma'] || 90, status: 'Review' },
        { name: 'Neha Joshi', task: 'Backend APIs', progress: progressStore['neha_joshi'] || 55, status: 'In Progress' },
        { name: 'Rohit Das', task: 'Frontend', progress: progressStore['rohit_das'] || 30, status: 'To Do' }
      ]
    }
  ];

  return (
    <div className="space-y-6 text-slate-800 dark:text-white">
      {/* Top statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Department" value="Engineering" colorAccent="orange" icon={Briefcase} desc="Platform Unit" />
        <StatCard label="Total Subordinates" value="8 Employees" colorAccent="orange" icon={Users} desc="2 Team Leads" />
        <StatCard label="Unit Leave Rate" value="94.2%" colorAccent="orange" icon={Calendar} desc="Attendance Week Stats ↑ 1.4%" />
        <StatCard label="Unit Projects" value="2 Running" colorAccent="orange" icon={Activity} desc="sprint v2.1" />
      </div>

      {/* MY TEAMS section */}
      <div className="glass-card border border-orange-500/20 rounded-2xl p-5">
        <h3 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-4">My Supervised Teams</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((t, idx) => (
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
                  <span className="font-bold text-slate-750 dark:text-slate-350">{t.project}</span>
                  <span className="font-semibold text-orange-750 dark:text-orange-355 text-[10px] font-mono">End: {t.deadline}</span>
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
                <p className="text-[10px] text-slate-500">Team Size: {t.size} Developers</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setExpandedTeam(expandedTeam === t.id ? null : t.id)}
                  className="w-full text-center py-2 bg-orange-600/10 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-500/20 hover:border-transparent rounded-xl text-xs font-bold transition-all"
                >
                  {expandedTeam === t.id ? 'Hide Team Members' : 'View Team Roster'}
                </button>
              </div>

              {/* Collapsed Team Roster */}
              {expandedTeam === t.id && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-[#1F2647] animate-fade-in font-mono text-[10px]">
                  {t.employees.map((emp, i) => (
                    <div key={i} className="p-2.5 bg-white dark:bg-[#0A0D1A]/50 border border-slate-200 dark:border-[#1F2647] rounded-xl space-y-2 shadow-sm">
                      <div className="flex justify-between items-center font-sans">
                        <span className="font-bold text-slate-900 dark:text-white">{emp.name}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] uppercase tracking-wider font-bold ${emp.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : emp.status === 'In Progress' ? 'bg-blue-500/10 text-blue-750 dark:text-blue-400 border border-blue-500/20' : emp.status === 'Review' ? 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border border-yellow-500/20' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'}`}>{emp.status}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-450 text-[9px] font-sans">&gt; Task: {emp.task}</p>
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

      {/* Project Assignment Flow Widget (Problem 4) */}
      <div className="glass-card border border-orange-500/20 rounded-2xl p-5">
        <h3 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-4">Project Assignment Chain Diagram</h3>
        <div className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-orange-500/10 bg-slate-50/50 dark:bg-[#0E1325]/30 rounded-xl text-xs space-y-4">
          <div className="px-5 py-2.5 bg-orange-600 border border-orange-500 rounded-xl font-black uppercase text-center text-white">Department Manager (You)</div>
          
          <div className="flex flex-col items-center">
            <span className="text-orange-500 text-lg">↓</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Assigns Project</span>
          </div>

          <div className="px-5 py-2.5 bg-white dark:bg-[#1F2647] border border-slate-200 dark:border-orange-500/20 rounded-xl font-bold uppercase text-center text-slate-800 dark:text-slate-100 shadow-sm">Team Lead: Arjun Mehta <span className="text-[10px] text-orange-655 dark:text-orange-355 ml-2 font-mono">Project: Employee Portal v2</span></div>

          <div className="flex flex-col items-center">
            <span className="text-orange-500 text-lg">↓</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Assigns Subtasks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full text-[10px] font-mono">
            <div className="p-2.5 border border-slate-200 dark:border-[#1F2647] bg-white dark:bg-[#0A0D1A]/50 rounded-xl text-center shadow-sm">
              <p className="font-bold text-slate-900 dark:text-white font-sans">Riya Sharma</p>
              <p className="text-slate-500 dark:text-slate-400 text-[9px] mt-1 font-sans">API Integration</p>
              <p className="text-orange-700 dark:text-orange-450 font-bold mt-1">{progressStore['riya_sharma'] || 65}% Completed</p>
            </div>
            <div className="p-2.5 border border-slate-200 dark:border-[#1F2647] bg-white dark:bg-[#0A0D1A]/50 rounded-xl text-center shadow-sm">
              <p className="font-bold text-slate-900 dark:text-white font-sans">Karan Patel</p>
              <p className="text-slate-500 dark:text-slate-400 text-[9px] mt-1 font-sans">UI Components</p>
              <p className="text-orange-700 dark:text-orange-450 font-bold mt-1">{progressStore['karan_patel'] || 80}% Completed</p>
            </div>
            <div className="p-2.5 border border-slate-200 dark:border-[#1F2647] bg-white dark:bg-[#0A0D1A]/50 rounded-xl text-center shadow-sm">
              <p className="font-bold text-slate-900 dark:text-white font-sans">Priya Singh</p>
              <p className="text-slate-500 dark:text-slate-400 text-[9px] mt-1 font-sans">Testing</p>
              <p className="text-orange-700 dark:text-orange-450 font-bold mt-1">{progressStore['priya_singh'] || 40}% Completed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project progress table */}
        <div className="lg:col-span-2 glass-card border border-orange-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-4">Project Progress Overview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-left">
                  <th className="pb-3 font-semibold">Project Name</th>
                  <th className="pb-3 font-semibold">Team Lead</th>
                  <th className="pb-3 font-semibold">Tasks Completed</th>
                  <th className="pb-3 font-semibold">Progress Bar</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200">
                {teams.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">{t.project}</td>
                    <td className="py-3.5 text-orange-700 dark:text-orange-300 font-semibold">{t.name}</td>
                    <td className="py-3.5 font-mono">3 / 3</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-bold font-mono">{t.progress}%</span>
                        <div className="w-24 bg-slate-200 dark:bg-slate-900 border border-slate-350 dark:border-[#1F2647] h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: `${t.progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5"><span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-700 dark:text-orange-450 border border-orange-500/20 text-[9px] uppercase font-black font-mono">In Progress</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Approvals compact list */}
        <div className="glass-card border border-orange-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-4">Leave Approvals Pending</h3>
          <div className="space-y-3">
            {leaves.filter(l => l.status === 'Pending').length === 0 ? (
              <p className="text-[10px] text-slate-400 italic py-4 text-center">No pending leave claims.</p>
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
                    <button onClick={() => handleLeaveAction(l.id, 'Approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-[9px] transition-all">Approve</button>
                    <button onClick={() => handleLeaveAction(l.id, 'Rejected')} className="bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/40 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold py-1.5 rounded-lg text-[9px] transition-all">Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. TEAM LEAD DASHBOARD (Cyan)
// ═══════════════════════════════════════════════════════════════════════════════
const TeamLeadDashboard = () => {
  const { progressStore, setProgress } = useContext(DemoProgressContext);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Local Kanban tasks state
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'API Integration', assignee: 'Riya Sharma', priority: 'High', deadline: '2026-07-15', status: 'In Progress' },
    { id: 't2', title: 'UI Components', assignee: 'Karan Patel', priority: 'Medium', deadline: '2026-07-20', status: 'Completed' },
    { id: 't3', title: 'Testing', assignee: 'Priya Singh', priority: 'Low', deadline: '2026-07-30', status: 'To Do' },
    { id: 't4', title: 'Database schema configuration', assignee: 'Riya Sharma', priority: 'High', deadline: '2026-07-08', status: 'Review' },
    { id: 't5', title: 'Production build script setup', assignee: 'Karan Patel', priority: 'Medium', deadline: '2026-07-10', status: 'Blocked' }
  ]);

  // Sync tasks dynamically with context progress values
  const riyaProgress = progressStore['riya_sharma'] !== undefined ? progressStore['riya_sharma'] : 65;
  const karanProgress = progressStore['karan_patel'] !== undefined ? progressStore['karan_patel'] : 80;
  const priyaProgress = progressStore['priya_singh'] !== undefined ? progressStore['priya_singh'] : 40;

  const teamProgressData = [
    { name: 'Riya Sharma', percentage: riyaProgress },
    { name: 'Karan Patel', percentage: karanProgress },
    { name: 'Priya Singh', percentage: priyaProgress }
  ];

  const overallProgress = Math.round((riyaProgress + karanProgress + priyaProgress) / 3);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: targetColumn } : t));
    
    // Automatically adjust employee progress in sync store if completed
    const droppedTask = tasks.find(t => t.id === taskId);
    if (droppedTask && targetColumn === 'Completed') {
      const empMap = {
        'Riya Sharma': 'riya_sharma',
        'Karan Patel': 'karan_patel',
        'Priya Singh': 'priya_singh'
      };
      const empId = empMap[droppedTask.assignee];
      if (empId) {
        setProgress(empId, droppedTask.id, 100);
        toast.success(`Task marked as Completed! ${droppedTask.assignee}'s progress updated to 100%`);
      }
    } else {
      toast.success(`Task moved to ${targetColumn}`);
    }
  };

  // Add Task Modal Submit Handler
  const handleAssignTaskSubmit = (e) => {
    e.preventDefault();
    const title = e.target.taskName.value;
    const assignee = e.target.assignTo.value;
    const priority = e.target.priority.value;
    const deadline = e.target.deadline.value;
    
    if (!title || !assignee) return;

    const newTask = {
      id: `tsk_${Math.random()}`,
      title,
      assignee,
      priority,
      deadline,
      status: 'To Do'
    };

    setTasks([...tasks, newTask]);
    setShowAssignModal(false);
    toast.success(`Assigned task "${title}" to ${assignee}!`);
  };

  const columns = ['To Do', 'In Progress', 'Review', 'Completed', 'Blocked'];

  return (
    <div className="space-y-6 text-slate-800 dark:text-white">
      {/* prominent project card at top */}
      <div className="glass-card border border-cyan-500/25 rounded-3xl p-6 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[9px] uppercase tracking-widest font-black">Project Leader Command</span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Employee Portal v2</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Sprint milestone deadlines: <span className="text-cyan-650 dark:text-cyan-300 font-bold">2026-08-15</span> · Status: <span className="text-cyan-650 dark:text-cyan-300 uppercase tracking-widest font-bold font-mono">In Progress</span></p>
          </div>
          <div className="flex items-center gap-4">
            {/* Custom Pie Chart Progress Circle */}
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
              <p className="text-sm font-black mt-0.5 text-slate-850 dark:text-white">Project Complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of employee cards */}
      <div className="glass-card border border-cyan-500/20 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest">My Development Team</h3>
          <button onClick={() => setShowAssignModal(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all"><Plus className="h-3.5 w-3.5" /> Assign Task</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {teamProgressData.map((t, idx) => (
            <div key={idx} className="p-4 border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/45 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/35 rounded-lg flex items-center justify-center font-bold text-xs">{t.name.split(' ').map(n=>n[0]).join('')}</div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{t.name}</h4>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400">Software Developer</p>
                </div>
              </div>
              
              {/* Task Detail */}
              <div className="text-[10px] space-y-1.5 border-t border-slate-200 dark:border-[#1F2647] pt-2">
                <p className="text-slate-500 dark:text-slate-400 flex justify-between"><span>Current Task:</span><span className="text-slate-850 dark:text-white font-semibold">{tasks.find(ts=>ts.assignee === t.name)?.title || 'No Task Assigned'}</span></p>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] text-slate-450 dark:text-slate-500"><span>Progress</span><span>{t.percentage}%</span></div>
                  <div className="w-full bg-slate-200 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ width: `${t.percentage}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="glass-card border border-cyan-500/20 rounded-2xl p-5 overflow-hidden">
        <h3 className="text-xs font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest mb-4">Sprint Kanban Board</h3>
        <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-2">
          {columns.map((col, idx) => {
            const colTasks = tasks.filter(t => t.status === col);
            return (
              <div
                key={idx}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col)}
                className="flex-1 min-w-[200px] bg-slate-50/50 dark:bg-[#0E1325]/45 border border-slate-200 dark:border-[#1F2647] rounded-xl p-3 flex flex-col space-y-3 min-h-[300px]"
              >
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#1F2647] pb-2">
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider">{col}</span>
                  <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 text-[8px] font-black rounded-md">{colTasks.length}</span>
                </div>

                <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      className="p-3 bg-white dark:bg-[#151A30] border border-slate-200 dark:border-cyan-500/10 hover:border-cyan-500/30 rounded-lg cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all space-y-2 text-[10px]"
                    >
                      <h5 className="font-bold text-slate-850 dark:text-white text-[11px] leading-tight font-sans">{t.title}</h5>
                      <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400">
                        <span>Assignee: <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{t.assignee.split(' ')[0]}</span></span>
                        <span className={`px-1.5 py-0.2 rounded font-black text-[8px] tracking-widest uppercase ${t.priority === 'High' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : t.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-400' : 'bg-green-500/10 text-green-700 dark:text-green-400'}`}>{t.priority}</span>
                      </div>
                      <p className="text-[8px] text-slate-400 dark:text-slate-500 font-mono">Date: {t.deadline}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Progress Summary Chart */}
      <div className="glass-card border border-cyan-500/20 rounded-2xl p-5">
        <h3 className="text-xs font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest mb-4">Developer Task Progress Metrics</h3>
        <div className="h-48 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamProgressData}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#151A30', borderColor: '#06B6D4' }} />
              <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                {teamProgressData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#06B6D4' : index === 1 ? '#3B82F6' : '#6366F1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assign Task Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <LocalModal title="Assign Task" onClose={() => setShowAssignModal(false)}>
            <form onSubmit={handleAssignTaskSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Task Name</label>
                <input name="taskName" required type="text" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. Audit Secure Cookies rotation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">Assign To</label>
                  <select name="assignTo" className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500">
                    <option>Riya Sharma</option>
                    <option>Karan Patel</option>
                    <option>Priya Singh</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">Priority Level</label>
                  <select name="priority" className="w-full bg-slate-50 dark:bg-[#0E1325] border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-slate-400 font-semibold">Task Deadline</label>
                <input name="deadline" required type="date" className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 rounded-xl transition-all">Submit Task Assignment</button>
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
  const salaryTable = [
    { id: 'EMP_101', name: 'Arjun Mehta', dept: 'Engineering', basic: 75000, hra: 30000, bonus: 15000, deduct: 8500, net: 111500 },
    { id: 'EMP_102', name: 'Sneha Gupta', dept: 'Engineering', basic: 72000, hra: 28800, bonus: 12000, deduct: 8200, net: 104600 },
    { id: 'EMP_103', name: 'Riya Sharma', dept: 'HR & Recruiting', basic: 55000, hra: 22000, bonus: 8000, deduct: 5500, net: 79500 },
    { id: 'EMP_104', name: 'Marcus Vane', dept: 'IT Operations', basic: 68000, hra: 27200, bonus: 10000, deduct: 7500, net: 97700 },
    { id: 'EMP_105', name: 'Elena Rostova', dept: 'Compliance', basic: 60000, hra: 24000, bonus: 9000, deduct: 6200, net: 86800 },
    { id: 'EMP_106', name: 'Karan Patel', dept: 'Engineering', basic: 45050, hra: 18020, bonus: 5000, deduct: 4800, net: 63270 },
    { id: 'EMP_107', name: 'Priya Singh', dept: 'Engineering', basic: 45050, hra: 18020, bonus: 5000, deduct: 4800, net: 63270 },
    { id: 'EMP_108', name: 'Amit Verma', dept: 'Operations', basic: 48000, hra: 19200, bonus: 6000, deduct: 5000, net: 68200 },
    { id: 'EMP_109', name: 'Neha Joshi', dept: 'Operations', basic: 48000, hra: 19200, bonus: 6000, deduct: 5000, net: 68200 },
    { id: 'EMP_110', name: 'Rohit Das', dept: 'Operations', basic: 46000, hra: 18400, bonus: 5000, deduct: 4900, net: 64500 }
  ];

  const taxAllocation = [
    { name: 'Engineering', amount: 480000 },
    { name: 'Operations', amount: 280000 },
    { name: 'IT Support', amount: 150000 },
    { name: 'Finance Unit', amount: 120000 },
    { name: 'Human Res.', amount: 98000 }
  ];

  return (
    <div className="space-y-6 text-slate-800 dark:text-white">
      {/* Top statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Monthly Gross Payout" value="₹18,43,500" colorAccent="yellow" icon={DollarSign} desc="Basic + HRA + Allowances" />
        <StatCard label="Total Deductions" value="₹2,10,400" colorAccent="yellow" icon={ShieldAlert} desc="Provident Fund / TDS" />
        <StatCard label="Net Disbursed" value="₹16,33,100" colorAccent="yellow" icon={CheckCircle} desc="Transferred to Staff Accounts" />
        <StatCard label="Processing Status" value="198 / 247 Paid" colorAccent="yellow" icon={Clock} desc="49 In Final Verification" />
      </div>

      {/* Pipeline step tracker */}
      <div className="glass-card border border-yellow-500/20 rounded-2xl p-5">
        <h3 className="text-xs font-black text-yellow-750 dark:text-yellow-400 uppercase tracking-widest mb-4">Payroll Pipeline Execution</h3>
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
          <h3 className="text-xs font-black text-yellow-750 dark:text-yellow-400 uppercase tracking-widest mb-4">Corporate Salary Register</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                  <th className="pb-3 font-semibold">Staff ID</th>
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Basic (₹)</th>
                  <th className="pb-3 font-semibold">HRA (₹)</th>
                  <th className="pb-3 font-semibold">Deductions (₹)</th>
                  <th className="pb-3 font-semibold">Net Salary (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200 font-mono">
                {salaryTable.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                    <td className="py-2.5 text-yellow-800 dark:text-yellow-400 font-bold">{s.id}</td>
                    <td className="py-2.5 text-slate-900 dark:text-white font-bold">{s.name}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-450">{s.dept}</td>
                    <td className="py-2.5">{s.basic.toLocaleString()}</td>
                    <td className="py-2.5">{s.hra.toLocaleString()}</td>
                    <td className="py-2.5 text-red-650 dark:text-red-400">-{s.deduct.toLocaleString()}</td>
                    <td className="py-2.5 text-emerald-600 dark:text-emerald-400 font-bold">{s.net.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tax allocation chart */}
        <div className="glass-card border border-yellow-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-yellow-750 dark:text-yellow-400 uppercase tracking-widest mb-4">Departmental Tax Allocations</h3>
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

  const activeRole = isDemoMode ? demoRole : user?.role;

  switch (activeRole) {
    case 'Super Admin':         return <SuperAdminDashboard />;
    case 'Organization Admin':  return <OrgAdminDashboard />;
    case 'HR Manager':          return <HRManagerDashboard />;
    case 'IT Administrator':    return <ITAdminDashboard />;
    case 'Auditor':             return <AuditorDashboard />;
    case 'Finance':             return <FinanceDashboard />;
    case 'Team Lead':           return <TeamLeadDashboard />;
    case 'Manager':             return <ManagerDashboard />;
    default:
      return (
        <div className="flex h-64 items-center justify-center text-red-500 text-xl font-bold">
          Unauthorized Access Dashboard
        </div>
      );
  }
};

export default AdminDashboard;
