import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    setIsHidden(false);

    const handleMouseMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.tagName === 'INPUT' ||
        target.closest('button') || 
        target.closest('a') ||
        target.classList.contains('cursor-pointer') ||
        target.closest('.interactive-card');
      
      setIsHovered(!!isInteractive);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  if (isHidden) return null;

  return (
    <>
      {/* Outer trailing gradient glow aura */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full blur-xl bg-gradient-to-r from-cyan-500/20 via-indigo-500/10 to-purple-500/20"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovered ? 90 : 50,
          height: isHovered ? 90 : 50,
        }}
        transition={{ type: 'spring', stiffness: 120, damping: 28 }}
      />
      {/* Intersecting active ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full border-[1.5px] border-indigo-500/80 bg-indigo-500/5 mix-blend-screen"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovered ? 56 : 18,
          height: isHovered ? 56 : 18,
          borderColor: isHovered ? '#22d3ee' : '#6366f1',
          boxShadow: isHovered ? '0 0 15px rgba(34, 211, 238, 0.5)' : '0 0 0px rgba(0,0,0,0)',
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
      />
      {/* Center sharp dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full bg-cyan-400"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovered ? 6 : 4,
          height: isHovered ? 6 : 4,
        }}
      />
    </>
  );
};

export default CustomCursor;
