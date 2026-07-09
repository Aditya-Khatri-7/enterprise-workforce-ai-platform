import React, { useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Download, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

const inputCls = "block w-full border border-indigo-500/20 dark:border-indigo-500/20 bg-white/40 dark:bg-[#0B1023]/40 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-400";
const Input = (props) => <input {...props} className={inputCls} />;
const Textarea = (props) => <textarea {...props} className={`${inputCls} resize-none`} />;

const Field = ({ label, hint, children }) => (
  <div className="space-y-1">
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-gray-700 dark:text-slate-405 font-medium">{hint}</p>}
  </div>
);

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick}
    className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors whitespace-nowrap ${active ? 'border-indigo-600 text-indigo-600 dark:text-cyan-400 font-extrabold' : 'border-transparent text-slate-700 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white'}`}>
    {children}
  </button>
);

const Pill = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/50 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
    {label}
    {onRemove && (
      <button type="button" onClick={onRemove} className="text-indigo-400 hover:text-indigo-700 leading-none font-bold text-xs">&times;</button>
    )}
  </span>
);

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const emp = user?.employeeRef || {};
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(
    location.state?.forcePasswordChange ? 'password' : 'personal'
  );
  const [saving, setSaving] = useState(false);

  // Forms state
  const [form, setForm] = useState({
    firstName: emp.firstName || '',
    lastName: emp.lastName || '',
    mobile: emp.mobile || '',
    address: emp.address || '',
    emergencyContact: emp.emergencyContact || '',
  });

  const [skills, setSkills] = useState(emp.skills || []);
  const [skillInput, setSkillInput] = useState('');

  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  // Preferences form state
  const [prefs, setPrefs] = useState({
    emailNotif: true,
    weeklyDigest: false,
    securityAlerts: true,
  });

  // Salary & Payslip states
  const [payrolls, setPayrolls] = useState([]);
  const [loadingPayrolls, setLoadingPayrolls] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputePayroll, setDisputePayroll] = useState(null);
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const [reqSalaryAmount, setReqSalaryAmount] = useState('');
  const [reqSalaryReason, setReqSalaryReason] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const fetchPayrolls = async () => {
    setLoadingPayrolls(true);
    try {
      const { data } = await api.get('/enterprise/payrolls');
      setPayrolls(data);
    } catch (e) {
      toast.error('Failed to load payroll history');
    } finally {
      setLoadingPayrolls(false);
    }
  };

  const generatePayslipPDF = (payroll) => {
    const orgName = user?.organization?.name || 'EWAP Corporate';
    const portalName = 'EWAP Portal';
    const tagLine = 'Great Place to Work';
    
    const empName = `${form.firstName || user?.username} ${form.lastName}`.trim();
    const empId = emp.employeeId || 'N/A';
    const designation = emp.designation || 'Staff Member';
    const role = roleName;
    const department = emp.department || 'N/A';
    
    const baseSalary = payroll.baseSalary || 0;
    const allowances = payroll.allowances || 0;
    const deductions = payroll.deductions || 0;
    const netSalary = payroll.netSalary || 0;
    const period = `${payroll.month} ${payroll.year}`;
    
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
              <td class="details-value">${payroll.status || 'Paid'}</td>
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
  };

  useEffect(() => {
    if (activeTab === 'salary') {
      fetchPayrolls();
    }
  }, [activeTab]);

  const handleRequestRevisionSubmit = async (e) => {
    e.preventDefault();
    if (!reqSalaryAmount || !reqSalaryReason) {
      toast.warning('Please enter all details');
      return;
    }
    setSubmittingRevision(true);
    try {
      await api.post('/requests', {
        requestType: 'Salary Revision',
        targetUserId: user._id,
        newValues: { requestedAmount: reqSalaryAmount },
        remarks: reqSalaryReason
      });
      toast.success('Salary revision request submitted successfully!');
      setShowRevisionModal(false);
      setReqSalaryAmount('');
      setReqSalaryReason('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit salary request');
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeReason) {
      toast.warning('Please enter a dispute reason');
      return;
    }
    setSubmittingDispute(true);
    try {
      await api.post('/support', {
        category: 'Other',
        subject: `Salary Dispute - ${disputePayroll.month} ${disputePayroll.year}`,
        description: disputeReason
      });
      toast.success('Dispute raised successfully! Support ticket created.');
      setShowDisputeModal(false);
      setDisputeReason('');
      setDisputePayroll(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to raise salary dispute');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!emp._id) {
      toast.error('No employee profile linked to your account.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put(`/employees/${emp._id}`, { ...form, skills });
      if (data.requestPending) {
        toast.success(data.message || 'Profile edit request created successfully!');
      } else {
        toast.success('Profile updated successfully!');
        setUser(u => ({ ...u, employeeRef: { ...u.employeeRef, ...data.employee } }));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPwdSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwdSaving(false);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      toast.error('Skill already added');
      return;
    }
    setSkills(s => [...s, trimmed]);
    setSkillInput('');
  };

  const removeSkill = (skill) => setSkills(s => s.filter(x => x !== skill));

  const roleName = user?.role?.name || user?.role || '';
  const hasEmployeeRef = !!user?.employeeRef;
  const showSkillsTab = !['Super Admin', 'Organization Admin', 'HR Manager', 'IT Administrator', 'Auditor', 'Finance'].includes(roleName);

  // Completeness metric calculations
  const profileFields = [form.firstName, form.lastName, form.mobile, form.address, form.emergencyContact];
  const completeness = hasEmployeeRef
    ? Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)
    : 100;

  const initials = hasEmployeeRef
    ? `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || '?';

  const tabs = [
    ['personal', 'Personal Detail'],
    ['salary', 'My Salary & Payslips'],
    ...(showSkillsTab ? [['skills', 'Skills list']] : []),
    ['password', 'Change Password'],
    ['prefs', 'Preferences'],
    ['sessions', 'Active Sessions']
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Banner warning on temporary password */}
      {location.state?.forcePasswordChange && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl p-4 flex gap-3 shadow-sm animate-pulse text-xs">
          <span>⚠️</span>
          <div>
            <p className="font-bold">Password reset required</p>
            <p className="mt-0.5 opacity-80">Please update your temporary login credentials before continuing further.</p>
          </div>
        </div>
      )}

      {/* Hero card */}
      <div className="bg-gradient-to-r from-royalIndigo via-darkSapphire to-royalPurple text-white rounded-3xl p-6 shadow-glow-indigo border border-indigo-500/25 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-inner border border-white/20">
          {initials}
        </div>
        <div className="flex-1 space-y-1.5 text-center sm:text-left">
          <h2 className="text-xl font-black">{hasEmployeeRef ? `${form.firstName || user?.username} ${form.lastName}` : user?.username}</h2>
          <p className="text-xs text-indigo-200">{emp.designation || roleName} · {emp.department || 'Staff Portal'}</p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1.5">
            {emp.employeeId && <span className="bg-white/15 text-[10px] font-mono px-3 py-0.5 rounded-full border border-white/10">ID: {emp.employeeId}</span>}
            <span className="bg-white/15 text-[10px] px-3 py-0.5 rounded-full border border-white/10 capitalize">Role: {roleName}</span>
          </div>
        </div>
        <div className="w-full sm:w-auto text-center sm:text-right space-y-1">
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Profile Completion</p>
          <p className="text-3xl font-black text-white">{completeness}%</p>
          <div className="w-32 h-1.5 bg-white/10 rounded-full mx-auto sm:ml-auto">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${completeness}%` }} />
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div>
        <div className="flex gap-2 border-b border-gray-200 dark:border-darkBorder bg-white/40 dark:bg-darkSurface/40 rounded-t-2xl px-4 py-2">
          {tabs.map(([k, l]) => (
            <TabBtn key={k} active={activeTab === k} onClick={() => setActiveTab(k)}>{l}</TabBtn>
          ))}
        </div>

        <div className="glass-card bg-white/50 dark:bg-darkSurface/50 rounded-b-2xl border-x border-b border-gray-100 dark:border-darkBorder p-6">
          {/* Personal Details */}
          {activeTab === 'personal' && (
            hasEmployeeRef ? (
              <form onSubmit={handleDetailsSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name"><Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></Field>
                  <Field label="Last Name"><Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Mobile Phone"><Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} /></Field>
                  <Field label="Emergency Contact"><Input value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} /></Field>
                </div>
                <Field label="Residential Address"><Textarea rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></Field>
                
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl text-[11px] text-gray-500 dark:text-gray-400">
                  💡 <strong>Notice:</strong> Submitting updates to your personal details (except profile photo) will launch a compliance <strong>Profile Edit Request</strong> which requires administrator approval before it takes effect on your active files.
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={saving} className="btn-premium-gradient text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md">
                    {saving ? 'Submitting request...' : 'Save & Request Approval'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Username">
                    <Input value={user?.username || ''} disabled />
                  </Field>
                  <Field label="Email Address">
                    <Input value={user?.email || ''} disabled />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Security Role">
                    <Input value={roleName} disabled />
                  </Field>
                  <Field label="Organization Node">
                    <Input value={user?.organization?.name || 'EWAP Central'} disabled />
                  </Field>
                </div>
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400">
                  🛡️ <strong>System Account Status:</strong> This is a secure directory administration account. Personal registries, contact cards, and skills lists are reserved for corporate workspace employees.
                </div>
              </div>
            )
          )}

          {/* Salary & Payslip Tab */}
          {activeTab === 'salary' && (
            <div className="space-y-6">
              {loadingPayrolls ? (
                <p className="text-xs text-slate-450 italic py-8 text-center">Loading payroll register data...</p>
              ) : payrolls.length === 0 ? (
                <div className="text-center space-y-4 py-8">
                  <p className="text-sm text-slate-400 italic">No salary disbursement records found for this account.</p>
                  <p className="text-xs text-slate-505 max-w-md mx-auto">
                    If this is a newly created account or administrative node, payroll registers are typically compiled at the end of each monthly cycle.
                  </p>
                  <button
                    onClick={() => {
                      setReqSalaryAmount('50000');
                      setReqSalaryReason('Initial salary revision request on profile setup.');
                      setShowRevisionModal(true);
                    }}
                    className="btn-premium-gradient py-2 px-4 rounded-xl text-xs font-bold text-white shadow-md border-0 cursor-pointer"
                  >
                    Request Initial Salary Revision
                  </button>
                </div>
              ) : (() => {
                const latest = payrolls[0];
                return (
                  <div className="space-y-6">
                    {/* Latest Salary Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border border-indigo-500/10 dark:border-indigo-500/10 rounded-2xl bg-indigo-50/5 dark:bg-[#0E1325]/10 space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Base Salary</span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">₹{(latest.baseSalary || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Regular Contract Grade</p>
                      </div>
                      <div className="p-4 border border-emerald-500/10 dark:border-emerald-500/10 rounded-2xl bg-emerald-50/5 dark:bg-[#0E1325]/10 space-y-1.5">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Net Payout (Latest)</span>
                        <p className="text-2xl font-black text-emerald-650 dark:text-emerald-400">₹{(latest.netSalary || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Disbursed on: {latest.month} {latest.year}</p>
                      </div>
                      <div className="p-4 border border-purple-500/10 dark:border-purple-500/10 rounded-2xl bg-purple-50/5 dark:bg-[#0E1325]/10 space-y-1.5">
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">Salary Status</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${latest.salaryHold?.isOnHold ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          <p className="text-sm font-bold text-slate-805 dark:text-white">{latest.salaryHold?.isOnHold ? 'ON HOLD' : 'DISBURSED'}</p>
                        </div>
                        {latest.salaryHold?.isOnHold && (
                          <p className="text-[9px] text-red-550 dark:text-red-405 font-medium truncate" title={latest.salaryHold.holdReason}>
                            Hold Reason: &quot;{latest.salaryHold.holdReason}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-white">Need to report a payroll mismatch or request updates?</p>
                        <p className="text-[10px] text-slate-450 font-medium">Raise formal revision request, report disputations, or download slip records.</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => generatePayslipPDF(latest)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl text-xs cursor-pointer border-0 transition-all flex items-center gap-1.5 shadow"
                        >
                          <Download size={13} /> Download Payslip
                        </button>
                        <button
                          onClick={() => setShowRevisionModal(true)}
                          className="px-3.5 py-2 bg-emerald-605 hover:bg-emerald-750 text-white font-bold rounded-xl text-xs cursor-pointer border-0 transition-all flex items-center gap-1.5 shadow"
                        >
                          <TrendingUp size={13} /> Request Revision
                        </button>
                        <button
                          onClick={() => {
                            setDisputePayroll(latest);
                            setShowDisputeModal(true);
                          }}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer border-0 transition-all flex items-center gap-1.5 shadow"
                        >
                          <AlertTriangle size={13} /> Report Dispute
                        </button>
                      </div>
                    </div>

                    {/* Payroll History Ledger */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs text-gray-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar size={14} className="text-indigo-500" />
                        Salary Disbursement Ledger
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                          <thead>
                            <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                              <th className="pb-3 font-semibold">Period</th>
                              <th className="pb-3 font-semibold">Base Salary (₹)</th>
                              <th className="pb-3 font-semibold">Allowances (₹)</th>
                              <th className="pb-3 font-semibold">Deductions (₹)</th>
                              <th className="pb-3 font-semibold">Net Payout (₹)</th>
                              <th className="pb-3 font-semibold">Status</th>
                              <th className="pb-3 font-semibold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-205 font-mono">
                            {payrolls.map((p) => (
                              <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/20 transition-all">
                                <td className="py-3 font-bold text-slate-900 dark:text-white font-sans">{p.month} {p.year}</td>
                                <td className="py-3">₹{(p.baseSalary || 0).toLocaleString()}</td>
                                <td className="py-3 text-emerald-600 dark:text-emerald-400">+₹{(p.allowances || 0).toLocaleString()}</td>
                                <td className="py-3 text-red-500">-₹{(p.deductions || 0).toLocaleString()}</td>
                                <td className="py-3 font-bold text-indigo-650 dark:text-cyan-400">₹{(p.netSalary || 0).toLocaleString()}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${p.salaryHold?.isOnHold ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-555'}`}>
                                    {p.salaryHold?.isOnHold ? 'Hold' : 'Paid'}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => generatePayslipPDF(p)}
                                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white border-0 cursor-pointer bg-transparent"
                                      title="Download Payslip"
                                    >
                                      <Download size={14} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDisputePayroll(p);
                                        setShowDisputeModal(true);
                                      }}
                                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-red-500 hover:text-red-705 border-0 cursor-pointer bg-transparent"
                                      title="Report Wrong Salary"
                                    >
                                      <AlertTriangle size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Skills */}
          {activeTab === 'skills' && showSkillsTab && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Field label="Add Expert Skill"><Input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="e.g. React, Node.js" /></Field>
                <button onClick={addSkill} className="btn-premium-gradient text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md">Add Skill</button>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-gray-400 uppercase">My Skill Badges</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 ? <p className="text-xs text-gray-450 italic">No skills listed yet.</p> : skills.map(s => <Pill key={s} label={s} onRemove={() => removeSkill(s)} />)}
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleDetailsSubmit} disabled={saving} className="btn-premium-gradient text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md">Save Skills</button>
              </div>
            </div>
          )}

          {/* Password */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <Field label="Current Password"><Input type="password" required value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} /></Field>
              <Field label="New Password"><Input type="password" required value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} /></Field>
              <Field label="Confirm New Password"><Input type="password" required value={pwdForm.confirmPassword} onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))} /></Field>
              <button type="submit" disabled={pwdSaving} className="btn-premium-gradient text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md">
                {pwdSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* Preferences */}
          {activeTab === 'prefs' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase text-gray-400">Appearance & Theme Settings</h4>
                <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-darkBorder rounded-2xl bg-white/20 dark:bg-gray-900/20">
                  <div>
                    <p className="font-bold text-xs">Switch Interface Theme</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Toggle between light ivory or premium charcoal color scales.</p>
                  </div>
                  <button onClick={toggleTheme} className="bg-gray-100 dark:bg-gray-800 text-xs px-3.5 py-1.5 rounded-xl font-bold border border-gray-200 dark:border-darkBorder">
                    {theme === 'dark' ? '☀️ Light theme' : '🌙 Dark theme'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase text-gray-400">Communication Alerts</h4>
                <div className="space-y-3">
                  {[
                    ['emailNotif', 'Email Notifications', 'Receive instant alerts on workflow actions and requests.'],
                    ['weeklyDigest', 'Weekly Summary digest', 'Get a weekly activity review summary catalog.'],
                    ['securityAlerts', 'Security Alert updates', 'Get notified immediately of password changes or lockouts.']
                  ].map(([key, label, desc]) => (
                    <div key={key} className="flex items-center justify-between p-3 border border-gray-100 dark:border-darkBorder rounded-xl bg-white/20 dark:bg-gray-900/20 text-xs">
                      <div>
                        <p className="font-bold">{label}</p>
                        <p className="text-[10px] text-gray-450 mt-0.5">{desc}</p>
                      </div>
                      <input type="checkbox" checked={prefs[key]} onChange={e => setPrefs(f => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Sessions */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase text-gray-400">Active Login Audit Records</h4>
              <div className="space-y-2">
                {[
                  { browser: 'Microsoft Edge', ip: '127.0.0.1 (Current Session)', time: 'Logged in just now' },
                  { browser: 'Mozilla Firefox', ip: '192.168.1.45', time: 'Logged in 2 days ago' }
                ].map((s, idx) => (
                  <div key={idx} className="p-4 border border-gray-100 dark:border-darkBorder bg-white/20 dark:bg-gray-900/20 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{s.browser}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{s.ip}</p>
                    </div>
                    <span className="text-[10px] text-gray-400">{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-[#151A30] border border-indigo-500/20 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-gray-150 dark:border-indigo-500/15">
              <h3 className="text-sm font-black text-indigo-700 dark:text-cyan-405 uppercase tracking-widest">Request Salary Revision</h3>
              <button onClick={() => setShowRevisionModal(false)} className="text-gray-400 hover:text-gray-650 bg-transparent border-0 text-xl font-bold cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleRequestRevisionSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="block font-bold text-slate-400 uppercase">Requested Amount (₹)</label>
                <input
                  required
                  type="number"
                  placeholder="e.g. 65000"
                  value={reqSalaryAmount}
                  onChange={(e) => setReqSalaryAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-400 uppercase">Remarks / Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain reason for revision request..."
                  value={reqSalaryReason}
                  onChange={(e) => setReqSalaryReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-805 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRevision}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-0 cursor-pointer transition-all disabled:opacity-50"
                >
                  {submittingRevision ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-[#151A30] border border-indigo-500/20 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-gray-150 dark:border-indigo-500/15">
              <h3 className="text-sm font-black text-red-655 dark:text-red-400 uppercase tracking-widest">Report Salary Dispute</h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-gray-400 hover:text-gray-655 bg-transparent border-0 text-xl font-bold cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleDisputeSubmit} className="space-y-4 text-xs font-sans">
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-1">
                <p className="font-bold text-red-550">Payroll Cycle: {disputePayroll?.month} {disputePayroll?.year}</p>
                <p className="text-[10px] text-slate-400">Net payout recorded: ₹{(disputePayroll?.netSalary || 0).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-400 uppercase">Describe Dispute Reason</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe wrong salary calculations, unpaid allowances, or incorrect deductions..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-[#0B1023]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-805 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="px-4 py-2 rounded-xl bg-red-655 hover:bg-red-700 text-white font-bold border-0 cursor-pointer transition-all disabled:opacity-50"
                >
                  {submittingDispute ? 'Submitting...' : 'Raise Dispute'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;
