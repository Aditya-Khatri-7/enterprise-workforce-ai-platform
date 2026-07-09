import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { DemoContext } from '../context/DemoContext';
import { Calendar, CheckCircle, Clock, AlertTriangle, Plus, Trash2 } from 'lucide-react';

const LEAVE_BADGE = {
  Pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  Rejected: 'bg-red-500/10 text-red-500 border-red-500/20'
};

export default function EmployeeLeaves() {
  const { user } = useContext(AuthContext);
  const { isDemoMode } = useContext(DemoContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [form, setForm] = useState({ type: 'Casual', startDate: '', endDate: '', reason: '' });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/leaves');
      setLeaves(data || []);
    } catch (err) {
      toast.error('Failed to load leave history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeaves();
    }
  }, [user]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      toast.warning('Please fill in all required fields.');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('End date cannot be before start date.');
      return;
    }

    try {
      await api.post('/leaves', form);
      toast.success('Leave application submitted!');
      setShowApplyModal(false);
      setForm({ type: 'Casual', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit leave.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Leave Applications</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Request personal leave and monitor approval status</p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="btn-premium-gradient inline-flex items-center gap-2 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md border-0 cursor-pointer"
        >
          <Plus size={14} /> Apply for Leave
        </button>
      </div>

      <div className="glass-card border border-emerald-500/20 rounded-2xl p-5">
        <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-4">Leave Logs</h4>
        {loading ? (
          <p className="text-xs text-slate-450 italic py-6 text-center">Loading leaves ledger...</p>
        ) : leaves.length === 0 ? (
          <p className="text-xs text-slate-450 italic py-6 text-center">No leave applications filed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 font-semibold">Approved By</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-205 font-mono">
                {leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/20 transition-all">
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">{l.type}</td>
                    <td className="py-3.5">
                      {new Date(l.startDate).toLocaleDateString()} &rarr; {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 max-w-[200px] truncate" title={l.reason}>{l.reason}</td>
                    <td className="py-3.5">{l.approvedBy?.username || <span className="opacity-40 italic">Pending Approval</span>}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${LEAVE_BADGE[l.status] || LEAVE_BADGE.Pending}`}>
                        {l.status}
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
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowApplyModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-[#151A30] border border-slate-200 dark:border-emerald-500/30 rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6 text-slate-800 dark:text-white"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1F2647] pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Apply for Leave</h3>
                <button onClick={() => setShowApplyModal(false)} className="text-slate-400 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white text-xl font-light border-0 bg-transparent cursor-pointer">&times;</button>
              </div>

              <form onSubmit={handleApply} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">Leave Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Casual">Casual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Earned">Earned Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold">Start Date</label>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold">End Date</label>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">Reason</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter reason for leave..."
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E2544] dark:text-white dark:hover:bg-[#2A3258] rounded-xl transition-all border-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all border-0 cursor-pointer"
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
