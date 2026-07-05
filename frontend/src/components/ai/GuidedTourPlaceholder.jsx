import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X, Cpu, Users, ShieldAlert, Sparkles } from 'lucide-react';

const TOUR_STEPS = [
  {
    title: "1. Admin CommandCenter",
    description: "Centrally manage security keys, JWT credential lifespans, and platform configuration. Monitor incoming logs in real-time.",
    icon: Cpu,
    color: "border-cyan-400 text-cyan-400"
  },
  {
    title: "2. HR Directory & Onboarding",
    description: "Manage employee contracts, designation codes, phone lines, and department registration tables securely under cryptographic indices.",
    icon: Users,
    color: "border-indigo-400 text-indigo-400"
  },
  {
    title: "3. Access Control Mainframe",
    description: "Organizations leverage Role-Based Access Control (RBAC) levels. Instantly elevate, authorize, or revoke member permissions.",
    icon: ShieldAlert,
    color: "border-purple-400 text-purple-400"
  },
  {
    title: "4. Cognitive AI Pipeline",
    description: "Automate scheduling workflows, predict payroll budgets, and chat with EWAP AI directly in the dashboard shell.",
    icon: Sparkles,
    color: "border-emerald-400 text-emerald-400"
  }
];

export default function GuidedTourPlaceholder({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#070914]/95 flex items-center justify-center p-6 backdrop-blur-md text-white select-none"
      >
        {/* Spotlight Effect Glow */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#070914]/80 to-[#070914]" />

        {/* Dynamic spot placement based on step */}
        <div className="absolute top-[20%] left-[30%] w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none animate-pulse" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 border border-indigo-500/20 bg-slate-900/40 text-slate-350 hover:text-white rounded-xl transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Dialog Panel Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.96 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-lg glass-card border border-indigo-500/30 rounded-3xl p-8 bg-slate-950/80 shadow-glow-indigo text-center space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Interactive Step Icon */}
          <div className="flex justify-center">
            <div className={`h-14 w-14 rounded-full border border-indigo-500/20 flex items-center justify-center relative ${step.color} bg-slate-900/60 shadow-lg`}>
              <step.icon className="h-6 w-6 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-widest text-white uppercase">{step.title}</h2>
            <p className="text-xs text-indigo-400 font-mono tracking-widest uppercase font-semibold">Interactive Platform Tour</p>
          </div>

          <p className="text-xs text-slate-450 leading-relaxed font-sans font-medium px-2">
            {step.description}
          </p>

          {/* Pagination Indicators */}
          <div className="flex justify-center space-x-1.5 pt-2">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'bg-cyan-400 shadow-glow-indigo' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex justify-between items-center pt-2 border-t border-indigo-500/10">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                currentStep === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-350 hover:text-white'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-400 hover:text-white transition-all font-mono"
            >
              SKIP TOUR
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 btn-premium-gradient px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:shadow-glow-indigo"
            >
              <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
