import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { DemoContext } from '../context/DemoContext';
import { GitPullRequest, Check, X, AlertCircle } from 'lucide-react';

const ManagerProjectRequests = () => {
  const { isDemoMode } = useContext(DemoContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects/requests');
      setRequests(res.data || []);
    } catch (err) {
      toast.error('Failed to load project requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setRequests([
        {
          _id: 'pr1',
          type: 'EmployeeRequest',
          teamLead: { firstName: 'Arjun', lastName: 'Mehta', employeeId: 'TL001' },
          currentProject: { name: 'Employee Portal v2' },
          requestedProject: { name: 'Cloud Migration' },
          employeesAgreed: [
            { firstName: 'Riya', lastName: 'Sharma' },
            { firstName: 'Karan', lastName: 'Patel' }
          ],
          status: 'Pending_Dept_Approval',
          comments: 'Requesting project swap due to technical stack alignment.'
        }
      ]);
      setLoading(false);
    } else {
      loadRequests();
    }
  }, [isDemoMode]);

  const handleApprove = async (id) => {
    setActioning(true);
    try {
      if (isDemoMode) {
        setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'Approved' } : r));
        toast.success('Approved successfully (Demo Mode)!');
      } else {
        await api.put(`/projects/requests/${id}/dept-approve`);
        toast.success('Project request approved successfully!');
        loadRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed');
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-orange-400">Loading Project Requests...</div>;
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      <div className="bg-gradient-to-r from-orange-500/10 via-[#151A30]/5 to-yellow-500/5 dark:from-[#251810] dark:to-slate-900 border border-orange-500/20 p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Project Modification Requests ⚙️</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Approve or audit project swap requests, team transfers, and work alignments submitted by team leads.</p>
      </div>

      <div className="glass-card border border-indigo-500/10 rounded-2xl overflow-hidden bg-white/40 dark:bg-[#151A30]/40">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-indigo-500/15">
            <thead className="bg-slate-100 dark:bg-[#0e1227] uppercase text-[10px] font-bold text-slate-400">
              <tr>
                <th className="px-6 py-3.5 text-left">Team Lead</th>
                <th className="px-6 py-3.5 text-left">Current Project</th>
                <th className="px-6 py-3.5 text-left">Requested Swap</th>
                <th className="px-6 py-3.5 text-left">Agreed Employees</th>
                <th className="px-6 py-3.5 text-left">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-indigo-500/10">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 italic">No project requests pending approval.</td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req._id} className="hover:bg-slate-50/50 dark:hover:bg-[#121632]/25 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{req.teamLead?.firstName} {req.teamLead?.lastName}</p>
                      <p className="text-[10px] text-slate-400">{req.teamLead?.employeeId}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                      {req.currentProject?.name || 'None'}
                    </td>
                    <td className="px-6 py-4 font-black text-cyan-400">
                      {req.requestedProject?.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {req.employeesAgreed?.map((e, idx) => (
                        <span key={idx} className="inline-block bg-slate-800 text-slate-300 text-[9px] px-2 py-0.5 rounded-full mr-1 mb-1 font-mono">
                          {e.firstName} {e.lastName}
                        </span>
                      ))}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'Pending_Dept_Approval' && (
                        <button
                          onClick={() => handleApprove(req._id)}
                          disabled={actioning}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] cursor-pointer inline-flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerProjectRequests;
