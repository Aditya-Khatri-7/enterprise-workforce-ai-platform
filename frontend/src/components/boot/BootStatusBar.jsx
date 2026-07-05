import React, { useState, useEffect } from 'react';
import { Network, Database, Activity, Cpu } from 'lucide-react';

export default function BootStatusBar({ progress }) {
  const [stats, setStats] = useState({
    cpu: '0%',
    ram: '0.0 GB',
    latency: '0 ms'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate slight realistic metric changes
      const randomCpu = Math.floor(Math.random() * 15) + 5;
      const randomRam = (4.2 + Math.random() * 0.4).toFixed(1);
      const randomLat = Math.floor(Math.random() * 8) + 12;

      setStats({
        cpu: `${progress >= 100 ? '4%' : `${randomCpu}%`}`,
        ram: `${randomRam} GB`,
        latency: `${randomLat} ms`
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [progress]);

  return (
    <div className="glass-card bg-slate-950/90 border border-indigo-500/25 rounded-2xl px-6 py-3 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] text-indigo-400 backdrop-blur-3xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[0.5px] bg-indigo-500/10" />

      {/* Latency & Network */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          CPU: <span className="text-white font-semibold">{stats.cpu}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-indigo-400" />
          RAM: <span className="text-white font-semibold">{stats.ram}</span>
        </span>
      </div>

      {/* Latency */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Network className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
          LATENCY: <span className="text-white font-semibold">{stats.latency}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-emerald-400" />
          DB: <span className="text-emerald-400 font-bold uppercase">Connected</span>
        </span>
      </div>

      {/* OS info */}
      <div className="flex items-center gap-4">
        <span>CORE: <span className="text-white font-semibold">v2.1.0-prod</span></span>
        <span>BUILD: <span className="text-white font-semibold">#498-A</span></span>
      </div>
    </div>
  );
}
