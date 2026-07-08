import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Plus, Users, Download, Brain, RefreshCw,
  ChevronRight, Star, CheckCircle2, XCircle, FileText, ExternalLink
} from 'lucide-react';
import api from '../../services/api';

const CANDIDATE_STATUSES = [
  'Applied', 'Resume Screening', 'Technical Interview',
  'HR Interview', 'Offered', 'Hired', 'Rejected'
];

const ScoreBadge = ({ score }) => {
  const color =
    score >= 75 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
    score >= 50 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' :
    'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-black ${color}`}>
      <Star className="h-3 w-3" />
      {score ?? '—'}/100
    </span>
  );
};

const ReportModal = ({ candidate, onClose }) => {
  const report = candidate?.aiReport || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-[#151A30] border border-slate-200 dark:border-indigo-500/30 rounded-2xl shadow-2xl w-full max-w-2xl z-10 p-6 text-slate-800 dark:text-white max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-indigo-500/15 pb-4 mb-5">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
              AI Screening Report
            </h3>
            <p className="text-xs text-slate-500 mt-1">{candidate.candidateName} · {candidate.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl font-light border-0 bg-transparent cursor-pointer">&times;</button>
        </div>

        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647]">
          <div className="text-center">
            <div className={`text-4xl font-black ${
              candidate.aiScore >= 75 ? 'text-emerald-500' :
              candidate.aiScore >= 50 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {candidate.aiScore ?? '—'}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">AI Score</div>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Recommendation</p>
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">{report.recommendation || 'N/A'}</p>
            <p className="text-xs text-slate-500 mt-2 italic">{report.summary}</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <p className="font-black uppercase tracking-widest text-slate-500 mb-2">Overall Assessment</p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{report.overallAssessment || 'No assessment available.'}</p>
          </div>

          <div>
            <p className="font-black uppercase tracking-widest text-slate-500 mb-2">Experience Analysis</p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{report.experienceAnalysis || 'N/A'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <p className="font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Skills Match
              </p>
              {(report.skillsMatch?.length > 0) ? (
                <ul className="space-y-1">
                  {report.skillsMatch.map((s, i) => (
                    <li key={i} className="text-slate-700 dark:text-slate-300">• {s}</li>
                  ))}
                </ul>
              ) : <p className="text-slate-500 italic">None identified</p>}
            </div>

            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
              <p className="font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> Skills Missing
              </p>
              {(report.skillsMissing?.length > 0) ? (
                <ul className="space-y-1">
                  {report.skillsMissing.map((s, i) => (
                    <li key={i} className="text-slate-700 dark:text-slate-300">• {s}</li>
                  ))}
                </ul>
              ) : <p className="text-slate-500 italic">None identified</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-black uppercase tracking-widest text-slate-500 mb-2">Strengths</p>
              <ul className="space-y-1">
                {(report.strengths?.length > 0) ? report.strengths.map((s, i) => (
                  <li key={i} className="text-emerald-700 dark:text-emerald-300">+ {s}</li>
                )) : <li className="text-slate-500 italic">N/A</li>}
              </ul>
            </div>
            <div>
              <p className="font-black uppercase tracking-widest text-slate-500 mb-2">Weaknesses</p>
              <ul className="space-y-1">
                {(report.weaknesses?.length > 0) ? report.weaknesses.map((s, i) => (
                  <li key={i} className="text-red-600 dark:text-red-400">− {s}</li>
                )) : <li className="text-slate-500 italic">N/A</li>}
              </ul>
            </div>
          </div>

          {candidate.coverLetter && (
            <div>
              <p className="font-black uppercase tracking-widest text-slate-500 mb-2">Cover Letter</p>
              <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed">{candidate.coverLetter}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const CreateJobModal = ({ departments, onClose, onCreated }) => {
  const [posting, setPosting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = e.target.jobTitle.value;
    const department = e.target.jobDept.value;
    const description = e.target.jobDesc.value;

    if (!title || !department || !description) {
      toast.warning('All fields are required');
      return;
    }

    try {
      setPosting(true);
      await api.post('/recruitment/jobs', { title, department, description });
      toast.success('Job posting created! It is now visible on the landing page.');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create job posting');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white dark:bg-[#151A30] border border-slate-200 dark:border-indigo-500/30 rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6 text-slate-800 dark:text-white"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-indigo-500/15 pb-3 mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Create Job Posting</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-light border-0 bg-transparent cursor-pointer">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase">Job Title</label>
            <input
              type="text"
              name="jobTitle"
              required
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase">Department</label>
            <select
              name="jobDept"
              required
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">-- Choose Department --</option>
              {departments.map(d => (
                <option key={d._id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase">Job Description</label>
            <textarea
              name="jobDesc"
              required
              rows={4}
              placeholder="Responsibilities, required skills, qualifications..."
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-indigo-500/15">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer">Cancel</button>
            <button
              type="submit"
              disabled={posting}
              className="px-4 py-2 text-xs font-bold uppercase text-white btn-premium-gradient rounded-xl disabled:opacity-50 border-0 cursor-pointer"
            >
              {posting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const RecruitmentPanel = ({ jobs, candidates, departments, onRefresh }) => {
  const [subTab, setSubTab] = useState('candidates');
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [reportCandidate, setReportCandidate] = useState(null);
  const [jobFilter, setJobFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [rescreeningId, setRescreeningId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const filteredCandidates = (jobFilter
    ? candidates.filter(c => String(c.jobPosting?._id || c.jobPosting) === jobFilter)
    : candidates
  ).sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));

  const handleDownloadResume = async (candidate) => {
    try {
      setDownloadingId(candidate._id);
      const res = await api.get(`/recruitment/candidates/${candidate._id}/resume`);
      const { downloadUrl, fileName } = res.data;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || `${candidate.candidateName}_resume.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Resume download started');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to download resume');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRescreen = async (candidateId) => {
    try {
      setRescreeningId(candidateId);
      await api.post(`/recruitment/candidates/${candidateId}/rescreen`);
      toast.success('AI screening completed');
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to run AI screening');
    } finally {
      setRescreeningId(null);
    }
  };

  const handleStatusChange = async (candidateId, status) => {
    try {
      setUpdatingStatusId(candidateId);
      await api.put(`/recruitment/candidates/${candidateId}/status`, { status });
      toast.success(`Status updated to ${status}`);
      await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card border border-teal-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Open Job Postings</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{jobs.filter(j => j.status === 'Active').length}</p>
          </div>
          <Briefcase className="h-8 w-8 text-teal-500 opacity-60" />
        </div>
        <div className="glass-card border border-teal-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Applicants</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{candidates.length}</p>
          </div>
          <Users className="h-8 w-8 text-teal-500 opacity-60" />
        </div>
        <div className="glass-card border border-teal-500/20 rounded-2xl p-5 flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Top Score</p>
            <p className="text-2xl font-black text-emerald-500 mt-1">
              {candidates.length > 0 ? Math.max(...candidates.map(c => c.aiScore || 0)) : '—'}
            </p>
          </div>
          <Star className="h-8 w-8 text-emerald-500 opacity-60" />
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('candidates')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all border cursor-pointer ${
              subTab === 'candidates'
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-transparent text-slate-500 border-slate-200 dark:border-[#1F2647] hover:border-teal-500/40'
            }`}
          >
            Candidates by Score
          </button>
          <button
            onClick={() => setSubTab('jobs')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all border cursor-pointer ${
              subTab === 'jobs'
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-transparent text-slate-500 border-slate-200 dark:border-[#1F2647] hover:border-teal-500/40'
            }`}
          >
            Job Postings
          </button>
        </div>
        <button
          onClick={() => setShowCreateJob(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase rounded-xl border-0 cursor-pointer transition-all"
        >
          <Plus className="h-4 w-4" />
          Create Job Posting
        </button>
      </div>

      {/* Candidates tab */}
      {subTab === 'candidates' && (
        <div className="glass-card border border-teal-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI-Screened Candidates (Sorted by Score)
            </h3>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="text-xs p-2 bg-slate-50 dark:bg-[#0B1023] border border-slate-200 dark:border-[#1F2647] rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">All Jobs</option>
              {jobs.map(j => (
                <option key={j._id} value={j._id}>{j.title}</option>
              ))}
            </select>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-slate-400 mx-auto mb-3 opacity-50" />
              <p className="text-xs text-slate-500 italic">No applications yet. Create a job posting and share the careers page link.</p>
              <a href="/#careers" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline">
                View Careers Page <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 text-left">
                    <th className="pb-3 font-semibold w-8">#</th>
                    <th className="pb-3 font-semibold">Candidate</th>
                    <th className="pb-3 font-semibold">Job</th>
                    <th className="pb-3 font-semibold">Exp.</th>
                    <th className="pb-3 font-semibold">AI Score</th>
                    <th className="pb-3 font-semibold">Recommendation</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-200">
                  {filteredCandidates.map((c, idx) => (
                    <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/30">
                      <td className="py-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{c.candidateName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{c.email}</div>
                      </td>
                      <td className="py-3 text-teal-650 dark:text-teal-350 font-semibold">
                        {c.jobPosting?.title || 'N/A'}
                      </td>
                      <td className="py-3 font-mono">{c.experience}y</td>
                      <td className="py-3"><ScoreBadge score={c.aiScore} /></td>
                      <td className="py-3">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {c.aiReport?.recommendation || '—'}
                        </span>
                      </td>
                      <td className="py-3">
                        <select
                          value={c.status}
                          disabled={updatingStatusId === c._id}
                          onChange={(e) => handleStatusChange(c._id, e.target.value)}
                          className="text-[10px] p-1.5 bg-[#0B1023] border border-slate-800 rounded-lg text-slate-300 max-w-[140px]"
                        >
                          {CANDIDATE_STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-1.5 justify-end flex-wrap">
                          <button
                            onClick={() => setReportCandidate(c)}
                            className="px-2 py-1 text-[9px] font-bold uppercase bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            <Brain className="h-3 w-3" /> Report
                          </button>
                          {(c.resumeUrl || c.resumePublicId) && (
                            <button
                              onClick={() => handleDownloadResume(c)}
                              disabled={downloadingId === c._id}
                              className="px-2 py-1 text-[9px] font-bold uppercase bg-teal-500/10 hover:bg-teal-500/20 text-teal-650 dark:text-teal-400 border border-teal-500/20 rounded-lg cursor-pointer flex items-center gap-1 disabled:opacity-50"
                            >
                              <Download className="h-3 w-3" />
                              {downloadingId === c._id ? '...' : 'PDF'}
                            </button>
                          )}
                          <button
                            onClick={() => handleRescreen(c._id)}
                            disabled={rescreeningId === c._id}
                            className="px-2 py-1 text-[9px] font-bold uppercase bg-amber-500/10 hover:bg-amber-500/20 text-amber-650 dark:text-amber-400 border border-amber-500/20 rounded-lg cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            <RefreshCw className={`h-3 w-3 ${rescreeningId === c._id ? 'animate-spin' : ''}`} />
                            Rescreen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Jobs tab */}
      {subTab === 'jobs' && (
        <div className="glass-card border border-teal-500/20 rounded-2xl p-5">
          <h3 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Active Job Postings
          </h3>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-10 w-10 text-slate-400 mx-auto mb-3 opacity-50" />
              <p className="text-xs text-slate-500 italic mb-4">No job postings yet.</p>
              <button
                onClick={() => setShowCreateJob(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase rounded-xl border-0 cursor-pointer"
              >
                Create First Job Posting
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job._id} className="p-4 rounded-xl border border-slate-200 dark:border-[#1F2647] bg-slate-50/50 dark:bg-[#0E1325]/30 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{job.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        job.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-teal-650 dark:text-teal-350 font-semibold mt-0.5">{job.department}</p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{job.description}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">
                      Posted {new Date(job.createdAt).toLocaleDateString()} · {candidates.filter(c => String(c.jobPosting?._id || c.jobPosting) === String(job._id)).length} applicants
                    </p>
                  </div>
                  <a
                    href={`/#careers`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase text-teal-600 dark:text-teal-400 border border-teal-500/30 rounded-lg hover:bg-teal-500/10 transition-all no-underline"
                  >
                    View on Site <ChevronRight className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreateJob && (
          <CreateJobModal
            departments={departments}
            onClose={() => setShowCreateJob(false)}
            onCreated={onRefresh}
          />
        )}
        {reportCandidate && (
          <ReportModal
            candidate={reportCandidate}
            onClose={() => setReportCandidate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecruitmentPanel;
