import React from 'react';
import { ShieldCheck, Activity, Wifi, Disc } from 'lucide-react';

export default function SystemStatus() {
  const statusItems = [
    { name: 'Gateway API', status: 'Online', color: 'bg-emerald-400' },
    { name: 'Database DB', status: 'Connected', color: 'bg-emerald-400' },
    { name: 'Auth Node', status: 'Secure', color: 'bg-emerald-400' },
    { name: 'Notif Queue', status: 'Active', color: 'bg-emerald-400' },
    { name: 'Cognitive AI', status: 'Ready', color: 'bg-emerald-400' },
    { name: 'Storage Node', status: 'Active', color: 'bg-amber-400' }, // Amber warning/simulated
    { name: 'CDN Cache', status: 'Synced', color: 'bg-emerald-400' }
  ];

  return (
    <div className="glass-card bg-[#151A30]/80 border border-indigo-500/20 dark:border-indigo-500/30 rounded-2xl p-4 space-y-3 shadow-xl backdrop-blur-3xl w-full">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      
      {/* Title */}
      <div className="flex items-center gap-1.5 border-b border-indigo-500/10 pb-2 mb-2 font-mono text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
        <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
        <span>Enterprise Node Health</span>
      </div>

      {/* Grid of indicators */}
      <div className="space-y-2">
        {statusItems.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-[10px] font-mono text-slate-350">
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${item.color} animate-pulse`} />
              {item.name}
            </span>
            <span className="text-white font-bold opacity-90">{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
