import React, { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { DemoContext } from '../context/DemoContext';
import { 
  Shield, Cpu, Users, Briefcase, Activity, 
  User, DollarSign, Terminal, FileText, ArrowLeft, Loader 
} from 'lucide-react';
import BootStatusBar from '../components/boot/BootStatusBar';

const ROLES = [
  {
    name: 'Super Admin',
    desc: 'System-wide owner. Deploy environments, rotate security keys, and manage tenant organizations.',
    responsibilities: 'Tenant lifecycle, global secrets rotation',
    permissions: 'Full Read/Write on Core Node',
    icon: Shield,
    textColor: 'text-red-400',
    borderColor: 'border-red-500/25 group-hover:border-red-500/60',
    glowColor: 'shadow-[0_0_15px_rgba(239,68,68,0.08)] hover:shadow-[0_0_25px_rgba(239,68,68,0.25)]',
    gradBg: 'from-red-500/10 to-indigo-500/5',
    iconColor: 'text-red-450'
  },
  {
    name: 'Organization Admin',
    desc: 'Company workspace lead. Provision departments, assign administrators, and configure compliance parameters.',
    responsibilities: 'Departments mapping, system configurations',
    permissions: 'Write on Organization scope',
    icon: Cpu,
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/25 group-hover:border-cyan-500/60',
    glowColor: 'shadow-[0_0_15px_rgba(6,182,212,0.08)] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]',
    gradBg: 'from-cyan-500/10 to-indigo-500/5',
    iconColor: 'text-cyan-400'
  },
  {
    name: 'HR Manager',
    desc: 'Staff directory supervisor. Onboard new hires, manage candidate tracking, and publish job vacancies.',
    responsibilities: 'Directory management, jobs posting',
    permissions: 'Modify Employees and Jobs registries',
    icon: Users,
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/25 group-hover:border-blue-500/60',
    glowColor: 'shadow-[0_0_15px_rgba(59,130,246,0.08)] hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]',
    gradBg: 'from-blue-500/10 to-indigo-500/5',
    iconColor: 'text-blue-400'
  },
  {
    name: 'HR Manager', // Mapping to Manager
    label: 'Department Manager',
    nameReal: 'HR Manager',
    desc: 'Operational unit director. Review attendance charts, coordinate leaves, and supervise team schedules.',
    responsibilities: 'Leaves review, shift logs validation',
    permissions: 'Approvals on Unit scope',
    icon: Briefcase,
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/25 group-hover:border-purple-500/60',
    glowColor: 'shadow-[0_0_15px_rgba(168,85,247,0.08)] hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]',
    gradBg: 'from-purple-500/10 to-indigo-500/5',
    iconColor: 'text-purple-400'
  },
  {
    name: 'Team Lead',
    desc: 'Project coordinator. Define task backlogs, allocate sprint resources, and review developer progress.',
    responsibilities: 'Project tasks assignment, logs check',
    permissions: 'Write on Projects scope',
    icon: Activity,
    textColor: 'text-emerald-450',
    borderColor: 'border-emerald-500/25 group-hover:border-emerald-500/60',
    glowColor: 'shadow-[0_0_15px_rgba(16,185,129,0.08)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]',
    gradBg: 'from-emerald-500/10 to-indigo-500/5',
    iconColor: 'text-emerald-400'
  },
  {
    name: 'Employee',
    desc: 'Staff operator. Record clock-in coordinates, request personal leaves, and file IT helpdesk support tickets.',
    responsibilities: 'Daily clock-in, leaves submissions',
    permissions: 'Read/Write on Personal scope',
    icon: User,
    textColor: 'text-indigo-305',
    borderColor: 'border-indigo-500/25 group-hover:border-indigo-500/60',
    glowColor: 'shadow-[0_0_15px_rgba(99,102,241,0.08)] hover:shadow-[0_0_25px_rgba(99,102,241,0.25)]',
    gradBg: 'from-indigo-500/10 to-purple-500/5',
    iconColor: 'text-indigo-400'
  },
  {
    name: 'Finance',
    label: 'Finance Executive',
    desc: 'Treasury coordinator. Review automated payroll databases, configure salaries, and review tax allocations.',
    responsibilities: 'Payroll calculation, salary validation',
    permissions: 'Read/Write on Billing scope',
    icon: DollarSign,
    textColor: 'text-yellow-405',
    borderColor: 'border-yellow-500/25 group-hover:border-yellow-500/60',
    glowColor: 'shadow-[0_0_15px_rgba(234,179,8,0.08)] hover:shadow-[0_0_25px_rgba(234,179,8,0.25)]',
    gradBg: 'from-yellow-500/10 to-indigo-500/5',
    iconColor: 'text-yellow-400'
  },
  {
    name: 'IT Administrator',
    desc: 'Security infrastructure lead. Monitor server health channels, reset passwords, and audit secure configurations.',
    responsibilities: 'Vitals tracking, password resets',
    permissions: 'Write on Server configuration scope',
    icon: Terminal,
    textColor: 'text-slate-350',
    borderColor: 'border-slate-500/25 group-hover:border-slate-500/60',
    glowColor: 'shadow-[0_0_15px_rgba(148,163,184,0.08)] hover:shadow-[0_0_25px_rgba(148,163,184,0.25)]',
    gradBg: 'from-slate-500/10 to-indigo-500/5',
    iconColor: 'text-slate-350'
  },
  {
    name: 'Auditor',
    desc: 'Compliance monitor. Inspect dynamic system audit logs for administrative actions, tracking key security rotations.',
    responsibilities: 'Regulatory audits compliance tracking',
    permissions: 'ReadOnly on Audit logs scope',
    icon: FileText,
    textColor: 'text-rose-450',
    borderColor: 'border-rose-500/25 group-hover:border-rose-500/60',
    glowColor: 'shadow-[0_0_15px_rgba(244,63,94,0.08)] hover:shadow-[0_0_25px_rgba(244,63,94,0.25)]',
    gradBg: 'from-rose-500/10 to-indigo-500/5',
    iconColor: 'text-rose-455'
  }
];

export default function DemoPlaceholderPage() {
  const { setUser } = useContext(AuthContext);
  const { setDemoMode, setDemoRole } = useContext(DemoContext);
  const navigate = useNavigate();
  
  const [phase, setPhase] = useState('loading'); // 'loading' | 'selector'
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);

  // Simulated deployment log lines
  useEffect(() => {
    if (phase !== 'loading') return;

    const logLines = [
      'Entering Enterprise Workspace...',
      'Loading Demo Organization (TechNova Global Pvt Ltd)...',
      'Synchronizing Enterprise Services...',
      'Loading Workforce Intelligence...',
      'Preparing AI Assistant...',
      'Connecting Modules...'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < logLines.length) {
        setLogs(prev => [...prev, logLines[index]]);
        setProgress(((index + 1) / logLines.length) * 100);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setPhase('selector');
        }, 600);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [phase]);

  const handleSelectRole = (roleItem) => {
    const roleName = roleItem.nameReal || roleItem.name;
    
    // Set showcase mode state in localStorage
    setDemoMode(true);
    setDemoRole(roleName);

    // Initialize mock login session
    setUser({
      _id: 'demo_user_id',
      username: `demo_${roleName.toLowerCase().replace(/ /g, '_')}`,
      firstName: 'Demo',
      lastName: roleItem.label || roleName,
      email: `${roleName.toLowerCase().replace(/ /g, '')}@technova.com`,
      role: roleName,
      organizationRef: { name: 'TechNova Global Pvt Ltd' }
    });

    // Navigate to Auth router layout
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#070914] text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-x-hidden select-none">
      
      {/* Background radial glow */}
      <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[55%] rounded-full bg-indigo-600/10 blur-[180px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[20%] right-[-15%] w-[70%] h-[60%] rounded-full bg-purple-600/10 blur-[200px] pointer-events-none animate-pulse" />
      
      {/* Top Header */}
      <div className="w-full max-w-6xl mx-auto z-10 flex items-center justify-between">
        <button
          onClick={() => navigate('/welcome')}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-500/20 bg-slate-900/40 text-slate-350 hover:text-white rounded-xl text-xs font-bold transition-all shadow-inner backdrop-blur-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Hub</span>
        </button>
        <span className="text-[10px] text-slate-500 font-mono font-bold">NODE: SHOWCASE_PROVISIONER</span>
      </div>

      {/* Main Core Container */}
      <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col items-center justify-center space-y-8 z-10 my-8">
        <AnimatePresence mode="wait">
          {phase === 'loading' && (
            <motion.div
              key="loading"
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md bg-slate-950 border border-indigo-500/30 rounded-3xl p-6 shadow-glow-indigo"
            >
              <div className="flex items-center justify-between border-b border-indigo-500/15 pb-2.5 mb-4">
                <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase flex items-center gap-1">
                  <Loader className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  Showcase Provision
                </span>
                <span className="text-[9px] text-slate-500 font-mono font-bold">BOOTLOADER</span>
              </div>

              {/* Progress */}
              <div className="w-full bg-slate-950 border border-indigo-500/15 h-2 rounded-full mb-4 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Scrolling Console log lines */}
              <div className="space-y-1.5 h-36 overflow-y-auto font-mono text-[11px] text-slate-300">
                {logs.map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    &gt; {log}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'selector' && (
            <motion.div
              key="selector"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full space-y-6"
            >
              {/* Header Title */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black tracking-widest text-white uppercase">Choose Your Persona</h2>
                <p className="text-xs text-slate-450 leading-relaxed max-w-md mx-auto">
                  Select an administrative role to explore TechNova Global. Access levels, analytics, and sidebar options will adapt instantly.
                </p>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {ROLES.map((role) => (
                  <motion.div
                    key={role.name}
                    whileHover={{ y: -6, scale: 1.02 }}
                    onClick={() => handleSelectRole(role)}
                    className={`bg-[#0F1326] border ${role.borderColor} ${role.glowColor} rounded-2xl p-5 shadow-2xl flex flex-col justify-between h-56 relative overflow-hidden group cursor-pointer bg-gradient-to-tr ${role.gradBg} transition-all duration-300`}
                  >
                    {/* Glowing highlight in the corner matching the card color */}
                    <div className={`absolute top-0 right-0 h-16 w-16 opacity-10 rounded-full blur-xl pointer-events-none bg-current ${role.textColor}`} />
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl bg-slate-900/60 border ${role.borderColor} flex items-center justify-center`}>
                          <role.icon className={`h-5 w-5 ${role.iconColor} animate-pulse`} />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">{role.label || role.name}</h3>
                      </div>
                      
                      <p className="text-[11px] text-slate-350 leading-relaxed font-sans font-medium line-clamp-2">
                        {role.desc}
                      </p>
                    </div>

                    <div className="border-t border-slate-800 pt-3 space-y-1.5 font-mono text-[9px]">
                      <div className="text-slate-500 uppercase">RESPONSIBILITIES: <span className="text-white font-semibold">{role.responsibilities}</span></div>
                      <div className="text-slate-500 uppercase">PERMISSIONS: <span className="text-white font-semibold">{role.permissions}</span></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar */}
      <div className="w-full max-w-6xl mx-auto z-10">
        <BootStatusBar progress={100} />
      </div>
    </div>
  );
}
