import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, MessageSquareCode } from 'lucide-react';

const PATH_EXPLANATIONS = {
  '/admin/dashboard': "Welcome to the Admin Command Center. This interface gives you full control over system parameters, active departments, user listings, and credential allocations. Switch roles using the badge below to observe how access controls change views instantly.",
  '/employee/dashboard': "You are inside the Employee Hub. Here, staff members clock in/out dynamically using secure locations, file support tickets, request casual/sick leaves, and check daily activity logs.",
  '/admin/employees': "This is the secure Employee Registry. You can provision new employees, activate/suspend records, and modify designations. All edits are updated dynamically in our client-side database.",
  '/admin/audit': "You are inspecting the Immutable System Audits. Every critical event—from JWT rotations to staff credential dispatch and suspensions—is securely logged here to ensure total transparency.",
  '/admin/requests': "This is the Super Admin Request & Approval Center. Review pending leave requests, asset allocation slots, promotion requests, and security validations. You can approve or reject items dynamically.",
  '/profile': "This is the Employee Profile panel. Here, workforce operators review their personal email credentials, assigned departments, security roles, and update specialized skills indices."
};

export default function AIExplainer() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const pathname = location.pathname;
  const explanation = PATH_EXPLANATIONS[pathname] || "You are exploring the Enterprise Workforce Operating System. Use the selector below to switch roles and observe the dashboard behaviors.";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="w-80 mb-3 glass-card bg-slate-950/95 border border-indigo-500/35 rounded-2xl p-5 shadow-2xl text-white font-sans text-xs space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2">
              <span className="flex items-center gap-1.5 font-mono font-bold text-cyan-400 uppercase tracking-wider text-[10px]">
                <BrainCircuit className="h-4 w-4 animate-pulse" />
                EWAP AI Explainer
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Explanation paragraph */}
            <p className="text-slate-300 leading-relaxed font-sans font-medium">
              {explanation}
            </p>

            <div className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase font-semibold">
              💡 Tip: Click different sidebar tabs to update explain details.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing AI Explainer Bubble */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="h-12 w-12 rounded-full btn-premium-gradient flex items-center justify-center text-white shadow-xl hover:shadow-glow-indigo transition-all duration-300 relative group"
      >
        <span className="absolute -inset-1 rounded-full bg-indigo-500/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
        <MessageSquareCode className="h-5 w-5 animate-pulse relative z-10" />
      </button>
    </div>
  );
}
