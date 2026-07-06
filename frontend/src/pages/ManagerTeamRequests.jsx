import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { DemoContext } from '../context/DemoContext';
import { Check, Users, ShieldCheck, AlertCircle } from 'lucide-react';

const ManagerTeamRequests = () => {
  const { isDemoMode } = useContext(DemoContext);
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [reqRes, empRes] = await Promise.all([
        api.get('/projects/team-requests').catch(() => ({ data: [] })),
        api.get('/employees').catch(() => ({ data: [] }))
      ]);
      setRequests(reqRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      toast.error('Failed to load team change requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setRequests([
        {
          _id: 'tr1',
          type: 'ChangeTeamLead',
          currentTeamLead: { _id: 'tl2', firstName: 'Sneha', lastName: 'Gupta', employeeId: 'TL002' },
          requestedTeamLead: { _id: 'tl1', firstName: 'Arjun', lastName: 'Mehta', employeeId: 'TL001' },
          employeesAgreed: [
            { _id: 'emp4', firstName: 'Amit', lastName: 'Verma' },
            { _id: 'emp5', firstName: 'Neha', lastName: 'Joshi' }
          ],
          status: 'Pending',
          comments: 'The team prefers working under Arjun Mehta due to alignment in mobile development technologies.'
        }
      ]);
      setEmployees([
        { _id: 'emp4', firstName: 'Amit', lastName: 'Verma', reportingManager: 'tl2' },
        { _id: 'emp5', firstName: 'Neha', lastName: 'Joshi', reportingManager: 'tl2' },
        { _id: 'emp6', firstName: 'Rohit', lastName: 'Das', reportingManager: 'tl2' }
      ]);
      setLoading(false);
    } else {
      loadRequests();
    }
  }, [isDemoMode]);

  const handleApprove = async (id, req) => {
    // Check 2/3 consensus
    const teamLeadId = req.currentTeamLead?._id;
    const teamMembers = employees.filter(e => e.reportingManager === teamLeadId || e.reportingManager?._id === teamLeadId);
    const totalCount = teamMembers.length || 3; // Mock default size if 0
    const agreedCount = req.employeesAgreed?.length || 0;

    if (agreedCount / totalCount < 2 / 3) {
      toast.error(`Cannot approve: Needs at least 2/3 agreement (${Math.ceil(totalCount * 2/3)} votes). Current is ${agreedCount}/${totalCount}`);
      return;
    }

    setActioning(true);
    try {
      if (isDemoMode) {
        setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'Approved' } : r));
        toast.success('Team Lead changed successfully (Demo Mode)!');
      } else {
        await api.put(`/projects/team-requests/${id}/approve`);
        toast.success('Leadership request approved, team reassigned!');
        loadRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed');
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-teal-400">Loading Leadership Requests...</div>;
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      <div className="bg-gradient-to-r from-teal-500/10 via-[#151A30]/5 to-indigo-500/5 dark:from-[#102520] dark:to-slate-900 border border-teal-500/20 p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Leadership Change approvals 🗳️</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review team-initiated polls and votes to replace team leaders. Department Manager approval requires a 2/3 democratic majority consensus.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {requests.map(req => {
          const teamLeadId = req.currentTeamLead?._id;
          const teamMembers = employees.filter(e => e.reportingManager === teamLeadId || e.reportingManager?._id === teamLeadId);
          const totalCount = teamMembers.length || 3;
          const agreedCount = req.employeesAgreed?.length || 0;
          const percent = Math.min(100, Math.round((agreedCount / totalCount) * 100));
          const hasMajority = (agreedCount / totalCount) >= 2/3;

          return (
            <div key={req._id} className="glass-card border border-indigo-500/10 p-6 rounded-2xl space-y-4 bg-white/40 dark:bg-[#151A30]/40">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-teal-400" />
                    Replace Lead: {req.currentTeamLead?.firstName} {req.currentTeamLead?.lastName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Proposed New Lead: <span className="text-cyan-400 font-bold">{req.requestedTeamLead?.firstName} {req.requestedTeamLead?.lastName}</span></p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  {req.status}
                </span>
              </div>

              <div className="bg-black/20 p-4 rounded-xl border border-indigo-500/5 text-xs space-y-2">
                <p className="font-bold text-slate-400 uppercase tracking-widest text-[8px]">Consensus Poll Status ({percent}%)</p>
                <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden relative">
                  <div className={`h-full transition-all ${hasMajority ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${percent}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Votes Registered: {agreedCount} / {totalCount}</span>
                  <span>Required: {Math.ceil(totalCount * 2/3)} (2/3 majority)</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-350 italic bg-slate-900/30 p-3 rounded-lg border-l-2 border-teal-500">
                "{req.comments}"
              </div>

              {req.status === 'Pending' && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] flex items-center gap-1 text-amber-505 font-bold">
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                    {hasMajority ? '2/3 Majority reached. Ready for Manager approval.' : 'Awaiting democratic majority.'}
                  </span>
                  <button
                    onClick={() => handleApprove(req._id, req)}
                    disabled={actioning || !hasMajority}
                    className="px-4 py-2 bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50"
                  >
                    Approve Leadership Swap
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {requests.length === 0 && (
          <div className="p-8 text-center text-slate-500 italic">No leadership change request polls found.</div>
        )}
      </div>
    </div>
  );
};

export default ManagerTeamRequests;
