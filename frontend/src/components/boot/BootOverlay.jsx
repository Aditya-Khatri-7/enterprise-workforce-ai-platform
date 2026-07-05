import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Sparkles, LogIn, SkipForward } from 'lucide-react';
import { useBootSequence } from '../../hooks/useBootSequence';
import BootLogo from './BootLogo';
import BootServiceList from './BootServiceList';
import BootMetrics from './BootMetrics';
import BootStatusBar from './BootStatusBar';

export default function BootOverlay({ onClose }) {
  const navigate = useNavigate();
  const {
    progress,
    activeServices,
    phase,
    isMuted,
    toggleMute,
    skipBoot,
    servicesList
  } = useBootSequence();

  React.useEffect(() => {
    if (phase === 'placeholder') {
      onClose();
      navigate('/welcome');
    }
  }, [phase, navigate, onClose]);

  const handleEnterSystem = () => {
    onClose();
    navigate('/login');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 bg-[#070914] text-white flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none"
      >
        {/* Cinematic Aurora wave background */}
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-600/10 blur-[180px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[75%] h-[75%] rounded-full bg-purple-600/10 blur-[200px] pointer-events-none animate-pulse" />
        <div className="absolute top-[30%] left-[40%] w-[50%] h-[50%] rounded-full bg-cyan-600/5 blur-[160px] pointer-events-none" />

        {/* Animated scanlines and scroll-grid */}
        <div className="absolute inset-0 bg-grid-anim pointer-events-none opacity-20" />
        <div className="absolute inset-0 noise-overlay pointer-events-none opacity-[0.015]" />

        {/* Floating holographic rings */}
        <motion.div 
          animate={{ rotate: 360, scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full border border-indigo-500/5 pointer-events-none"
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1.05, 0.95, 1.05] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full border border-purple-500/5 pointer-events-none"
        />

        {/* Top Control Bar */}
        <div className="flex items-center justify-between z-10 w-full">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] text-indigo-400 font-mono tracking-widest font-bold uppercase">SECURITY SECURE SHELL</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={toggleMute}
              className="p-2 border border-indigo-500/20 bg-[#1A1F3C]/40 text-slate-350 hover:text-white rounded-xl transition-all shadow-inner backdrop-blur-md"
              title={isMuted ? "Unmute sounds" : "Mute sounds"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Skip Button */}
            {phase === 'booting' && (
              <button
                onClick={skipBoot}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-500/20 bg-[#1A1F3C]/40 text-slate-350 hover:text-white rounded-xl text-xs font-bold transition-all shadow-inner backdrop-blur-md"
              >
                <span>Skip System Boot</span>
                <SkipForward className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 flex flex-col justify-center items-center max-w-5xl mx-auto w-full z-10 my-8">
          <AnimatePresence mode="wait">
            {phase === 'booting' && (
              <motion.div
                key="booting"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                transition={{ duration: 0.5 }}
                className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
              >
                {/* Left Side: Logo & Monitor Logs */}
                <div className="md:col-span-7 space-y-6">
                  <BootLogo />
                  <BootServiceList services={servicesList} activeServices={activeServices} />
                </div>

                {/* Right Side: Performance Metrics */}
                <div className="md:col-span-5">
                  <BootMetrics progress={progress} />
                </div>
              </motion.div>
            )}

            {phase === 'finished' && (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center space-y-4"
              >
                <div className="relative inline-block mb-3">
                  <div className="absolute -inset-1 rounded-full bg-cyan-400/20 blur-lg animate-pulse" />
                  <div className="h-14 w-14 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center relative">
                    <Sparkles className="h-6 w-6 text-cyan-400" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-widest font-mono text-cyan-400">
                  SYSTEM INITIALIZED
                </h1>
                <p className="text-xs sm:text-sm text-slate-350 font-mono">
                  Enterprise Workforce OS Ready. Preparing core services.
                </p>
              </motion.div>
            )}

            {phase === 'placeholder' && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center space-y-6 max-w-md p-8 glass-card border border-indigo-500/30 rounded-3xl shadow-glow-indigo bg-slate-950/70"
              >
                <div className="relative inline-block">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="h-10 w-10 rounded-full border border-indigo-500/20 border-t-cyan-400"
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-black tracking-widest text-white uppercase">EWAP AI SYSTEM</h2>
                  <p className="text-xs text-indigo-400 font-mono tracking-widest animate-pulse uppercase">Initializing Cognitive Mainframe...</p>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
                  Welcome to the Enterprise Workforce AI Portal. Click below to proceed to verification and login.
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleEnterSystem}
                    className="w-full btn-premium-gradient text-white rounded-xl font-bold py-3 text-sm shadow-lg hover:shadow-glow-indigo transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Enter Portal Console</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Bar */}
        <div className="z-10 w-full">
          <BootStatusBar progress={progress} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
