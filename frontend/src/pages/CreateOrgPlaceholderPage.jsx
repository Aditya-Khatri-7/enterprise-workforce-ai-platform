import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Terminal } from 'lucide-react';
import BootStatusBar from '../components/boot/BootStatusBar';

export default function CreateOrgPlaceholderPage() {
  const navigate = useNavigate();
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#070914] text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden select-none font-mono">
      {/* Dynamic backdrop waves */}
      <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[55%] rounded-full bg-indigo-600/10 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-15%] w-[70%] h-[60%] rounded-full bg-purple-600/10 blur-[200px] pointer-events-none" />
      
      {/* Top Header */}
      <div className="w-full max-w-6xl mx-auto z-10 flex items-center justify-between">
        <button
          onClick={() => navigate('/welcome')}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-500/20 bg-slate-900/40 text-slate-350 hover:text-white rounded-xl text-xs font-bold transition-all shadow-inner backdrop-blur-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Hub</span>
        </button>
        <span className="text-[10px] text-slate-500 font-bold">NODE: ORG_DEPLOYER</span>
      </div>

      {/* Centered Panel */}
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center space-y-6 z-10">
        <motion.div
          animate={{ scale: [1.0, 1.1, 1.0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-12 w-12 rounded-full border border-indigo-500/30 flex items-center justify-center bg-slate-900/40"
        >
          <PlusCircle className="h-5 w-5 text-cyan-400" />
        </motion.div>

        <div className="text-center space-y-2">
          <h2 className="text-lg font-black tracking-widest text-white uppercase">CREATE NEW TENANT</h2>
          <p className="text-xs text-indigo-400 font-mono tracking-widest uppercase font-semibold">Preparing OS Environment{dots}</p>
        </div>

        <div className="w-full bg-slate-950/80 border border-indigo-500/20 rounded-2xl p-5 text-xs text-slate-400 space-y-2.5 max-w-sm">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-indigo-400 border-b border-indigo-500/10 pb-1.5 mb-1.5">
            <span className="flex items-center gap-1">
              <Terminal className="h-3.5 w-3.5" />
              Environment Log
            </span>
            <span className="text-cyan-400">ACTIVE</span>
          </div>
          <div>&gt; Establishing secure database sandbox... done</div>
          <div>&gt; Mapping RBAC administrative roles... done</div>
          <div className="text-cyan-400 font-bold animate-pulse">&gt; Ready for new tenant configuration onboarding...</div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="w-full max-w-6xl mx-auto z-10">
        <BootStatusBar progress={100} />
      </div>
    </div>
  );
}
