import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { DemoContext } from '../context/DemoContext';
import { AuthContext } from '../context/AuthContext';
import { History, Calendar, CheckCircle, Clock } from 'lucide-react';

const EmployeeHistory = () => {
  const { isDemoMode } = useContext(DemoContext);
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate historical audit-like logs for the employee
    if (isDemoMode) {
      setLogs([
        { id: 1, action: 'PROJECT_COMPLETED', target: 'Client Onboarding Dashboard', date: '2026-06-15', desc: 'Successfully finalized UX modules and state managers.' },
        { id: 2, action: 'TASK_COMPLETED', target: 'Setup OAuth2 Auth Flow', date: '2026-06-08', desc: 'Configured cookies-based JWT exchanges and routing rules.' },
        { id: 3, action: 'PROJECT_JOINED', target: 'Employee Portal v2', date: '2026-05-20', desc: 'Assigned to core development under Arjun Mehta.' }
      ]);
      setLoading(false);
    } else if (user) {
      // Fetch user's audit logs from API
      api.get('/audit')
        .then(res => {
          setLogs((res.data || []).map((l, i) => ({
            id: i,
            action: l.action,
            target: l.details?.target || 'Workspace',
            date: new Date(l.createdAt).toLocaleDateString(),
            desc: l.details?.reason || l.details?.description || 'Operational log entry.'
          })));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isDemoMode, user]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-cyan-400">Loading History Log...</div>;
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white font-sans">
      <div className="bg-gradient-to-r from-indigo-500/10 via-[#151A30]/5 to-purple-500/5 dark:from-[#181025] dark:to-slate-900 border border-indigo-500/20 p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Workspace History Log 📜</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit log of your historical contributions, completed sprint tasks, and project milestones.</p>
      </div>

      <div className="relative border-l border-slate-200 dark:border-indigo-500/20 ml-4 space-y-6">
        {logs.map(log => (
          <div key={log.id} className="relative pl-6">
            <span className="absolute -left-2.5 top-1.5 p-1 bg-indigo-650 rounded-full border-4 border-[#0F172A]"><History className="h-3 w-3 text-cyan-400" /></span>
            <div className="glass-card border border-indigo-500/10 p-5 rounded-2xl bg-white/40 dark:bg-[#151A30]/40 space-y-2">
              <div className="flex justify-between items-center flex-wrap gap-2 text-[10px] text-slate-450 font-mono">
                <span className="font-bold text-cyan-500">{log.action}</span>
                <span>{log.date}</span>
              </div>
              <h3 className="font-black text-xs text-slate-900 dark:text-white mt-1">{log.target}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">{log.desc}</p>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="pl-6 text-slate-500 italic">No history log records found.</div>
        )}
      </div>
    </div>
  );
};

export default EmployeeHistory;
