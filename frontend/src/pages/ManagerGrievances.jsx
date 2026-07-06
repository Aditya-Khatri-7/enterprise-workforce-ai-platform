import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { DemoContext } from '../context/DemoContext';
import { ShieldAlert, CheckCircle, MessageSquare } from 'lucide-react';

const ManagerGrievances = () => {
  const { isDemoMode } = useContext(DemoContext);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadGrievances = async () => {
    try {
      setLoading(true);
      const res = await api.get('/grievances');
      setGrievances(res.data || []);
    } catch (err) {
      toast.error('Failed to load grievances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setGrievances([
        {
          _id: 'g1',
          employee: { firstName: 'Riya', lastName: 'Sharma', department: 'Engineering', employeeId: 'EMP_103' },
          title: 'Infrastructure issues and access delays',
          description: 'The AWS sandbox environment access is taking several days to renew, blocking my sprint development and deployments.',
          status: 'Pending',
          createdAt: new Date().toISOString()
        }
      ]);
      setLoading(false);
    } else {
      loadGrievances();
    }
  }, [isDemoMode]);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionText.trim()) {
      toast.error('Resolution details are required');
      return;
    }
    setSubmitting(true);
    try {
      if (isDemoMode) {
        setGrievances(prev => prev.map(g => 
          g._id === selectedGrievance._id 
            ? { ...g, status: 'Resolved', resolution: resolutionText } 
            : g
        ));
        toast.success('Grievance resolved successfully (Demo Mode)!');
      } else {
        await api.put(`/grievances/${selectedGrievance._id}/resolve`, { resolution: resolutionText });
        toast.success('Grievance resolved successfully!');
        loadGrievances();
      }
      setSelectedGrievance(null);
      setResolutionText('');
    } catch (err) {
      toast.error('Failed to resolve grievance');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-red-400">Loading Grievances...</div>;
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      <div className="bg-gradient-to-r from-red-500/10 via-[#151A30]/5 to-pink-500/5 dark:from-[#251010] dark:to-slate-900 border border-red-500/20 p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Employee Grievances Ledger ⚖️</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review operational, professional, and environmental issues raised by employees. Provide direct resolutions and track logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {grievances.map(g => (
            <div
              key={g._id}
              onClick={() => setSelectedGrievance(g)}
              className={`glass-card border cursor-pointer p-6 rounded-2xl transition-all ${selectedGrievance?._id === g._id ? 'border-red-400 bg-red-500/5' : 'border-indigo-500/10 hover:border-red-500/20'}`}
            >
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full mb-1 font-mono tracking-widest ${g.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {g.status}
                  </span>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">{g.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Raised by: {g.employee?.firstName} {g.employee?.lastName} ({g.employee?.department})</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{new Date(g.createdAt).toLocaleDateString()}</span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-350 mt-3 leading-relaxed">
                {g.description}
              </p>

              {g.resolution && (
                <div className="mt-4 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 text-xs">
                  <p className="font-bold text-emerald-400 uppercase tracking-widest text-[8px]">Resolution Details</p>
                  <p className="text-slate-650 dark:text-slate-300 mt-1 italic">"{g.resolution}"</p>
                </div>
              )}
            </div>
          ))}
          {grievances.length === 0 && (
            <div className="p-12 text-center text-slate-500 italic">No employee grievances recorded.</div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card border border-indigo-500/10 rounded-2xl p-6 bg-gradient-to-br from-red-500/5 to-indigo-500/5">
            <h3 className="text-sm font-black uppercase tracking-wider text-red-500">Provide resolution</h3>
            {selectedGrievance ? (
              selectedGrievance.status === 'Pending' ? (
                <form onSubmit={handleResolve} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Resolution Actions</label>
                    <textarea
                      rows={5}
                      required
                      value={resolutionText}
                      onChange={e => setResolutionText(e.target.value)}
                      placeholder="Enter grievance resolution plan or mitigation steps..."
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-indigo-500/20 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-650 hover:bg-red-750 text-white cursor-pointer"
                  >
                    {submitting ? 'Resolving...' : 'Submit Resolution'}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-emerald-450 font-semibold mt-4">This grievance has already been resolved.</p>
              )
            ) : (
              <p className="text-xs text-slate-450 italic mt-4">Select a grievance request to input resolution actions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerGrievances;
