import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Shield, Cpu, Users, BarChart3, Clock, 
  ArrowRight, Activity, Globe, HardDrive, Compass, Layers, 
  CheckCircle2, Sparkles, Server, Zap, Briefcase, MapPin
} from 'lucide-react';
import BootOverlay from '../components/boot/BootOverlay';
import publicApi from '../services/publicApi';

// Self-contained Animated Count-up component
const AnimatedCounter = ({ value, duration = 1.8 }) => {
  const [count, setCount] = useState(0);
  const [hasTriggered, setHasTriggered] = useState(false);

  const numericString = value.replace(/[^0-9.]/g, '');
  const numericValue = parseFloat(numericString);
  const suffix = value.replace(/[0-9.]/g, '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      onViewportEnter={() => {
        if (hasTriggered) return;
        setHasTriggered(true);
        let startTime = null;
        const animate = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const elapsed = (timestamp - startTime) / (duration * 1000);
          const progress = Math.min(elapsed, 1);
          const eased = progress * (2 - progress); // Ease out quad
          const current = eased * numericValue;

          if (value.includes('.')) {
            setCount(current.toFixed(2));
          } else {
            setCount(Math.floor(current));
          }

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      }}
    >
      <span>{count}{suffix}</span>
    </motion.div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [isBooting, setIsBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [bootProgress, setBootProgress] = useState(0);
  const [showLaunchBoot, setShowLaunchBoot] = useState(false);

  // Live Dashboard State variables
  const [barHeights, setBarHeights] = useState([60, 45, 80, 50, 75, 95, 40, 65, 85, 70, 90, 100]);
  const [activeOperators, setActiveOperators] = useState(452);
  const [dashboardLogs, setDashboardLogs] = useState([
    '12:35:02 UTC >> User (admin) initialized system audit',
    '12:34:55 UTC >> Welcome email dispatched for EMP1005',
    '12:32:10 UTC >> AI Operations Summary compiled',
    '12:30:15 UTC >> Rotate JWT credentials successful'
  ]);

  // Testimonials state
  const testimonials = [
    {
      quote: "The visual system architecture feels like navigating a custom security mainframe. Highly scalable.",
      author: "Marcus Vane",
      role: "Chief Information Security Officer"
    },
    {
      quote: "Access key validation and rotation work seamlessly in the background without intercepting users.",
      author: "Elena Rostova",
      role: "Lead DevOps Architect"
    },
    {
      quote: "Credential dispatch was automated instantly. Saved our operations hundreds of manual setup hours.",
      author: "Sarah Jenkins",
      role: "VP of People Operations"
    }
  ];
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isTestimonialHovered, setIsTestimonialHovered] = useState(false);

  // Careers / Job listings
  const [publicJobs, setPublicJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await publicApi.get('/recruitment/public/jobs');
        setPublicJobs(res.data || []);
      } catch {
        setPublicJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Track Mouse movement for radial cursor lighting
  useEffect(() => {
    const handleMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // System Boot Sequence Simulation
  useEffect(() => {
    const logs = [
      'SYS // BOOTING WORKFORCE OS v2.0.4...',
      'NET // ESTABLISHING COMMUNICATIONS SECURE TUNNEL...',
      'DB  // DECRYPTING LOCAL ORGANIZATIONAL GRAPHS...',
      'AI  // SPARKING INSTANT NLP COGNITIVE ASSISTANT CORE...',
      'SEC // VALIDATING COOKIE REFRESH ROTATION SYSTEM...',
      'SYS // COMPILING VERIFIED NODE INTERACTION PORTAL...'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setBootLogs(prev => [...prev, logs[currentLogIndex]]);
        setBootProgress(((currentLogIndex + 1) / logs.length) * 100);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsBooting(false);
        }, 600);
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  // Live Dashboard Simulator
  useEffect(() => {
    if (isBooting) return;

    // Simulate bar graph shifting heights
    const graphInterval = setInterval(() => {
      setBarHeights(prev => prev.map(h => {
        const delta = Math.floor(Math.random() * 24) - 12;
        return Math.min(Math.max(h + delta, 25), 100);
      }));
    }, 1400);

    // Simulate online operator fluctuation
    const operatorInterval = setInterval(() => {
      setActiveOperators(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.min(Math.max(prev + change, 445), 458);
      });
    }, 2800);

    // Simulate live incoming audit logs stream
    const logsInterval = setInterval(() => {
      const actions = [
        'User credentials checked successfully',
        'Rotated dynamic access cookies',
        'Verification OTP challenge accepted',
        'Mongoose schema verification checklist ok',
        'System audit document registered',
        'Access authorization check cleared'
      ];
      const time = new Date().toISOString().split('T')[1].slice(0, 8);
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      setDashboardLogs(prev => [
        `${time} UTC >> ${randomAction}`,
        ...prev.slice(0, 3)
      ]);
    }, 4500);

    return () => {
      clearInterval(graphInterval);
      clearInterval(operatorInterval);
      clearInterval(logsInterval);
    };
  }, [isBooting]);

  // Testimonials Auto-Slider
  useEffect(() => {
    if (isTestimonialHovered) return;
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isTestimonialHovered]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden relative">
      {/* Premium Aurora floating light blobs */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50%] rounded-full bg-indigo-600/10 blur-[180px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-15%] w-[70%] h-[60%] rounded-full bg-purple-600/10 blur-[200px] animate-pulse pointer-events-none" />
      
      {/* Animated scroll-grid & noise overlays */}
      <div className="absolute inset-0 bg-grid-anim pointer-events-none" />
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Mouse spotlight responsive glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 opacity-60 hidden md:block"
        style={{
          background: `radial-gradient(550px at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.07), transparent 80%)`
        }}
      />

      <AnimatePresence mode="wait">
        {isBooting ? (
          /* KERNEL BOOT EXPERIENCE */
          <motion.div
            key="boot"
            exit={{ opacity: 0, scale: 0.98, filter: "blur(5px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-royal-gradient flex flex-col items-center justify-center p-6 z-50 font-mono text-sm overflow-hidden"
          >
            {/* Dynamic decorative backdrop auroras */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />
            
            <div className="w-full max-w-lg glass-card border border-indigo-500/30 rounded-2xl p-6 shadow-glow-indigo backdrop-blur-3xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/80 to-transparent animate-pulse" />
              
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 mb-4">
                <div className="flex space-x-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-xs text-indigo-400 font-bold tracking-wider">kernel_bootstrap.sh</span>
              </div>
 
              {/* Progress Bar */}
              <div className="w-full bg-slate-900/60 border border-indigo-500/20 h-2.5 rounded-full mb-5 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600"
                  animate={{ width: `${bootProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
 
              {/* Log Lines */}
              <div className="space-y-2 h-44 overflow-y-auto pr-1 text-slate-300">
                {bootLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start space-x-2"
                  >
                    <span className="text-cyan-400 select-none font-bold">&gt;</span>
                    <span className={index === bootLogs.length - 1 ? "text-cyan-300 font-bold" : ""}>{log}</span>
                  </motion.div>
                ))}
              </div>
 
              <div className="mt-4 flex justify-between items-center text-xs text-indigo-300/60 pt-3 border-t border-indigo-500/10">
                <div className="flex items-center space-x-2">
                  <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                  <span>Cores: Active</span>
                </div>
                <span>Sec: SSL/TLS Enabled</span>
              </div>
            </div>
          </motion.div>
        ) : (
          /* MAIN SITE PORTAL */
          <motion.div
            key="portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Header / Navbar */}
            <header className="sticky top-0 bg-white/70 dark:bg-[#0B1023]/70 backdrop-blur-xl border-b border-indigo-500/10 z-40 px-6 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center space-x-3 group cursor-pointer"
                >
                  <div className="h-9 w-9 bg-gradient-to-tr from-cyan-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                    <Cpu className="h-4.5 w-4.5 text-white" />
                  </div>
                  <span className="text-lg font-black tracking-wider uppercase text-gray-900 dark:text-white">
                    Workforce OS
                  </span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center space-x-4"
                >
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/login')}
                    className="px-5 py-2.5 border border-indigo-500/20 dark:border-indigo-400/20 bg-white/20 dark:bg-[#1A1F3C]/30 text-gray-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white rounded-xl text-sm font-bold transition-all duration-300"
                  >
                    Sign In
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowLaunchBoot(true)}
                    className="px-5 py-2.5 btn-premium-gradient text-white rounded-xl text-sm font-bold shadow-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <span>Launch Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              </div>
            </header>

            {/* HERO SECTION */}
            <section className="px-6 py-24 lg:py-36 max-w-7xl mx-auto text-center relative z-10">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.15 }
                  }
                }}
                className="space-y-8"
              >
                {/* Glowing Top Badge */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/5 text-indigo-300 text-xs font-semibold tracking-wider uppercase shadow-inner"
                >
                  <Shield className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Decentralized Operations Kernel</span>
                </motion.div>

                {/* Main Hero Header */}
                <motion.h1
                  variants={{
                    hidden: { opacity: 0, y: 25 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="text-4xl sm:text-6xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.08] relative"
                >
                  <span className="relative inline-block">
                    The Future of
                    <span className="absolute -inset-1 rounded-lg bg-indigo-500/10 blur-xl opacity-75" />
                  </span>
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-[size:200%]">
                    Workforce Intelligence
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="max-w-2xl mx-auto text-slate-400 text-base sm:text-lg lg:text-xl leading-relaxed"
                >
                  A high-fidelity corporate operating system. Seamless onboarding, automated access control, auditing, and AI operations consolidated in one unified core.
                </motion.p>

                {/* Dual Action CTA Buttons */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4"
                >
                  <motion.button 
                    whileHover={{ scale: 1.03, boxShadow: "0 0 35px rgba(99, 102, 241, 0.45)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowLaunchBoot(true)}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-base font-semibold transition-all duration-300 flex items-center justify-center space-x-3 group relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Initialize Access Sequence</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                  <motion.a 
                    whileHover={{ scale: 1.03, borderColor: "rgba(255,255,255,0.25)" }}
                    whileTap={{ scale: 0.98 }}
                    href="#features"
                    className="w-full sm:w-auto px-8 py-4 border border-slate-850 bg-slate-900/40 text-slate-350 hover:text-white rounded-lg text-base font-semibold transition-all duration-300"
                  >
                    Analyze Kernel Architecture
                  </motion.a>
                </motion.div>
              </motion.div>
            </section>

            {/* DASHBOARD MONITOR PREVIEW (LIVE INTEGRATION) */}
            <section className="px-6 py-8 max-w-6xl mx-auto relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 sm:p-7 shadow-2xl backdrop-blur-2xl relative overflow-hidden group"
              >
                {/* Upper reflection lines */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/2 to-purple-500/0 pointer-events-none" />

                {/* Dashboard Menu Console Bar */}
                <div className="flex items-center justify-between border-b border-slate-850/80 pb-4 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500/60" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                      <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
                    </div>
                    <span className="text-xs text-slate-500 font-mono">kernel_monitor_host::workforce-core</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-indigo-400 font-mono">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                    <span>SYSTEM ONLINE</span>
                  </div>
                </div>

                {/* Dashboard Metrics Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1 - Quantifiers */}
                  <div className="space-y-4">
                    <div className="bg-slate-950/60 border border-slate-850/80 rounded-xl p-5 space-y-2 relative overflow-hidden group/card transition-all duration-300 hover:border-slate-800">
                      <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Active Operators</span>
                      <div className="flex justify-between items-end">
                        <span className="text-3xl font-extrabold text-white font-mono">
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={activeOperators}
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              transition={{ duration: 0.15 }}
                            >
                              {activeOperators}
                            </motion.span>
                          </AnimatePresence>
                          <span className="text-slate-600 text-xl font-normal"> / 500</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 font-mono animate-pulse">
                          LIVE UPDATE
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-850/80 rounded-xl p-5 space-y-2 transition-all duration-300 hover:border-slate-800">
                      <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">AI Core Inquiries</span>
                      <div className="flex justify-between items-end">
                        <span className="text-3xl font-extrabold text-white font-mono">14,892</span>
                        <span className="text-[10px] text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10 font-mono">
                          Latency: 0.2s
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2 - Real-time Shifting Bar Charts */}
                  <div className="bg-slate-950/60 border border-slate-850/80 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Security Pulse</span>
                      <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
                    </div>
                    <div className="h-24 flex items-end justify-between space-x-2 pt-2">
                      {barHeights.map((h, i) => (
                        <div key={i} className="w-full bg-slate-900 h-full rounded-sm overflow-hidden flex items-end">
                          <motion.div
                            animate={{ height: `${h}%` }}
                            transition={{ type: "spring", stiffness: 70, damping: 15 }}
                            className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-purple-500 rounded-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3 - Live Audit Log Terminal Feed */}
                  <div className="bg-slate-950/60 border border-slate-850/80 rounded-xl p-5 font-mono text-[11px] text-slate-500 space-y-3 transition-all duration-300 hover:border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-900/60">
                      <span>AUDIT LOG STREAM</span>
                      <Clock className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                    </div>
                    <div className="space-y-2.5 h-28 overflow-hidden relative">
                      <AnimatePresence initial={false}>
                        {dashboardLogs.map((log) => {
                          const id = log.split(' >> ')[1];
                          return (
                            <motion.div
                              key={log}
                              initial={{ opacity: 0, y: -10, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: "auto" }}
                              exit={{ opacity: 0, y: 10, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <span className="text-indigo-400">{log.split(' >> ')[0]} &gt;&gt; </span>
                              <span className="text-slate-350">{log.split(' >> ')[1]}</span>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* FEATURE SECTION */}
            <section id="features" className="px-6 py-28 max-w-7xl mx-auto space-y-20 relative z-10">
              <div className="text-center space-y-4">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight"
                >
                  High-Fidelity Operations Kernel
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="max-w-2xl mx-auto text-slate-450 text-sm sm:text-base leading-relaxed"
                >
                  Every feature has been optimized for enterprise requirements, providing security and role-based automation layout designs.
                </motion.p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    icon: Users,
                    title: 'Role-Based Authentication',
                    desc: 'Granular route barriers and guards for Super Admins, HR Managers, and general employees.'
                  },
                  {
                    icon: Shield,
                    title: 'Secure Access Keys',
                    desc: 'HttpOnly cookie tokens prevent malicious client scripts from hijacking active logins.'
                  },
                  {
                    icon: Terminal,
                    title: 'System Audit Logging',
                    desc: 'Logs logins, modifications, and administrative events for total operational auditing.'
                  },
                  {
                    icon: Cpu,
                    title: 'Automated Provisioning',
                    desc: 'Generates employee credentials and emails welcome payloads instantly upon entry.'
                  },
                  {
                    icon: BarChart3,
                    title: 'Intelligent Analytics',
                    desc: 'Consolidated dashboard displays to monitor employee status metrics and counts.'
                  },
                  {
                    icon: Layers,
                    title: 'Rotational Refresh Keys',
                    desc: 'Transparent access token rotations keep active users online without context loss.'
                  }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md transition-all group glow-card-shimmer relative overflow-hidden"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
                    
                    <div className="h-11 w-11 bg-indigo-500/10 border border-indigo-500/25 rounded-lg flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                      <feature.icon className="h-5.5 w-5.5 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* STATISTICS SECTION (LIVE COUNT-UP ANIMATION) */}
            <section className="px-6 py-20 bg-slate-900/10 border-y border-slate-900/60 relative z-10 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { count: '500+', label: 'Active Enterprise Nodes' },
                  { count: '100K+', label: 'Users Scaled' },
                  { count: '99.98%', label: 'Kernel Operational Uptime' },
                  { count: '0ms', label: 'Token Expiry Interrupt' }
                ].map((stat, i) => (
                  <div key={i} className="space-y-2">
                    <div className="text-3xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 font-mono">
                      <AnimatedCounter value={stat.count} />
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 font-semibold tracking-wider uppercase">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CAREERS / OPEN POSITIONS SECTION */}
            <section id="careers" className="px-6 py-28 max-w-7xl mx-auto space-y-16 relative z-10">
              <div className="text-center space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight"
                >
                  Open Career Positions
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="max-w-xl mx-auto text-slate-450 text-sm leading-relaxed"
                >
                  Join our team. Browse active openings and apply directly with your resume.
                </motion.p>
              </div>

              {jobsLoading ? (
                <div className="flex justify-center py-12">
                  <Activity className="h-8 w-8 text-indigo-400 animate-spin" />
                </div>
              ) : publicJobs.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-2xl">
                  <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">No open positions at the moment. Check back soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publicJobs.map((job, i) => (
                    <motion.div
                      key={job._id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      whileHover={{ y: -4 }}
                      className="bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-6 flex flex-col space-y-4 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                          <Briefcase className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-white truncate">{job.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            <span className="text-xs text-indigo-400">{job.department}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 flex-1">
                        {job.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-500 font-mono">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => navigate(`/careers/${job._id}/apply`)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border-0 cursor-pointer"
                        >
                          Apply Job
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* LIFECYCLE SECTION (TIMELINE SCROLL TRIGGERED) */}
            <section className="px-6 py-28 max-w-7xl mx-auto space-y-20 relative z-10">
              <div className="text-center space-y-4">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight"
                >
                  Lifecycle Integration Stream
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="max-w-xl mx-auto text-slate-450 text-sm leading-relaxed"
                >
                  Track the transition of a team node from recruitment to high-performance output.
                </motion.p>
              </div>

              {/* Steps Layout Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
                {[
                  { step: '01', title: 'Recruitment', desc: 'Secure screening and interviews pipeline management.', accent: 'from-indigo-500/20 to-purple-500/20' },
                  { step: '02', title: 'Onboarding', desc: 'Auto-generation of system IDs, access keys, and welcomes.', accent: 'from-purple-500/20 to-pink-500/20' },
                  { step: '03', title: 'Management', desc: 'Role assignments, profile access barriers, and updates.', accent: 'from-pink-500/20 to-blue-500/20' },
                  { step: '04', title: 'Growth', desc: 'Performance records tracking and team lead promotions.', accent: 'from-blue-500/20 to-emerald-500/20' },
                  { step: '05', title: 'Success', desc: 'Operational compliance, clean audit reporting, and reports.', accent: 'from-emerald-500/20 to-indigo-500/20' }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                    whileHover={{ y: -5 }}
                    className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl p-5 space-y-4 relative overflow-hidden group/timeline transition-all duration-300"
                  >
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                    <span className="text-[10px] text-indigo-400 font-mono font-bold tracking-widest block uppercase">
                      STAGE {item.step}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover/timeline:text-indigo-300 transition-colors">{item.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* TESTIMONIALS SECTION (SLOW SLIDING ANIMATION CAROUSEL) */}
            <section className="px-6 py-28 max-w-5xl mx-auto space-y-16 relative z-10">
              <div className="text-center space-y-4">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight"
                >
                  Validated by Enterprise Operators
                </motion.h2>
              </div>

              {/* Slider Wrapper */}
              <div 
                className="bg-slate-900/30 border border-slate-900 rounded-2xl p-8 sm:p-10 relative overflow-hidden min-h-[220px] flex items-center justify-center"
                onMouseEnter={() => setIsTestimonialHovered(true)}
                onMouseLeave={() => setIsTestimonialHovered(false)}
              >
                {/* Reflective corner highlights */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none rounded-tl-2xl" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-500/5 to-transparent pointer-events-none rounded-br-2xl" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTestimonial}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="text-center space-y-6 max-w-3xl"
                  >
                    <p className="text-slate-300 text-lg sm:text-xl italic leading-relaxed">
                      "{testimonials[currentTestimonial].quote}"
                    </p>
                    <div className="space-y-1.5">
                      <div className="text-base font-bold text-white">
                        {testimonials[currentTestimonial].author}
                      </div>
                      <div className="text-xs text-indigo-400 font-mono tracking-wider uppercase">
                        {testimonials[currentTestimonial].role}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Dot slider indicators */}
                <div className="absolute bottom-4 flex space-x-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentTestimonial(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${currentTestimonial === i ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-800'}`}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* FINAL CTA SECTION (PREMIUM INTERACTIVE DESIGN) */}
            <section className="px-6 py-32 max-w-4xl mx-auto text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="bg-gradient-to-tr from-indigo-950/20 via-slate-900/30 to-indigo-950/20 border border-indigo-500/10 rounded-3xl p-8 sm:p-16 space-y-8 shadow-2xl backdrop-blur-md relative overflow-hidden group"
              >
                {/* Floating ambient radial background gradients */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/3 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" />
                
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Launch the Workforce System
                </h2>
                <p className="max-w-md mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
                  Connect to your organization secure access node now. Initializing takes less than a second.
                </p>
                 <div className="pt-4 flex justify-center">
                  <motion.button 
                    whileHover={{ scale: 1.03, boxShadow: "0 0 35px rgba(99, 102, 241, 0.45)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowLaunchBoot(true)}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-base font-semibold shadow-2xl shadow-indigo-600/20 transition-all duration-300 flex items-center space-x-3 group relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Authenticate Console Access</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </motion.div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-slate-900/80 px-6 py-8 relative z-10 text-slate-500 text-xs">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4.5 w-4.5 text-indigo-500" />
                  <span className="font-semibold text-slate-400">Workforce Operating System</span>
                </div>
                <div>&copy; 2026 Workforce OS. All interfaces encrypted.</div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLaunchBoot && (
          <BootOverlay onClose={() => setShowLaunchBoot(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
