import React, { useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const inputCls = "block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";
const Input = (props) => <input {...props} className={inputCls} />;
const Textarea = (props) => <textarea {...props} className={`${inputCls} resize-none`} />;

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick}
    className={`py-3.5 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
    {children}
  </button>
);

const Pill = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
    {label}
    {onRemove && (
      <button type="button" onClick={onRemove} className="text-blue-400 hover:text-blue-700 leading-none font-bold text-sm">&times;</button>
    )}
  </span>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const emp = user?.employeeRef || {};
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(
    location.state?.forcePasswordChange ? 'password' : 'personal'
  );
  const [saving, setSaving] = useState(false);


  // Personal details form state
  const [form, setForm] = useState({
    firstName: emp.firstName || '',
    lastName: emp.lastName || '',
    mobile: emp.mobile || '',
    address: emp.address || '',
    emergencyContact: emp.emergencyContact || '',
  });

  // Skills state
  const [skills, setSkills] = useState(emp.skills || []);
  const [skillInput, setSkillInput] = useState('');

  // Password form state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  // ─── Handlers ─────────────────────────────────────────────────────────────────
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!emp._id) {
      toast.error('No employee profile linked to your account. Please contact HR.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put(`/employees/${emp._id}`, { ...form, skills });
      toast.success('Profile updated successfully!');
      // Refresh user context so the banner updates
      setUser(u => ({ ...u, employeeRef: { ...u.employeeRef, ...data.employee } }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
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
    if (pwdForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
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

  // ─── Profile completeness ──────────────────────────────────────────────────
  const profileFields = [form.firstName, form.lastName, form.mobile, form.address, form.emergencyContact];
  const completeness = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';
  const roleName = user?.role || '';

  const roleColors = {
    'Super Admin': 'from-red-600 to-orange-600',
    'Organization Admin': 'from-purple-600 to-indigo-600',
    'HR Manager': 'from-pink-600 to-rose-600',
    'IT Administrator': 'from-cyan-600 to-blue-600',
    'Employee': 'from-blue-600 to-indigo-600',
  };
  const bannerGrad = roleColors[roleName] || 'from-gray-700 to-gray-800';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {location.state?.forcePasswordChange && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex gap-3 shadow-sm animate-pulse">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold text-sm">Action Required</p>
            <p className="text-xs text-red-700 mt-0.5">Please change your temporary password before accessing other features of the platform.</p>
          </div>
        </div>
      )}
      {/* ── Hero Banner ────────────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-r ${bannerGrad} rounded-2xl shadow overflow-hidden`}>
        <div className="px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-white text-3xl font-bold border-2 border-white/30 shadow-lg">
                {initials}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>

            {/* Info */}
            <div className="text-white flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{form.firstName || user?.username} {form.lastName}</h1>
              <p className="text-white/70 mt-0.5">{emp.designation ? `${emp.designation}${emp.department ? ` · ${emp.department}` : ''}` : roleName}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {emp.employeeId && (
                  <span className="bg-white/20 text-white text-xs font-mono px-3 py-1 rounded-full">{emp.employeeId}</span>
                )}
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">{roleName}</span>
                {user?.email && (
                  <span className="bg-white/20 text-white/80 text-xs px-3 py-1 rounded-full">{user.email}</span>
                )}
              </div>
            </div>

            {/* Completeness indicator */}
            <div className="hidden sm:flex flex-col items-center gap-1 bg-white/10 rounded-xl px-5 py-4 text-white">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="white" strokeWidth="3"
                  strokeDasharray={`${completeness} ${100 - completeness}`} strokeLinecap="round" />
              </svg>
              <span className="text-sm font-bold -mt-11 mb-5">{completeness}%</span>
              <span className="text-xs text-white/70 whitespace-nowrap">Profile Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Card ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow overflow-hidden border border-gray-100">
        {/* Tab Bar */}
        <div className="flex border-b border-gray-200 px-6">
          {[['personal', 'Personal Details'], ['skills', 'Skills'], ['password', 'Change Password']].map(([k, l]) => (
            <TabBtn key={k} active={activeTab === k} onClick={() => setActiveTab(k)}>{l}</TabBtn>
          ))}
        </div>

        <div className="p-6">

          {/* ── Personal Details Tab ─────────────────────────────────────────── */}
          {activeTab === 'personal' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="First Name">
                    <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First name" />
                  </Field>
                  <Field label="Last Name">
                    <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Last name" />
                  </Field>
                  <Field label="Email Address" hint="Contact HR to update your email">
                    <Input type="email" value={user?.email || emp.email || ''} disabled />
                  </Field>
                  <Field label="Mobile Number">
                    <Input type="tel" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="+91 9876543210" />
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Contact & Emergency</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Home / Current Address" hint="">
                    <Textarea rows="2" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full residential address" />
                  </Field>
                  <Field label="Emergency Contact" hint="Name and phone number of emergency contact">
                    <Textarea rows="2" value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} placeholder="e.g. Jane Doe — +91 9876543210 (Spouse)" />
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Work Details <span className="text-gray-300 font-normal normal-case">(read-only)</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Department', value: emp.department },
                    { label: 'Designation', value: emp.designation },
                    { label: 'Employee ID', value: emp.employeeId },
                    { label: 'Employment Type', value: emp.employmentType },
                    { label: 'Joining Date', value: emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '' },
                    { label: 'Status', value: emp.status },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
                      <p className="text-sm font-bold text-gray-800">{value || <span className="text-gray-300 font-normal">—</span>}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-lg shadow transition-all">
                  {saving ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Save Changes</>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── Skills Tab ───────────────────────────────────────────────────── */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Add Skills</h3>
                <p className="text-xs text-gray-400 mb-4">List your professional skills and areas of expertise</p>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    placeholder="e.g. React, Python, Project Management..."
                    className="flex-1"
                  />
                  <button type="button" onClick={addSkill}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow transition-all">
                    + Add
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">My Skills ({skills.length})</h3>
                {skills.length === 0 ? (
                  <div className="text-center py-12 text-gray-300 border-2 border-dashed border-gray-200 rounded-xl">
                    <svg className="mx-auto w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    <p className="text-sm font-medium">No skills added yet</p>
                    <p className="text-xs mt-1">Type a skill above and click Add</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => <Pill key={skill} label={skill} onRemove={() => removeSkill(skill)} />)}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    if (!emp._id) { toast.error('No employee profile linked'); return; }
                    setSaving(true);
                    try {
                      await api.put(`/employees/${emp._id}`, { ...form, skills });
                      toast.success('Skills saved!');
                    } catch {
                      toast.error('Failed to save skills');
                    } finally { setSaving(false); }
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-lg shadow transition-all">
                  {saving ? 'Saving...' : 'Save Skills'}
                </button>
              </div>
            </div>
          )}

          {/* ── Change Password Tab ──────────────────────────────────────────── */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Password Requirements</p>
                  <p className="text-xs text-amber-700 mt-0.5">Minimum 8 characters. Choose a strong, unique password.</p>
                </div>
              </div>

              <Field label="Current Password">
                <Input type="password" required value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="Your current password" />
              </Field>
              <Field label="New Password">
                <Input type="password" required value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="At least 8 characters" />
                {pwdForm.newPassword && (
                  <div className="mt-1.5">
                    <div className="flex gap-1">
                      {[
                        pwdForm.newPassword.length >= 8,
                        /[A-Z]/.test(pwdForm.newPassword),
                        /[0-9]/.test(pwdForm.newPassword),
                        /[^A-Za-z0-9]/.test(pwdForm.newPassword),
                      ].map((ok, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${ok ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {[
                        !pwdForm.newPassword.length >= 8 && '8+ chars',
                        !/[A-Z]/.test(pwdForm.newPassword) && 'uppercase',
                        !/[0-9]/.test(pwdForm.newPassword) && 'number',
                        !/[^A-Za-z0-9]/.test(pwdForm.newPassword) && 'special char',
                      ].filter(Boolean).join(', ') || '✓ Strong password'}
                    </p>
                  </div>
                )}
              </Field>
              <Field label="Confirm New Password">
                <Input type="password" required value={pwdForm.confirmPassword} onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
                {pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                )}
              </Field>

              <button type="submit" disabled={pwdSaving || (pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-lg shadow transition-all">
                {pwdSaving ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>Update Password</>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
