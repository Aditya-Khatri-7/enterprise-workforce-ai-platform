import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Server, Activity, Users } from 'lucide-react';

export default function BootMetrics({ progress }) {
  const [metrics, setMetrics] = useState({
    orgs: 0,
    employees: 0,
    tasks: 0,
    aiOps: 0
  });

  useEffect(() => {
    // Animate counters matching the progress bar
    const factor = progress / 100;
    setMetrics({
      orgs: Math.floor(factor * 12) + 1,
      employees: Math.floor(factor * 1420) + 80,
      tasks: Math.floor(factor * 34),
      aiOps: Math.floor(factor * 5620) + 120
    });
  }, [progress]);

  return (
    <div className="space-y-4">
      {/* Platform Uptime & Health */}
      <div className="glass-card bg-slate-950/60 border border-indigo-500/25 rounded-2xl p-4 space-y-3 backdrop-blur-3xl">
        <div className="flex justify-between items-center text-[10px] text-indigo-400 font-mono font-bold uppercase">
          <span className="flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
            System Performance
          </span>
          <span>Health: {Math.min(60 + Math.floor(progress * 0.4), 100)}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-950 border border-indigo-500/10 h-2 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Grid of Metric Widgets */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Tenants Online', value: metrics.orgs, icon: Server, color: 'text-cyan-400' },
          { label: 'Staff Directory', value: metrics.employees, icon: Users, color: 'text-indigo-400' },
          { label: 'Tasks Running', value: metrics.tasks, icon: Activity, color: 'text-purple-400' },
          { label: 'AI Operations', value: metrics.aiOps, icon: ShieldCheck, color: 'text-emerald-400' }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            className="glass-card bg-slate-950/70 border border-indigo-500/20 rounded-2xl p-4 flex flex-col justify-between h-24 backdrop-blur-3xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/2 rounded-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-indigo-400 uppercase font-mono tracking-wider">{item.label}</span>
              <item.icon className={`h-4 w-4 ${item.color} opacity-80`} />
            </div>
            <div className="text-xl font-black text-white font-mono mt-1">
              {item.value.toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
