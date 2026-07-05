import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function BootServiceList({ services, activeServices }) {
  const containerRef = useRef(null);

  // Auto scroll as services load
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [activeServices]);

  return (
    <div className="glass-card bg-slate-950/80 border border-indigo-500/25 rounded-2xl p-5 shadow-inner backdrop-blur-3xl relative overflow-hidden flex flex-col h-72">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2.5 mb-3 text-indigo-400 font-mono text-[11px] font-bold tracking-wider">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          SYSTEM BOOT MONITOR
        </span>
        <span>kernel_bootstrap.sh</span>
      </div>

      {/* Scrolling List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs text-slate-350 scrollbar-none"
      >
        {services.map((service, index) => {
          const status = activeServices[service.key];
          if (!status) return null;

          const isLoaded = status === 'Ready' || status === 'Connected' || status === 'Verified' || status === 'Online';
          const isError = status === 'Failed';

          return (
            <motion.div
              key={service.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="flex justify-between items-center py-0.5 border-b border-indigo-500/5 last:border-0"
            >
              <span className="text-[11px] truncate max-w-[70%]">
                {service.label}
              </span>
              <span 
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  isLoaded 
                    ? 'text-cyan-400 font-semibold' 
                    : isError 
                      ? 'text-red-400 font-semibold' 
                      : 'text-purple-400 animate-pulse'
                }`}
              >
                {isLoaded ? `✔ ${status}` : status}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
