import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { DemoContext } from '../context/DemoContext';
import { ShieldAlert, Check, X, AlertTriangle } from 'lucide-react';

const TeamLeadRequests = () => {
  const { isDemoMode } = useContext(DemoContext);
  const [objections, setObjections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedObjection, setSelectedObjection] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadObjections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/objections');
      setObjections(res.data || []);
    } catch (err) {
      toast.error('Failed to load objections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setObjections([
        {
          _id: 'o1',
          employeeId: { firstName: 'Riya', lastName: 'Sharma', employeeId: 'EMP_103' },
          taskId: { title: 'Implement Recaptcha Enterprise' },
          reason: 'I do not have access to Google Cloud Admin Console to retrieve recaptcha credentials.',
          status: 'Open',
          createdAt: new Date().toISOString()
        }
      ]);
      setLoading(false);
    } else {
      loadObjections();
    }
  }, [isDemoMode]);

  const handleAction = async (decision) => {
    if (!remarks.trim()) {
      toast.error('Remarks/Comments are required');
      return;
    }
    setSubmitting(true);
    try {
      if (isDemoMode) {
        setObjections(prev => prev.map(o => 
          o._id === selectedObjection._id 
            ? { ...o, status: decision === 'Reassign' ? 'Resolved' : 'Rejected', teamLeadResponse: { decision, comments: remarks } }
            : o
        ));
        toast.success(`Objection ${decision === 'Reassign' ? 'Approved' : 'Rejected'} (Demo Mode)!`);
      } else {
        await api.put(`/objections/${selectedGrievance._id}/resolve`, { decision, comments: remarks });
        toast.success(`Objection processed: ${decision}`);
        loadObjections();
      }
      setSelectedObjection(null);
      setRemarks('');
    } catch (err) {
      toast.error('Failed to resolve objection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-cyan-400">Loading Task Objections...</div>;
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      <div className="bg-gradient-to-r from-cyan-500/10 via-[#151A30]/5 to-indigo-500/5 dark:from-[#102025] dark:to-slate-900 border border-cyan-500/20 p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Employee Task Objections ⚙️</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review task assignments that employees have raised objections against. Reassign tasks or reject requests with comments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {objections.map(obj => (
            <div
              key={obj._id}
              onClick={() => setSelectedObjection(obj)}
              className={`glass-card border cursor-pointer p-6 rounded-2xl transition-all ${selectedObjection?._id === obj._id ? 'border-cyan-400 bg-cyan-555/5' : 'border-indigo-500/10 hover:border-cyan-555/20'}`}
            >
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full mb-1 font-mono tracking-widest ${obj.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {obj.status}
                  </span>
                  <h3 className="font-black text-xs text-slate-900 dark:text-white">Task: {obj.taskId?.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Raised by: {obj.employeeId?.firstName} {obj.employeeId?.lastName}</p>
                </div>
                <span className="text-[10px] text-slate-550 font-mono">{new Date(obj.createdAt).toLocaleDateString()}</span>
              </div>

              <p className="text-xs text-slate-650 dark:text-slate-350 mt-3 leading-relaxed">
                <span className="font-bold text-slate-400">Reason:</span> "{obj.reason}"
              </p>

              {obj.teamLeadResponse?.comments && (
                <div className="mt-4 bg-slate-800/40 p-4 rounded-xl border border-indigo-500/5 text-xs">
                  <p className="font-bold text-slate-400 uppercase tracking-widest text-[8px]">TL Response ({obj.teamLeadResponse.decision})</p>
                  <p className="text-slate-350 mt-1 italic">"{obj.teamLeadResponse.comments}"</p>
                </div>
              )}
            </div>
          ))}
          {objections.length === 0 && (
            <div className="p-12 text-center text-slate-500 italic">No task objections registered.</div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card border border-indigo-500/10 rounded-2xl p-6 bg-gradient-to-br from-cyan-500/5 to-indigo-500/5">
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400">Review Objection</h3>
            {selectedObjection ? (
              selectedObjection.status === 'Open' ? (
                <div className="space-y-4 mt-4 text-xs">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Comments / Remarks</label>
                    <textarea
                      rows={4}
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Explain your decision..."
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-indigo-500/20 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction('Reassign')}
                      disabled={submitting}
                      className="flex-1 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                    >
                      Reassign Task
                    </button>
                    <button
                      onClick={() => handleAction('Reject')}
                      disabled={submitting}
                      className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl cursor-pointer"
                    >
                      Reject Objection
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-450 font-semibold mt-4">Objection is already resolved.</p>
              )
            ) : (
              <p className="text-xs text-slate-455 italic mt-4">Select an objection request to action.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLeadRequests;
