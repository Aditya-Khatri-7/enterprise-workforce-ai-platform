import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Users, GitPullRequest, BrainCircuit, Activity, ShieldAlert } from 'lucide-react';

export default function PlatformMetrics() {
  const [counts, setCounts] = useState({
    orgs: 0,
    employees: 0,
    requests: 0,
    aiOps: 0
  });

  useEffect(() => {
    // Animate metrics count up on mount
    let start = 0;
    const duration = 2000;
    const intervalTime = 30;
    const steps = duration / intervalTime;

    const timer = setInterval(() => {
      start += 1 / steps;
      if (start >= 1) {
        clearInterval(timer);
        setCounts({ orgs: 42, employees: 18432, requests: 183, aiOps: 5612 });
      } else {
        setCounts({
          orgs: Math.floor(start * 42),
          employees: Math.floor(start * 18432),
          requests: Math.floor(start * 183),
          aiOps: Math.floor(start * 5612)
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const stats = [
    { label: 'Organizations Online', value: counts.orgs, badge: '+12%', isPositive: true, icon: Server, color: 'text-cyan-400' },
    { label: 'Employees Managed', value: counts.employees.toLocaleString(), badge: '+8.5%', isPositive: true, icon: Users, color: 'text-indigo-400' },
    { label: 'Pending Requests', value: counts.requests, badge: '+5.2%', isPositive: true, icon: GitPullRequest, color: 'text-purple-400' },
    { label: 'AI Operations Today', value: counts.aiOps.toLocaleString(), badge: '+21%', isPositive: true, icon: BrainCircuit, color: 'text-emerald-400' },
    { label: 'System Health', value: '99.98%', badge: 'Excellent', isPositive: true, icon: Activity, color: 'text-cyan-400' },
    { label: 'Security Score', value: 'A+', badge: 'Enterprise Grade', isPositive: true, icon: ShieldAlert, color: 'text-purple-400' }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto z-10 px-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-[10px] text-indigo-400 font-mono tracking-widest font-bold uppercase">LIVE PLATFORM OVERVIEW</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            className="glass-card bg-[#151A30]/80 border border-indigo-500/20 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden backdrop-blur-md"
          >
            {/* Top glass reflection */}
            <div className="absolute top-0 inset-x-0 h-[0.5px] bg-indigo-500/10" />

            <div className="flex justify-between items-start">
              <div className="h-7 w-7 rounded-lg bg-indigo-500/5 border border-indigo-500/15 flex items-center justify-center">
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <span className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded border ${
                item.badge === 'Excellent' || item.badge === 'Enterprise Grade' || item.isPositive
                  ? 'text-cyan-400 bg-cyan-500/5 border-cyan-500/10'
                  : 'text-red-400 bg-red-500/5 border-red-500/10'
              }`}>
                {item.badge}
              </span>
            </div>

            <div className="mt-2 space-y-1">
              <span className="text-[9px] font-bold text-indigo-400 uppercase font-mono tracking-wider block truncate">{item.label}</span>
              <span className="text-lg font-black text-white font-mono block">
                {item.value}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
