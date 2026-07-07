import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ArrowLeft, ArrowRight, X, Compass, RotateCcw, Play, Pause } from 'lucide-react';
import { soundManager } from '../../utils/soundManager';

const TOUR_STEPS = [
  {
    targetId: null,
    position: 'center',
    role: 'Super Admin',
    path: '/admin/dashboard',
    tab: 'orgs',
    title: "1. Welcome to EWAP OS",
    description: "Welcome to TechNova Global's enterprise digital workspace. This tour will automatically guide you through specialized admin dashboards, shift allocations, compliance audits, and security systems.",
  },
  {
    targetId: 'tour-sidebar',
    position: 'right',
    role: 'Super Admin',
    path: '/admin/dashboard',
    tab: 'orgs',
    title: "2. Command Center Sidebar",
    description: "Located on the left side. Hover over navigation items to expand. Access levels adjust dynamically based on whichever role you act under.",
  },
  {
    targetId: 'tour-metrics',
    position: 'bottom',
    role: 'Super Admin',
    path: '/admin/dashboard',
    tab: 'orgs',
    title: "3. Executive Core KPIs",
    description: "Summarizes the overall health of every tenant organization, active users, database servers, and pending requests in real-time.",
  },
  {
    targetId: 'tour-org-table',
    position: 'bottom',
    role: 'Super Admin',
    path: '/admin/dashboard',
    tab: 'orgs',
    title: "4. Multi-Tenant Registry",
    description: "Lists all registered organizations. Super Admins can monitor subscription levels, audit billing details, or suspend active nodes.",
  },
  {
    targetId: 'tour-create-org',
    position: 'left',
    role: 'Super Admin',
    path: '/admin/dashboard',
    tab: 'orgs',
    title: "5. Onboard Organizations",
    description: "Click here to provision a new company workspace, configure subscription levels, and assign corporate administrators.",
  },
  {
    targetId: 'tour-admins-table',
    position: 'top',
    role: 'Super Admin',
    path: '/admin/dashboard',
    tab: 'admins',
    title: "6. Tenant Administrators",
    description: "Monitor and manage company administrators, review security parameters, or initiate temporary password resets.",
  },
  {
    targetId: 'tour-logs-table',
    position: 'top',
    role: 'Super Admin',
    path: '/admin/dashboard',
    tab: 'logs',
    title: "7. Complete System Audits",
    description: "Maintains an immutable, cryptographically-linked log stream tracking secrets rotation, tenant registers, and logins.",
  },
  {
    targetId: 'tour-metrics',
    position: 'bottom',
    role: 'Organization Admin',
    path: '/admin/dashboard',
    tab: 'overview',
    title: "8. Organization Admin Command",
    description: "We've switched roles to Organization Admin! This role has full scope write permissions for company structures, shifts, and staff.",
  },
  {
    targetId: 'tour-sidebar',
    position: 'right',
    role: 'HR Manager',
    path: '/admin/dashboard',
    tab: 'employees',
    title: "9. Human Resources Directory",
    description: "Now logged in as HR Manager! From here, manage staff rosters, post openings, track applicants, and process hirement transitions.",
  },
  {
    targetId: 'tour-metrics',
    position: 'bottom',
    role: 'Manager',
    path: '/admin/dashboard',
    tab: 'roster',
    title: "10. Departmental Operations",
    description: "Now acting as Department Manager. Review roster listings, approve team leave tickets, and track unit performance metrics.",
  },
  {
    targetId: 'tour-metrics',
    position: 'bottom',
    role: 'Employee',
    path: '/employee/dashboard',
    tab: 'leaves',
    title: "11. Employee Self-Service",
    description: "Switched to Employee dashboard! Staff members clock in/out, file leave applications, and raise support tickets.",
  },
  {
    targetId: 'tour-metrics',
    position: 'bottom',
    role: 'Finance',
    path: '/admin/dashboard',
    tab: 'overview',
    title: "12. Financial Budget & Payroll",
    description: "Act as Finance Executive! Monitor department spends, process salaries, and clear staff reimbursement claims.",
  },
  {
    targetId: 'tour-metrics',
    position: 'bottom',
    role: 'IT Administrator',
    path: '/admin/dashboard',
    tab: 'infra',
    title: "13. IT Infrastructure Vitals",
    description: "Finally, IT Administrator panel! Monitor server online rates, databases, cloud storage assets, and ticket backlogs.",
  },
  {
    targetId: 'tour-ai',
    position: 'left',
    role: 'Auditor',
    path: '/admin/dashboard',
    tab: 'logs',
    title: "14. Compliance Audits",
    description: "Logged in as Compliance Auditor! Inspect immutable activity records. Use the AI explainer bubble if you need help.",
  }
];

import { DemoContext } from '../../context/DemoContext';

export default function GuidedTour() {
  const { user, setUser } = useContext(AuthContext);
  const { isDemoMode } = useContext(DemoContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isActive, setIsActive] = useState(() => {
    return isDemoMode && localStorage.getItem('ewap_tour_complete') !== 'true';
  });
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isPlaying, setIsPlaying] = useState(false);

  const dialogRef = useRef(null);

  // Restart Tour Event listener
  useEffect(() => {
    const handleRestart = () => {
      setStepIdx(0);
      setIsActive(true);
      setIsPlaying(false);
      localStorage.removeItem('ewap_tour_complete');
    };
    window.addEventListener('restart_guided_tour', handleRestart);
    return () => window.removeEventListener('restart_guided_tour', handleRestart);
  }, []);

  // Autoplay handler interval loop
  useEffect(() => {
    if (!isActive || !isPlaying) return;

    const timer = setInterval(() => {
      if (stepIdx < TOUR_STEPS.length - 1) {
        setStepIdx(prev => prev + 1);
      } else {
        setIsPlaying(false);
        handleClose();
      }
    }, 7000); // 7 seconds per slide auto-play

    return () => clearInterval(timer);
  }, [stepIdx, isActive, isPlaying]);

  // Execute Onboarding Script Steps (switch roles, navigate paths, and dispatch tab requests)
  useEffect(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[stepIdx];

    // 1. Switch Role Session (simulated role update in AuthContext)
    if (step.role && user?.role !== step.role) {
      setUser({
        _id: 'demo_user_id',
        username: `demo_${step.role.toLowerCase().replace(/ /g, '_')}`,
        firstName: 'Demo',
        lastName: step.role,
        email: `${step.role.toLowerCase().replace(/ /g, '')}@technova.com`,
        role: step.role,
        organizationRef: { name: 'TechNova Global Pvt Ltd' }
      });
      localStorage.setItem('ewap_demo_mode', 'true');
      localStorage.setItem('ewap_demo_role', step.role);
    }

    // 2. Redirect URL Page Paths
    if (step.path && location.pathname !== step.path) {
      navigate(step.path);
    }

    // 3. Select Dashboard Tabs (using custom tab listener events)
    if (step.tab) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tour_change_tab', { detail: { tab: step.tab } }));
      }, 100);
    }

    // 4. Highlight coordinate boundaries calculation
    let attempts = 0;
    const findElement = () => {
      if (!step.targetId) {
        setTargetRect(null);
        return;
      }
      const el = document.getElementById(step.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
      } else if (attempts < 15) {
        attempts++;
        setTimeout(findElement, 80);
      } else {
        setTargetRect(null);
      }
    };

    setTimeout(findElement, 200);

  }, [stepIdx, isActive]);

  // Listen to window size and updates coordinates
  useEffect(() => {
    if (!isActive) return;

    const handleUpdate = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      const step = TOUR_STEPS[stepIdx];
      if (!step.targetId) return;

      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
      }
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [stepIdx, isActive]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepIdx, isActive]);

  const handleNext = () => {
    soundManager.playClick();
    if (stepIdx < TOUR_STEPS.length - 1) {
      setStepIdx(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    soundManager.playClick();
    if (stepIdx > 0) {
      setStepIdx(prev => prev - 1);
    }
  };

  const handleClose = () => {
    soundManager.playClick();
    setIsActive(false);
    setIsPlaying(false);
    localStorage.setItem('ewap_tour_complete', 'true');
  };

  if (!isActive) return null;

  const step = TOUR_STEPS[stepIdx];

  // Tooltip layout configurations
  const dialogWidth = window.innerWidth < 640 ? window.innerWidth - 32 : 380;
  const dialogHeight = 200;
  const gap = 20;

  let top = window.innerHeight / 2 - dialogHeight / 2;
  let left = window.innerWidth / 2 - dialogWidth / 2;

  if (targetRect && window.innerWidth >= 640) {
    if (step.position === 'right') {
      left = targetRect.right + gap;
      top = targetRect.top + targetRect.height / 2 - dialogHeight / 2;
    } else if (step.position === 'left') {
      left = targetRect.left - dialogWidth - gap;
      top = targetRect.top + targetRect.height / 2 - dialogHeight / 2;
    } else if (step.position === 'top') {
      left = targetRect.left + targetRect.width / 2 - dialogWidth / 2;
      top = targetRect.top - dialogHeight - gap;
    } else if (step.position === 'bottom') {
      left = targetRect.left + targetRect.width / 2 - dialogWidth / 2;
      top = targetRect.bottom + gap;
    }

    // Collision boundary constraints
    left = Math.max(16, Math.min(left, window.innerWidth - dialogWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - dialogHeight - 16));
  } else if (window.innerWidth < 640) {
    // Mobile bottom align
    left = 16;
    top = window.innerHeight - dialogHeight - 110;
  }

  // Bending arrow connector layout coordinates
  const getConnectorPath = () => {
    if (!targetRect) return '';
    const startX = left + dialogWidth / 2;
    const startY = top + dialogHeight / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;
    return `M ${startX} ${startY} Q ${(startX + endX) / 2} ${Math.min(startY, endY) - 30} ${endX} ${endY}`;
  };

  const getMaskPath = () => {
    if (!targetRect) {
      return `M 0 0 h ${windowSize.width} v ${windowSize.height} h -${windowSize.width} z`;
    }
    const pad = 8;
    const t = targetRect.top - pad;
    const l = targetRect.left - pad;
    const w = targetRect.width + pad * 2;
    const h = targetRect.height + pad * 2;

    return `M 0 0 H ${windowSize.width} V ${windowSize.height} H 0 Z 
            M ${l} ${t} v ${h} h ${w} v -${h} Z`;
  };

  // Estimates time remaining
  const minutesLeft = Math.ceil(((TOUR_STEPS.length - stepIdx) * 7) / 60);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash-connection {
          animation: dash 1.2s linear infinite;
        }
      `}</style>

      {/* SVG Mask Spotlight cutout overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <path
          fillRule="evenodd"
          fill="rgba(7, 9, 20, 0.65)"
          className="backdrop-blur-[1px] transition-all duration-300"
          d={getMaskPath()}
        />
        {targetRect && (
          <>
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              d={getConnectorPath()}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              className="animate-dash-connection"
            />
            <rect
              x={targetRect.left - 6}
              y={targetRect.top - 6}
              width={targetRect.width + 12}
              height={targetRect.height + 12}
              rx="16"
              ry="16"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              className="animate-pulse"
              style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.5))' }}
            />
          </>
        )}
      </svg>

      {/* Onboarding Dialog Card */}
      <AnimatePresence mode="wait">
        <motion.div
          ref={dialogRef}
          key={stepIdx}
          style={{
            position: 'absolute',
            top,
            left,
            width: dialogWidth,
            height: dialogHeight
          }}
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="glass-card bg-slate-950/96 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl text-white font-sans text-xs flex flex-col justify-between pointer-events-auto relative"
        >
          {/* Top reflection neon border */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Title */}
          <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2">
            <span className="flex items-center gap-1.5 font-mono font-bold text-cyan-400 uppercase tracking-widest text-[9px]">
              <Compass className="h-3.5 w-3.5 animate-spin-slow" />
              {step.title}
            </span>
            <button 
              onClick={handleClose} 
              className="text-slate-400 hover:text-white"
              title="Close tour"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-slate-300 leading-relaxed font-sans font-medium py-1">
            {step.description}
          </p>

          {/* Interactive Pagination Controls */}
          <div className="flex justify-between items-center pt-2 border-t border-indigo-500/10">
            {/* Visual Dot Progress indicator */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500 font-bold">
                <span>Step {stepIdx + 1} of {TOUR_STEPS.length}</span>
                <span>·</span>
                <span className="text-indigo-400 font-semibold">{minutesLeft} min remaining</span>
              </div>
              <div className="flex gap-0.5 font-mono text-[9px] text-cyan-400 leading-none">
                {TOUR_STEPS.map((_, i) => (
                  <span key={i} className="leading-none text-[8px]">
                    {i === stepIdx ? '●' : i < stepIdx ? '●' : '○'}
                  </span>
                ))}
              </div>
            </div>

            {/* Pagination Button triggers */}
            <div className="flex items-center gap-2">
              {/* Autoplay / Play Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/15 rounded-xl transition-all text-slate-300 hover:text-white"
                title={isPlaying ? "Pause autoplay" : "Start autoplay"}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5 text-cyan-400 animate-pulse" /> : <Play className="h-3.5 w-3.5 text-slate-400" />}
              </button>

              <button
                onClick={handleBack}
                disabled={stepIdx === 0}
                className={`p-1.5 border border-indigo-500/20 bg-indigo-500/5 rounded-xl transition-all ${
                  stepIdx === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-350 hover:text-white hover:bg-indigo-500/15'
                }`}
                title="Previous step"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 btn-premium-gradient py-1.5 px-3 rounded-xl font-bold text-white shadow-md transition-all text-[11px]"
              >
                <span>{stepIdx === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Keyboard shortcuts hints footer */}
          <div className="absolute -bottom-5 left-0 right-0 text-center font-mono text-[8px] text-slate-500 uppercase tracking-widest pointer-events-none">
            ← Prev | Next → | Esc to Close
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
