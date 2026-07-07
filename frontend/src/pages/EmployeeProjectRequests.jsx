import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { DemoContext } from '../context/DemoContext';
import { Plus, FolderPlus, Clock, AlertTriangle } from 'lucide-react';

const STATUS_BADGE = {
  Pending_TL_Approval: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Pending_Dept_Approval: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  Rejected: 'bg-red-500/10 text-red-500 border-red-500/20'
};

export default function EmployeeProjectRequests() {
  const { user } = useContext(AuthContext);
  const { isDemoMode } = useContext(DemoContext);
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'EmployeeRequest', teamLeadId: '', requestedProjectId: '', comments: '' });

  const currentEmployee = employees.find(e => e.userRef?._id === user?._id || e.userRef === user?._id);
  const currentTeamLeads = employees.filter(e => e.designation?.toLowerCase().includes('lead') || e.designation?.toLowerCase().includes('manager'));

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqsRes, projsRes, empsRes] = await Promise.all([
        api.get('/projects/requests').catch(() => ({ data: [] })),
        api.get('/projects').catch(() => ({ data: [] })),
        api.get('/employees').catch(() => ({ data: [] }))
      ]);
      setRequests(reqsRes.data || []);
      setProjects(projsRes.data || []);
      setEmployees(empsRes.data || []);
    } catch (err) {
      toast.error('Failed to load project requests data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!form.teamLeadId || !form.requestedProjectId) {
      toast.warning('Please select a Team Lead and target Project.');
      return;
    }

    try {
      const payload = {
        type: form.type,
        teamLeadId: form.teamLeadId,
        requestedProjectId: form.requestedProjectId,
        comments: form.comments
      };

      await api.post('/projects/requests', payload);
      toast.success('Project request filed successfully!');
      setShowModal(false);
      setForm({ type: 'EmployeeRequest', teamLeadId: '', requestedProjectId: '', comments: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to file project request.');
    }
  };

  // Filter requests submitted by or concerning this employee
  const myRequests = requests.filter(r => 
    r.employeesAgreed?.some(e => e._id === currentEmployee?._id || e === currentEmployee?._id)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Project Assignment Requests</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Submit transfer requests or request to be assigned to another active project</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-premium-gradient inline-flex items-center gap-2 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md border-0 cursor-pointer"
        >
          <Plus size={14} /> Request Transfer
        </button>
      </div>

      <div className="glass-card border border-indigo-500/20 rounded-2xl p-5">
        <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-4">Requests Ledger</h4>
        {loading ? (
          <p className="text-xs text-slate-455 italic py-6 text-center">Loading requests history...</p>
        ) : myRequests.length === 0 ? (
          <p className="text-xs text-slate-455 italic py-6 text-center">No project assignment requests submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                  <th className="pb-3 font-semibold">Team Lead</th>
                  <th className="pb-3 font-semibold">Current Project</th>
                  <th className="pb-3 font-semibold">Requested Project</th>
                  <th className="pb-3 font-semibold">Comments</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-205 font-mono">
                {myRequests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/20 transition-all">
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                      {r.teamLead ? `${r.teamLead.firstName} ${r.teamLead.lastName}` : <span className="opacity-40 italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5">
                      {r.currentProject ? r.currentProject.name : <span className="opacity-40 italic">None</span>}
                    </td>
                    <td className="py-3.5">
                      {r.requestedProject ? r.requestedProject.name : <span className="opacity-40 italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5 max-w-[200px] truncate" title={r.comments}>{r.comments}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${STATUS_BADGE[r.status] || STATUS_BADGE.Pending_TL_Approval}`}>
                        {r.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-[#151A30] border border-slate-200 dark:border-indigo-500/30 rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6 text-slate-800 dark:text-white"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1F2647] pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">Request Project Swap / Transfer</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white text-xl font-light border-0 bg-transparent cursor-pointer">&times;</button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">Your Reporting Manager / Lead</label>
                  <select
                    value={form.teamLeadId}
                    onChange={(e) => setForm({ ...form, teamLeadId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Reporting Lead --</option>
                    {currentTeamLeads.map(l => (
                      <option key={l._id} value={l._id}>{l.firstName} {l.lastName} ({l.designation || 'Lead'})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">Requested Project</label>
                  <select
                    value={form.requestedProjectId}
                    onChange={(e) => setForm({ ...form, requestedProjectId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Target Project --</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.projectCode})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">Justification Comments</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details about why you are requesting to move to this project..."
                    value={form.comments}
                    onChange={(e) => setForm({ ...form, comments: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E2544] dark:text-white dark:hover:bg-[#2A3258] rounded-xl transition-all border-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all border-0 cursor-pointer"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
