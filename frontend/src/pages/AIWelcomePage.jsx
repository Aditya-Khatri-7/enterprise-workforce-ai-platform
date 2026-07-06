import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIIntro } from '../hooks/useAIIntro';
import AIOrb from '../components/ai/AIOrb';
import AIConversation from '../components/ai/AIConversation';
import ExperienceHub from '../components/ai/ExperienceHub';
import SystemStatus from '../components/ai/SystemStatus';
import PlatformMetrics from '../components/ai/PlatformMetrics';
import GuidedTourPlaceholder from '../components/ai/GuidedTourPlaceholder';
import BootStatusBar from '../components/boot/BootStatusBar';

export default function AIWelcomePage() {
  const [showHub, setShowHub] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const { text, isDone, isSpeaking } = useAIIntro(() => {
    // Typing complete callback, wait briefly then show controls
    setTimeout(() => {
      setShowHub(true);
    }, 450);
  });

  return (
    <div className="min-h-screen bg-[#070914] text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-x-hidden select-none">
      
      {/* Background Auroras and Ambient Mesh */}
      <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[55%] rounded-full bg-indigo-600/10 blur-[180px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[20%] right-[-15%] w-[70%] h-[60%] rounded-full bg-purple-600/10 blur-[200px] pointer-events-none animate-pulse" />
      <div className="absolute top-[35%] left-[25%] w-[50%] h-[50%] rounded-full bg-cyan-600/5 blur-[165px] pointer-events-none" />

      {/* Floating grids and volumetric light lines */}
      <div className="absolute inset-0 bg-grid-anim pointer-events-none opacity-20" />
      <div className="absolute inset-0 noise-overlay pointer-events-none opacity-[0.012]" />

      {/* Holographic AI Brain centered in the background behind content */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-45 sm:opacity-55">
        <AIOrb isSpeaking={isSpeaking} />
      </div>

      {/* Top Welcome Title Header */}
      <div className="w-full max-w-6xl mx-auto z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[10px] text-indigo-400 font-mono tracking-widest font-bold uppercase">Workforce Intelligence OS</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono font-bold">NODE: WELCOME_DESK</span>
      </div>

      {/* Primary Layout Wrapper */}
      <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col items-center justify-center space-y-8 z-10 my-8">
        
        {/* Core AI Section */}
        <div className="w-full flex flex-col items-center space-y-4">
          <AIConversation text={text} isDone={isDone} />
        </div>

        {/* Experience Selection Grid & Sidebar */}
        <AnimatePresence>
          {showHub && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full space-y-8"
            >
              {/* Cards Hub & Sidebar Split layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-9">
                  <ExperienceHub onStartTour={() => setShowTour(true)} />
                </div>
                <div className="lg:col-span-3">
                  <SystemStatus />
                </div>
              </div>

              {/* Bottom Metrics dashboard widget */}
              <PlatformMetrics />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Status bar */}
      <div className="w-full max-w-6xl mx-auto z-10">
        <BootStatusBar progress={100} />
      </div>

      {/* Guided Tour Modal */}
      {showTour && (
        <GuidedTourPlaceholder onClose={() => setShowTour(false)} />
      )}
    </div>
  );
}
