import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, LogOut, RefreshCw, Compass, 
  RotateCcw, Terminal, X, Cpu, Server, HardDrive, 
  Activity, Users, FileText, DollarSign, Cloud, Bell, HelpCircle 
} from 'lucide-react';
import { soundManager } from '../../utils/soundManager';

import { DemoContext } from '../../context/DemoContext';

export default function DemoBadge() {
  const { setUser } = useContext(AuthContext);
  const { demoRole } = useContext(DemoContext);
  const navigate = useNavigate();
  const activeRole = demoRole || 'Super Admin';

  const [showConsole, setShowConsole] = useState(false);
  const [cpuVal, setCpuVal] = useState(12);
  const [gpuVal, setGpuVal] = useState(8);
  const [memoryVal, setMemoryVal] = useState(2.4);

  // Fluctuating vitals effect
  useEffect(() => {
    if (!showConsole) return;
    const interval = setInterval(() => {
      setCpuVal(Math.floor(Math.random() * 15) + 8);
      setGpuVal(Math.floor(Math.random() * 10) + 4);
      setMemoryVal(Number((Math.random() * 0.4 + 2.2).toFixed(2)));
    }, 2000);
    return () => clearInterval(interval);
  }, [showConsole]);

  const handleExitDemo = () => {
    soundManager.playClick();
    localStorage.removeItem('ewap_demo_mode');
    localStorage.removeItem('ewap_demo_role');
    localStorage.removeItem('ewap_tour_complete');
    setUser(null);
    navigate('/welcome');
  };

  const handleSwitchRole = () => {
    soundManager.playClick();
    navigate('/demo');
  };

  const handleResetDemo = () => {
    soundManager.playClick();
    localStorage.removeItem('ewap_tour_complete');
    window.location.reload();
  };

  const startTour = () => {
    soundManager.playClick();
    localStorage.removeItem('ewap_tour_complete');
    window.dispatchEvent(new Event('restart_guided_tour'));
  };

  return (
    <>
      {/* Showcase Bottom macOS-style Dock Toolbar */}
      <motion.div
        id="tour-toolbar"
        initial={{ y: 80, x: '-50%', opacity: 0 }}
        animate={{ y: 0, x: '-50%', opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
        className="fixed bottom-6 left-1/2 z-50 w-auto max-w-[95vw] lg:max-w-max bg-white/20 dark:bg-[#151A30]/18 border border-white/15 dark:border-indigo-500/10 backdrop-blur-xl rounded-2xl px-5 py-3 shadow-2xl flex flex-wrap items-center gap-4 text-slate-800 dark:text-white font-sans text-xs select-none hover:border-cyan-400/30 hover:shadow-glow-indigo transition-all duration-300"
      >
        <div className="absolute top-0 inset-x-0 h-[0.5px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <div className="flex items-center gap-1 text-[9px] text-cyan-600 dark:text-cyan-400 font-mono tracking-widest font-black uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Showcase Mode</span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-slate-300 dark:bg-indigo-500/25 hidden sm:block" />

        {/* Current Active Persona */}
        <div className="font-semibold text-slate-650 dark:text-slate-300 text-[11px]">
          Role: <span className="text-indigo-850 dark:text-white font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{activeRole}</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-300 dark:bg-indigo-500/25" />

        {/* Showcase Dock Actions */}
        <div className="flex items-center gap-2">
          {/* Switch Persona */}
          <motion.button
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSwitchRole}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-indigo-500/20 bg-slate-50/20 dark:bg-[#1A1F3C]/50 hover:bg-slate-200/50 dark:hover:bg-[#1A1F3C] text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white transition-all font-bold"
            title="Switch active user role"
          >
            <RefreshCw className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
            <span className="hidden md:inline">Switch Role</span>
          </motion.button>

          {/* Start Tour */}
          <motion.button
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={startTour}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-indigo-500/20 bg-slate-50/20 dark:bg-[#1A1F3C]/50 hover:bg-slate-200/50 dark:hover:bg-[#1A1F3C] text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white transition-all font-bold"
            title="Relaunch onboarding overview"
          >
            <Compass className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="hidden md:inline">Restart Tour</span>
          </motion.button>

          {/* Command Center Mission Control Overlay Trigger */}
          <motion.button
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { soundManager.playClick(); setShowConsole(true); }}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-indigo-500/20 bg-slate-50/20 dark:bg-[#1A1F3C]/50 hover:bg-slate-200/50 dark:hover:bg-[#1A1F3C] text-slate-700 dark:text-slate-355 hover:text-slate-900 dark:hover:text-white transition-all font-bold"
            title="Open Mission Control Telemetry console"
          >
            <Terminal className="h-3.5 w-3.5 text-purple-550 dark:text-purple-400" />
            <span className="hidden md:inline">Mission Control</span>
          </motion.button>

          {/* Reset State */}
          <motion.button
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleResetDemo}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-indigo-500/20 bg-slate-50/20 dark:bg-[#1A1F3C]/50 hover:bg-slate-200/50 dark:hover:bg-[#1A1F3C] text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white transition-all font-bold"
            title="Reset dynamic MOCK datastore"
          >
            <RotateCcw className="h-3.5 w-3.5 text-yellow-605 dark:text-yellow-400" />
            <span className="hidden md:inline">Reset Demo</span>
          </motion.button>

          {/* Exit Showcase */}
          <motion.button
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExitDemo}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/25 transition-all font-bold animate-pulse hover:animate-none"
            title="Leave Enterprise Showcase"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Exit Demo</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Full-Screen Mission Control Terminal Console Overlay */}
      <AnimatePresence>
        {showConsole && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-[#070914]/96 backdrop-blur-lg overflow-y-auto p-6 sm:p-10 font-mono text-white flex flex-col justify-between"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-indigo-500/15 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                  <Terminal className="h-5 w-5 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-widest uppercase">EWAP MISSION CONTROL</h1>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">Real-Time Core System Telemetry</p>
                </div>
              </div>
              <button 
                onClick={() => { soundManager.playClick(); setShowConsole(false); }}
                className="h-10 w-10 border border-indigo-500/20 bg-[#151A30]/50 hover:bg-red-500/20 text-slate-350 hover:text-white rounded-xl flex items-center justify-center transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Grid Core Panels */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 my-4 text-xs font-medium">
              
              {/* Column 1: Server Vitals Telemetry */}
              <div className="glass-card bg-[#121B3A]/40 border border-indigo-500/25 p-5 rounded-2xl space-y-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-cyan-400 uppercase tracking-widest text-[10px] border-b border-indigo-500/10 pb-2 mb-4 flex items-center gap-1.5">
                    <Cpu className="h-4 w-4" /> System Core Status
                  </h3>
                  <div className="space-y-4">
                    {/* CPU */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold"><span>CPU Usage:</span><span className="text-cyan-400">{cpuVal}%</span></div>
                      <div className="w-full bg-slate-950 border border-indigo-500/15 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500" style={{ width: `${cpuVal}%` }} />
                      </div>
                    </div>
                    {/* GPU */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold"><span>GPU Rendering:</span><span className="text-cyan-400">{gpuVal}%</span></div>
                      <div className="w-full bg-slate-950 border border-indigo-500/15 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${gpuVal * 4}%` }} style={{ width: `${gpuVal}%` }} />
                      </div>
                    </div>
                    {/* Memory */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold"><span>RAM Allocation:</span><span className="text-cyan-400">{memoryVal} GB / 8.0 GB</span></div>
                      <div className="w-full bg-slate-950 border border-indigo-500/15 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500" style={{ width: `${(memoryVal / 8) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 border-t border-indigo-500/10 pt-4 font-mono text-[10px] text-slate-400">
                  <div className="flex justify-between"><span>Network Latency:</span><span className="text-emerald-400 font-bold">12 ms</span></div>
                  <div className="flex justify-between"><span>Active WebSockets:</span><span className="text-white font-bold">4 Nodes</span></div>
                  <div className="flex justify-between"><span>Cloudinary Sync:</span><span className="text-emerald-400 font-bold">Active</span></div>
                </div>
              </div>

              {/* Column 2: Gateway Services Controllers */}
              <div className="glass-card bg-[#121B3A]/40 border border-indigo-500/25 p-5 rounded-2xl space-y-4">
                <h3 className="font-black text-cyan-400 uppercase tracking-widest text-[10px] border-b border-indigo-500/10 pb-2 mb-4 flex items-center gap-1.5">
                  <Server className="h-4 w-4" /> Active APIs & Services
                </h3>
                <div className="space-y-3 font-mono text-[11px]">
                  <div className="flex justify-between p-2.5 border border-indigo-500/10 rounded-xl bg-slate-950/20">
                    <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-emerald-400" /> Authentication API</span>
                    <span className="text-emerald-400 font-bold">OK (200)</span>
                  </div>
                  <div className="flex justify-between p-2.5 border border-indigo-500/10 rounded-xl bg-slate-950/20">
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-emerald-400" /> Employee Manager Node</span>
                    <span className="text-emerald-400 font-bold">OK (200)</span>
                  </div>
                  <div className="flex justify-between p-2.5 border border-indigo-500/10 rounded-xl bg-slate-950/20">
                    <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Payroll Controller</span>
                    <span className="text-emerald-400 font-bold">OK (200)</span>
                  </div>
                  <div className="flex justify-between p-2.5 border border-indigo-500/10 rounded-xl bg-slate-950/20">
                    <span className="flex items-center gap-1.5"><Cloud className="h-3.5 w-3.5 text-emerald-400" /> Assets Sync Engine</span>
                    <span className="text-emerald-400 font-bold">OK (200)</span>
                  </div>
                  <div className="flex justify-between p-2.5 border border-indigo-500/10 rounded-xl bg-slate-950/20">
                    <span className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5 text-emerald-400" /> Push Notifications Hub</span>
                    <span className="text-emerald-400 font-bold">OK (200)</span>
                  </div>
                </div>
              </div>

              {/* Column 3: Live System Activity Timeline */}
              <div className="glass-card bg-[#121B3A]/40 border border-indigo-500/25 p-5 rounded-2xl space-y-4">
                <h3 className="font-black text-cyan-400 uppercase tracking-widest text-[10px] border-b border-indigo-500/10 pb-2 mb-4 flex items-center gap-1.5">
                  <HardDrive className="h-4 w-4" /> Live Auditor Activity
                </h3>
                <div className="space-y-3 font-mono text-[10px] text-slate-350 max-h-72 overflow-y-auto pr-1">
                  <div className="p-2 border border-indigo-500/10 bg-slate-950/10 rounded-xl">
                    <span className="text-cyan-400 font-bold">&gt; ROTATE_JWT_SECRET</span>
                    <p className="text-slate-400 mt-0.5">Certificates keys rotated globally by Super Admin.</p>
                  </div>
                  <div className="p-2 border border-indigo-500/10 bg-slate-950/10 rounded-xl">
                    <span className="text-cyan-400 font-bold">&gt; ORG_ONBOARD</span>
                    <p className="text-slate-400 mt-0.5">Provisioned TechNova Global Pvt Ltd organization node.</p>
                  </div>
                  <div className="p-2 border border-indigo-500/10 bg-slate-950/10 rounded-xl">
                    <span className="text-cyan-400 font-bold">&gt; AUTHENTICATION_SUCCESS</span>
                    <p className="text-slate-400 mt-0.5">User demo_finance verified successfully.</p>
                  </div>
                  <div className="p-2 border border-indigo-500/10 bg-slate-950/10 rounded-xl">
                    <span className="text-cyan-400 font-bold">&gt; REIMBURSEMENT_APPROVE</span>
                    <p className="text-slate-400 mt-0.5">Finance cleared claim exp2 ($1,200) successfully.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-indigo-500/15 pt-4 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span>NODE ID: EWAP_MISSION_MAIN_01</span>
              <span>EST TIME: 2026-07-03 · ENCRYPTED SECURE SSL CONNECTION</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
