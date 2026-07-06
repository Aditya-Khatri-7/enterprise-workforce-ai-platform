import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { DemoContext } from '../context/DemoContext';
import { AuthContext } from '../context/AuthContext';
import { Check, X, Briefcase, User, Info } from 'lucide-react';

const EmployeeProjects = () => {
  const { isDemoMode } = useContext(DemoContext);
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data || []);
    } catch (err) {
      toast.error('Failed to load project list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setProjects([
        {
          _id: 'p1',
          name: 'Employee Portal v2',
          description: 'Rebuild employee workspace platform with futuristic micro-interactions, responsive modules, and custom widgets.',
          department: 'Engineering',
          status: 'Ongoing',
          assignedTeamLead: { firstName: 'Arjun', lastName: 'Mehta' },
          tlAcceptedStatus: 'Accepted',
          employees: [user?.employeeRef?._id || 'emp1'],
          agreedEmployees: [],
          rejectedEmployees: []
        }
      ]);
      setLoading(false);
    } else {
      loadProjects();
    }
  }, [isDemoMode, user]);

  const handleAction = async (id, type) => {
    setActioning(true);
    const empId = user?.employeeRef?._id || 'emp1';
    try {
      if (isDemoMode) {
        setProjects(prev => prev.map(p => {
          if (p._id === id) {
            const agreed = type === 'agree' ? [...p.agreedEmployees, empId] : p.agreedEmployees.filter(e => e !== empId);
            const rejected = type === 'reject' ? [...p.rejectedEmployees, empId] : p.rejectedEmployees.filter(e => e !== empId);
            return { ...p, agreedEmployees: agreed, rejectedEmployees: rejected };
          }
          return p;
        }));
        toast.success(`Project ${type === 'agree' ? 'Accepted' : 'Rejected'} (Demo Mode)!`);
      } else {
        await api.put(`/projects/${id}/${type}`);
        toast.success(`Project assignment registered as ${type === 'agree' ? 'agreed' : 'rejected'}!`);
        loadProjects();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-emerald-400">Loading Assigned Projects...</div>;
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      <div className="bg-gradient-to-r from-emerald-500/10 via-[#151A30]/5 to-teal-500/5 dark:from-[#102518] dark:to-slate-900 border border-emerald-500/20 p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Assigned Team Projects 💼</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review active and pending assignments mapped to your development unit. Confirm your agreement or object individually.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {projects.map(proj => {
          const empId = user?.employeeRef?._id || 'emp1';
          const hasAgreed = proj.agreedEmployees?.includes(empId) || proj.agreedEmployees?.some(e => e === empId || e._id === empId);
          const hasRejected = proj.rejectedEmployees?.includes(empId) || proj.rejectedEmployees?.some(e => e === empId || e._id === empId);

          return (
            <div key={proj._id} className="glass-card border border-indigo-500/10 p-6 rounded-3xl space-y-4 bg-white/40 dark:bg-[#151A30]/40">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-emerald-400" />
                    {proj.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Led by: <span className="font-bold">{proj.assignedTeamLead?.firstName} {proj.assignedTeamLead?.lastName}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${proj.tlAcceptedStatus === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    TL: {proj.tlAcceptedStatus}
                  </span>
                  {hasAgreed && (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      You Agreed
                    </span>
                  )}
                  {hasRejected && (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
                      You Rejected
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                {proj.description}
              </p>

              {proj.tlAcceptedStatus === 'Accepted' ? (
                !hasAgreed && !hasRejected ? (
                  <div className="pt-4 border-t border-slate-100 dark:border-indigo-500/10 flex justify-end gap-3">
                    <button
                      onClick={() => handleAction(proj._id, 'reject')}
                      disabled={actioning}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-405 dark:text-red-400 font-bold rounded-xl text-xs cursor-pointer border border-red-500/20"
                    >
                      Reject Assignment
                    </button>
                    <button
                      onClick={() => handleAction(proj._id, 'agree')}
                      disabled={actioning}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Accept Assignment
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-100 dark:border-indigo-500/10 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Info className="h-3.5 w-3.5" />
                    You have registered your response for this project. If you need to revert, contact your Team Lead.
                  </div>
                )
              ) : (
                <div className="pt-4 border-t border-slate-100 dark:border-indigo-500/10 text-[10px] text-amber-500 italic">
                  Waiting for your Team Lead to accept the project before team verification begins.
                </div>
              )}
            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="p-12 text-center text-slate-505 italic">No active projects assigned to your team.</div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProjects;
