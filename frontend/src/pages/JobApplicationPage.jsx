import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { ArrowLeft, Upload, Briefcase, User, Mail, Phone, FileText, Send, Loader2 } from 'lucide-react';
import publicApi from '../services/publicApi';

const JobApplicationPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [form, setForm] = useState({
    candidateName: '',
    email: '',
    phone: '',
    experience: '',
    skills: '',
    coverLetter: ''
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await publicApi.get(`/recruitment/public/jobs/${jobId}`);
        setJob(res.data);
      } catch {
        toast.error('Job posting not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowed.includes(file.type)) {
        toast.error('Please upload a PDF or Word document');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      toast.warning('Please upload your resume');
      return;
    }

    const formData = new FormData();
    formData.append('candidateName', form.candidateName);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    formData.append('experience', form.experience);
    formData.append('skills', form.skills);
    formData.append('coverLetter', form.coverLetter);
    formData.append('jobPostingId', jobId);
    formData.append('resume', resumeFile);

    try {
      setSubmitting(true);
      await publicApi.post('/recruitment/public/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Application submitted successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-transparent to-purple-950/20 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Careers
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="bg-slate-900/50 border border-indigo-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl">
                <Briefcase className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{job.title}</h1>
                <p className="text-indigo-400 text-sm mt-1">{job.department}</p>
                {job.organization?.name && (
                  <p className="text-slate-500 text-xs mt-1">{job.organization.name}</p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Description</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-indigo-500/20 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-400" />
              Apply for this Position
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Full Name *</label>
                <input
                  type="text"
                  name="candidateName"
                  required
                  value={form.candidateName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Years of Experience *</label>
                <input
                  type="number"
                  name="experience"
                  required
                  min="0"
                  max="50"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="3"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Skills (comma-separated) *</label>
              <input
                type="text"
                name="skills"
                required
                value={form.skills}
                onChange={handleChange}
                placeholder="React, Node.js, MongoDB, JavaScript"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Cover Letter</label>
              <textarea
                name="coverLetter"
                rows={4}
                value={form.coverLetter}
                onChange={handleChange}
                placeholder="Tell us why you're a great fit for this role..."
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Upload Resume (PDF/DOC) *</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className={`flex items-center justify-center gap-3 px-4 py-8 border-2 border-dashed rounded-xl transition-colors ${resumeFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-indigo-500/50'}`}>
                  <Upload className={`h-6 w-6 ${resumeFile ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div className="text-center">
                    {resumeFile ? (
                      <p className="text-sm text-emerald-400 font-medium">{resumeFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-slate-400">Click or drag to upload resume</p>
                        <p className="text-xs text-slate-600 mt-1">PDF or Word, max 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 border-0 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Application
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default JobApplicationPage;
