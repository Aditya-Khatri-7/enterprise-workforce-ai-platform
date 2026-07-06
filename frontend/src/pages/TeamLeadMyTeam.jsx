import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { DemoContext, DemoProgressContext } from '../context/DemoContext';
import { AuthContext } from '../context/AuthContext';
import { Users, Award, Briefcase, Clock, Activity, Check } from 'lucide-react';

const TeamLeadMyTeam = () => {
  const { isDemoMode } = useContext(DemoContext);
  const { user } = useContext(AuthContext);
  const { progressStore } = useContext(DemoProgressContext);
  
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const tlRef = user?.employeeRef?._id || user?.employeeRef;
      const [empRes, projRes] = await Promise.all([
        api.get('/employees').catch(() => ({ data: [] })),
        api.get('/projects').catch(() => ({ data: [] }))
      ]);

      const allEmps = empRes.data || [];
      const myTeam = allEmps.filter(e => e.reportingManager === tlRef || e.reportingManager?._id === tlRef);
      setEmployees(myTeam);

      const allProjs = projRes.data || [];
      const myProj = allProjs.filter(p => p.assignedTeamLead === tlRef || p.assignedTeamLead?._id === tlRef);
      setProjects(myProj);
    } catch (err) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      setEmployees([
        { _id: 'emp1', firstName: 'Riya', lastName: 'Sharma', employeeId: 'EMP101', designation: 'Developer', ratings: { teamLeadRating: 4.5, managerRating: 4.2 } },
        { _id: 'emp2', firstName: 'Karan', lastName: 'Patel', employeeId: 'EMP102', designation: 'Developer', ratings: { teamLeadRating: 4.0, managerRating: 3.8 } },
        { _id: 'emp3', firstName: 'Priya', lastName: 'Singh', employeeId: 'EMP103', designation: 'Developer', ratings: { teamLeadRating: 3.5, managerRating: 3.9 } }
      ]);
      setProjects([
        { _id: 'p1', name: 'Employee Portal v2', description: 'Upgraded employee self-service portal', status: 'Ongoing', pendingAgreement: false, agreedEmployees: ['emp1', 'emp2'] }
      ]);
      setLoading(false);
    } else {
      loadData();
    }
  }, [isDemoMode]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-cyan-400">Loading Team Details...</div>;
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      <div className="bg-gradient-to-r from-blue-500/10 via-[#151A30]/5 to-indigo-500/5 dark:from-[#101825] dark:to-slate-900 border border-blue-500/20 p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">My Supervised Team & Progress 🚀</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Coordinate daily development sprint operations, monitor individual task completion rates, and manage assignments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card border border-indigo-500/10 p-6 rounded-2xl bg-white/40 dark:bg-[#151A30]/40 space-y-4">
            <h3 className="text-sm font-black uppercase text-cyan-400 tracking-wider">Team Members List</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employees.map(emp => {
                const prog = progressStore[emp._id] || (emp._id === 'emp1' ? 65 : emp._id === 'emp2' ? 80 : 40);
                return (
                  <div key={emp._id} className="bg-black/30 border border-indigo-500/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{emp.firstName} {emp.lastName}</h4>
                        <p className="text-[9px] text-slate-400 font-mono">{emp.employeeId}</p>
                      </div>
                      <span className="p-1 text-[9px] bg-slate-800 rounded font-bold uppercase tracking-wider text-slate-350">{emp.designation}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>Sprint Task Progress</span>
                        <span className="font-bold text-cyan-400">{prog}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-455" style={{ width: `${prog}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card border border-indigo-500/10 p-6 rounded-2xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-blue-600 dark:text-cyan-400">Active Project Assignment</h3>
            {projects.map(proj => (
              <div key={proj._id} className="space-y-3 bg-black/25 p-4 rounded-xl border border-indigo-500/10">
                <h4 className="font-black text-xs text-slate-900 dark:text-white">{proj.name}</h4>
                <p className="text-[10px] text-slate-400">{proj.description}</p>
                <div className="border-t border-slate-100 dark:border-indigo-500/10 pt-3 flex justify-between items-center text-[9px] text-slate-500 font-semibold uppercase">
                  <span>Status: <span className="text-emerald-400 font-black">{proj.status}</span></span>
                  <span>Agreed: {proj.agreedEmployees?.length || 0} / {employees.length}</span>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-xs text-slate-450 italic">No active projects assigned to this team lead currently.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLeadMyTeam;
