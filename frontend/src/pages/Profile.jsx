import React, { useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

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

  // Completeness metric calculations
  const profileFields = [form.firstName, form.lastName, form.mobile, form.address, form.emergencyContact];
  const completeness = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';
  const roleName = user?.role || '';

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
          <h2 className="text-xl font-black">{form.firstName || user?.username} {form.lastName}</h2>
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
          {[['personal', 'Personal Detail'], ['skills', 'Skills list'], ['password', 'Change Password'], ['prefs', 'Preferences'], ['sessions', 'Active Sessions']].map(([k, l]) => (
            <TabBtn key={k} active={activeTab === k} onClick={() => setActiveTab(k)}>{l}</TabBtn>
          ))}
        </div>

        <div className="glass-card bg-white/50 dark:bg-darkSurface/50 rounded-b-2xl border-x border-b border-gray-100 dark:border-darkBorder p-6">
          {/* Personal Details */}
          {activeTab === 'personal' && (
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
          )}

          {/* Skills */}
          {activeTab === 'skills' && (
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
    </div>
  );
};

export default Profile;
