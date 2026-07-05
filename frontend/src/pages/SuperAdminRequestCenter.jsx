import React, { useEffect, useState, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="glass-card bg-white/60 dark:bg-darkSurface/60 border border-gray-200/50 dark:border-indigo-500/10 rounded-2xl p-5 flex items-center shadow-sm"
  >
    <div className={`p-3 rounded-xl text-white bg-gradient-to-tr ${color} shadow-md`}>
      <span className="text-xl">{icon}</span>
    </div>
    <div className="ml-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{value}</p>
    </div>
  </motion.div>
);

// ─── Modal Layout ─────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white dark:bg-darkSurface rounded-2xl shadow-2xl w-full max-w-2xl mx-auto z-10 border border-gray-100 dark:border-darkBorder overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-darkBorder bg-gray-50/50 dark:bg-gray-900/20">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 max-h-[500px] overflow-y-auto space-y-6">{children}</div>
      </motion.div>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const SuperAdminRequestCenter = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Pending, Approved, Rejected
  const [search, setSearch] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [commentText, setCommentText] = useState('');
  const [actioning, setActioning] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch {
      toast.error('Failed to load workflow requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id, status) => {
    setActioning(true);
    try {
      await api.put(`/requests/${id}/action`, { status, remarks });
      toast.success(`Request successfully ${status.toLowerCase()}!`);
      setRemarks('');
      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActioning(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/requests/${selectedReq._id}/comment`, { text: commentText });
      toast.success('Comment added');
      setCommentText('');
      // Reload current details
      const detail = await api.get(`/requests/${selectedReq._id}`);
      setSelectedReq(detail.data);
    } catch {
      toast.error('Failed to post comment');
    }
  };

  const selectRequestDetails = async (req) => {
    try {
      const res = await api.get(`/requests/${req._id}`);
      setSelectedReq(res.data);
    } catch {
      setSelectedReq(req);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 w-full skeleton-shimmer rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(n => <div key={n} className="h-20 skeleton-shimmer rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const pending = requests.filter(r => r.status === 'Pending');
  const approved = requests.filter(r => r.status === 'Approved');
  const rejected = requests.filter(r => r.status === 'Rejected');
  const highPriority = requests.filter(r => r.priority === 'High');

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'All' || r.status === filter || (filter === 'High' && r.priority === 'High');
    const matchesSearch = r.requestType?.toLowerCase().includes(search.toLowerCase()) || 
                          r.requester?.username?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-royalIndigo via-darkSapphire to-royalPurple text-white rounded-3xl p-6 shadow-glow-indigo border border-indigo-500/25">
        <h2 className="text-xl font-black tracking-wide">Generic Approval Center ⚙️</h2>
        <p className="opacity-70 text-xs mt-1 font-medium text-slate-350">Centralized operational request, profiles audit, leaves, and tenant security parameters routing ledger.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Submissions" value={requests.length} color="from-slate-700 to-slate-900" icon="📂" />
        <StatCard label="Pending Approval" value={pending.length} color="from-amber-500 to-orange-500" icon="⌛" />
        <StatCard label="Approved requests" value={approved.length} color="from-emerald-500 to-teal-500" icon="✓" />
        <StatCard label="High Priority" value={highPriority.length} color="from-red-500 to-pink-500" icon="🔥" />
      </div>

      {/* Filters & search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/40 dark:bg-darkSurface/40 p-4 rounded-2xl border border-indigo-500/15 dark:border-indigo-500/10">
        <div className="flex gap-2.5">
          {['All', 'Pending', 'Approved', 'Rejected', 'High'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/40 dark:bg-indigo-950/20 text-slate-700 dark:text-slate-350 hover:bg-gray-200/50 border border-indigo-500/10'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search requests..."
          className="w-full sm:w-64 border border-indigo-500/20 dark:border-indigo-500/20 bg-white/50 dark:bg-gray-900/40 rounded-xl py-1.5 px-3 text-xs focus:outline-none dark:text-white"
        />
      </div>

      {/* Requests Table */}
      <div className="glass-card bg-white/50 dark:bg-darkSurface/50 rounded-2xl border border-gray-100 dark:border-darkBorder overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs divide-y divide-gray-100 dark:divide-darkBorder">
            <thead className="table-header-premium uppercase text-[10px]">
              <tr>
                <th className="px-6 py-3 text-left">Request Type</th>
                <th className="px-6 py-3 text-left">Requester</th>
                <th className="px-6 py-3 text-left">Priority</th>
                <th className="px-6 py-3 text-left">Submitted Date</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-darkBorder">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 dark:text-gray-400 text-xs font-medium">No matching requests in this workflow state.</td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req._id} className="table-row-premium">
                    <td className="px-6 py-4 font-black text-gray-900 dark:text-white">{req.requestType}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">{req.requester?.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${req.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-600'}`}>{req.priority}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${req.status === 'Pending' ? 'bg-amber-50 text-amber-600' : req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{req.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => selectRequestDetails(req)}
                        className="bg-indigo-600/10 text-indigo-700 hover:bg-indigo-600/20 dark:text-cyan-400 py-1.5 px-3 rounded-xl font-bold transition-all text-[11px] border border-indigo-500/10"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedReq && (
        <Modal title={`${selectedReq.requestType} Details`} onClose={() => { setSelectedReq(null); setRemarks(''); }}>
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Requester</p>
                <p className="text-gray-900 dark:text-white font-bold mt-0.5">{selectedReq.requester?.username} ({selectedReq.requester?.email})</p>
              </div>
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Target User</p>
                <p className="text-gray-900 dark:text-white font-bold mt-0.5">{selectedReq.targetUser?.username || 'System'}</p>
              </div>
            </div>

            {/* Changed Values payload */}
            <div className="border border-gray-100 dark:border-darkBorder rounded-xl bg-gray-50/50 dark:bg-gray-900/40 p-4">
              <h4 className="font-black uppercase tracking-wider text-[10px] text-gray-500 dark:text-gray-400 mb-2">Requested Modifications</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-red-500 mb-1">Previous Values</p>
                  <pre className="text-[10px] font-mono text-gray-600 dark:text-gray-400 truncate max-w-full">
                    {JSON.stringify(selectedReq.previousValues || {}, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="font-bold text-emerald-500 mb-1">Proposed values</p>
                  <pre className="text-[10px] font-mono text-gray-900 dark:text-white truncate max-w-full">
                    {JSON.stringify(selectedReq.newValues || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Comments log */}
            <div className="space-y-2">
              <h4 className="font-black uppercase tracking-wider text-[10px] text-gray-500 dark:text-gray-400">Comments History</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {selectedReq.comments?.length === 0 ? (
                  <p className="text-gray-400 italic">No comments yet.</p>
                ) : (
                  selectedReq.comments?.map((c, i) => (
                    <div key={i} className="p-2 border border-gray-100 dark:border-darkBorder rounded-lg bg-white/20">
                      <p className="font-bold text-gray-900 dark:text-white">{c.user?.username} <span className="text-[9px] text-gray-400 font-normal">at {new Date(c.date).toLocaleString()}</span></p>
                      <p className="text-gray-600 dark:text-gray-300 mt-0.5">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Post comment..."
                  className="flex-1 border border-gray-200 dark:border-darkBorder bg-white/50 dark:bg-gray-900/40 rounded-xl py-1.5 px-3 text-xs focus:outline-none dark:text-white"
                />
                <button type="submit" className="bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-xl">Add</button>
              </form>
            </div>

            {/* Approvals Actions */}
            {selectedReq.status === 'Pending' && (
              <div className="border-t border-gray-150 dark:border-darkBorder pt-4 space-y-3">
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Provide decision remarks..."
                  rows={2}
                  className="block w-full border border-gray-200 dark:border-darkBorder bg-white/50 dark:bg-gray-900/40 rounded-xl py-2 px-3 focus:outline-none dark:text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(selectedReq._id, 'Approved')}
                    disabled={actioning}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl"
                  >
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleAction(selectedReq._id, 'Rejected')}
                    disabled={actioning}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(selectedReq._id, 'Returned for Changes')}
                    disabled={actioning}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-xl"
                  >
                    Return for Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SuperAdminRequestCenter;
