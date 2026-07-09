import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { DemoContext } from '../context/DemoContext';
import { AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react';

const TICKET_BADGE = {
  Open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'In Progress': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  Closed: 'bg-slate-500/10 text-slate-550 dark:text-slate-400 border-slate-500/20'
};

export default function EmployeeTickets() {
  const { user } = useContext(AuthContext);
  const { isDemoMode } = useContext(DemoContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: 'IT Support', subject: '', description: '' });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/support');
      setTickets(data || []);
    } catch (err) {
      toast.error('Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      toast.warning('Please enter all required fields.');
      return;
    }

    try {
      await api.post('/support', form);
      toast.success('Support ticket raised successfully!');
      setShowModal(false);
      setForm({ category: 'IT Support', subject: '', description: '' });
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit support ticket');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Service Tickets</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Submit helpdesk requests and track resolution status</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-premium-gradient inline-flex items-center gap-2 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md border-0 cursor-pointer"
        >
          <Plus size={14} /> Raise Support Ticket
        </button>
      </div>

      <div className="glass-card border border-blue-500/20 rounded-2xl p-5">
        <h4 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-4">Ticket Ledger</h4>
        {loading ? (
          <p className="text-xs text-slate-450 italic py-6 text-center">Loading ticket logs...</p>
        ) : tickets.length === 0 ? (
          <p className="text-xs text-slate-450 italic py-6 text-center">No support tickets raised yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-[#1F2647]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-left font-mono">
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold">Filed Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-[#1F2647]/50 text-slate-700 dark:text-slate-205 font-mono">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2544]/20 transition-all">
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">{t.category}</td>
                    <td className="py-3.5 max-w-[250px] truncate" title={t.description}>
                      <span className="font-semibold block">{t.subject}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{t.description}</span>
                    </td>
                    <td className="py-3.5">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${TICKET_BADGE[t.status] || TICKET_BADGE.Open}`}>
                        {t.status}
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
              className="relative bg-white dark:bg-[#151A30] border border-slate-200 dark:border-blue-500/30 rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6 text-slate-800 dark:text-white"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1F2647] pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-450">Raise Support Ticket</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white text-xl font-light border-0 bg-transparent cursor-pointer">&times;</button>
              </div>

              <form onSubmit={handleRaiseTicket} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="IT Support">IT & Infrastructure Support</option>
                    <option value="HR Inquiry">HR & Admin Inquiry</option>
                    <option value="Finance / Payroll">Finance & Payroll query</option>
                    <option value="Facility Management">Facility Management</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Short description of the issue"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold">Detailed Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details about the request or issue..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0E1325]/60 border border-slate-200 dark:border-[#1F2647] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
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
                    className="bg-blue-650 hover:bg-blue-750 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all border-0 cursor-pointer"
                  >
                    Submit Ticket
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
