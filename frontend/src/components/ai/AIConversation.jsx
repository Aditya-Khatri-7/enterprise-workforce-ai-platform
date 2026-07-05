import React from 'react';
import { motion } from 'framer-motion';

export default function AIConversation({ text, isDone }) {
  return (
    <div className="w-full max-w-xl mx-auto glass-card bg-slate-950/80 border border-indigo-500/25 rounded-2xl p-6 shadow-glow-indigo backdrop-blur-3xl relative text-center">
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      
      {/* Speech text with scroll-height */}
      <div className="font-mono text-sm leading-relaxed text-slate-200 whitespace-pre-wrap select-text">
        {text}
        {!isDone && (
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-1.5 h-4 bg-cyan-400 ml-1.5 align-middle"
          />
        )}
      </div>
    </div>
  );
}
