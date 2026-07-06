import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { DemoContext } from '../context/DemoContext';
import { AuthContext } from '../context/AuthContext';
import { Upload, Star, Award, FileText, Check } from 'lucide-react';

const EmployeeCompanyInfo = () => {
  const { isDemoMode } = useContext(DemoContext);
  const { user } = useContext(AuthContext);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumeText, setResumeText] = useState('');
  const [fileDetails, setFileDetails] = useState({ name: '', base64: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const empId = user?.employeeRef?._id || user?.employeeRef;
      const res = await api.get(`/employees/${empId}`);
      setEmployee(res.data);
      setResumeText(res.data?.resumeText || '');
      if (res.data?.resumeFileName) {
        setFileDetails({ name: res.data.resumeFileName, base64: '' });
      }
    } catch (err) {
      toast.error('Failed to load employee file');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      const mockEmp = {
        _id: 'emp1',
        firstName: 'Riya',
        lastName: 'Sharma',
        employeeId: 'EMP_103',
        designation: 'Developer',
        ratings: { teamLeadRating: 4.5, managerRating: 4.2 },
        resumeText: 'Experienced full stack developer specializing in React, Node.js, and MongoDB.',
        resumeFileName: 'riya_sharma_cv.pdf'
      };
      setEmployee(mockEmp);
      setResumeText(mockEmp.resumeText);
      setFileDetails({ name: mockEmp.resumeFileName, base64: '' });
      setLoading(false);
    } else {
      loadProfile();
    }
  }, [isDemoMode, user]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setFileDetails({
        name: file.name,
        base64: reader.result
      });
      toast.info(`Loaded: ${file.name}`);
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const empId = employee?._id || 'emp1';
    try {
      const payload = {
        resumeText,
        resumeFileName: fileDetails.name,
        resumeFileBase64: fileDetails.base64
      };

      if (isDemoMode) {
        setEmployee(prev => ({ ...prev, ...payload }));
        toast.success('Resume updated successfully (Demo Mode)!');
      } else {
        await api.put(`/employees/${empId}/resume`, payload);
        toast.success('Resume updated successfully!');
        loadProfile();
      }
    } catch (err) {
      toast.error('Failed to update resume details');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-cyan-400">Loading Company Info Records...</div>;
  }

  const tlRating = employee?.ratings?.teamLeadRating || 0;
  const mRating = employee?.ratings?.managerRating || 0;
  const cumulative = tlRating && mRating ? (tlRating + mRating) / 2 : (tlRating || mRating || 0);

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      <div className="bg-gradient-to-r from-cyan-500/10 via-[#151A30]/5 to-[#8B5CF6]/5 dark:from-[#102025] dark:to-slate-900 border border-cyan-500/20 p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Corporate Employee Records 💼</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review ratings grades and audit files shared with the human resource department.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card border border-indigo-500/10 p-6 rounded-2xl bg-white/40 dark:bg-[#151A30]/40 space-y-4">
            <h3 className="text-sm font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Resume & Professional Summary
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-450 uppercase">Inline CV/Resume Text Details</label>
                <textarea
                  rows={8}
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste or write your resume summary, professional profile, skills, and target roles..."
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-indigo-500/20 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="border border-dashed border-indigo-500/20 p-5 rounded-2xl flex flex-col items-center justify-center space-y-3 bg-slate-900/10">
                <Upload className="h-6 w-6 text-slate-450" />
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Upload New Document File</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF or DOCX up to 5MB</p>
                </div>
                <input
                  type="file"
                  id="resume-file-input"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.docx,.doc"
                />
                <label
                  htmlFor="resume-file-input"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-[10px] font-bold rounded-xl border border-indigo-500/15 cursor-pointer text-slate-300"
                >
                  Select File
                </label>
                {fileDetails.name && (
                  <p className="text-[10px] text-emerald-450 font-semibold flex items-center gap-1">
                    <Check className="h-3 w-3" /> {fileDetails.name} Selected
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-755 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                >
                  {submitting ? 'Updating...' : 'Save Resume Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card border border-indigo-500/10 p-6 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-[#8B5CF6]/5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-indigo-700 dark:text-cyan-400">Cumulative Appraisal Stars</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-indigo-500/5">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Cumulative Appraisal</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {cumulative ? `${cumulative.toFixed(1)} / 5` : 'N/A'}
                  </p>
                </div>
                <Award className="h-8 w-8 text-cyan-455" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-500 dark:text-slate-400 py-1.5 border-b border-slate-100 dark:border-indigo-500/10">
                  <span>Team Lead Rating:</span>
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {tlRating ? tlRating.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-slate-500 dark:text-slate-400 py-1.5 border-b border-slate-100 dark:border-indigo-500/10">
                  <span>Department Manager:</span>
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {mRating ? mRating.toFixed(1) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCompanyInfo;
