import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ExperienceCard({ title, desc, btnText, onClick, icon: Icon, colorClass = 'from-indigo-500/20 to-purple-500/10' }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate normalized coords (-0.5 to 0.5)
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    // Calculate rotation (-10deg to 10deg)
    setRotateX(-mouseY * 12);
    setRotateY(mouseX * 12);

    // Calculate glow position
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setGlowPos({ x, y });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000
      }}
      animate={{
        rotateX,
        rotateY
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="glass-card bg-[#151A30]/85 border border-indigo-500/20 dark:border-indigo-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between h-64 relative overflow-hidden group cursor-pointer"
    >
      {/* Dynamic spotlight hover glow */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(180px at ${glowPos.x}px ${glowPos.y}px, rgba(99, 102, 241, 0.18), transparent 85%)`
        }}
      />
      
      {/* Top reflection highlight */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      {/* Card Content */}
      <div className="space-y-4" style={{ transform: 'translateZ(30px)' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-cyan-400">
            {Icon && <Icon className="h-5 w-5 animate-pulse" />}
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">{desc}</p>
      </div>

      {/* Button */}
      <div className="pt-4" style={{ transform: 'translateZ(40px)' }}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick();
          }}
          className="w-full btn-premium-gradient text-white rounded-xl font-bold py-2.5 text-xs shadow-md transition-all duration-300 hover:shadow-glow-indigo"
        >
          {btnText}
        </button>
      </div>
    </motion.div>
  );
}
