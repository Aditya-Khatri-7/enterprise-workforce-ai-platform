import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Sparkles } from 'lucide-react';

export default function BootLogo() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Animated outer glowing rotating rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-4 rounded-full border border-indigo-500/20 border-t-cyan-400/40 border-b-purple-500/40 blur-[2px]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-2 rounded-full border border-dashed border-indigo-500/10 border-r-cyan-300/30 border-l-purple-400/30"
        />

        {/* Central Logo Box */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-950/80 to-[#1A1F3C]/80 border border-indigo-500/30 flex items-center justify-center shadow-glow-indigo relative z-10 backdrop-blur-md"
        >
          <Cpu className="h-8 w-8 text-cyan-400 animate-pulse" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1.5 right-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          </motion.div>
        </motion.div>
      </div>

      <div className="text-center space-y-1 z-10">
        <motion.h2
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-indigo-400 font-sans"
        >
          ENTERPRISE WORKFORCE OS
        </motion.h2>
        <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase font-semibold">Decentralized Intelligence Core</p>
      </div>
    </div>
  );
}
