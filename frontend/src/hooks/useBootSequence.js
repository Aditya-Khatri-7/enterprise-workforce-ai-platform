import { useState, useEffect, useCallback, useRef } from 'react';
import { soundManager } from '../utils/soundManager';

const BOOT_SERVICES = [
  { key: 'kernel', label: 'Initializing Enterprise Kernel...' },
  { key: 'auth', label: 'Authentication Engine' },
  { key: 'rbac', label: 'RBAC Engine' },
  { key: 'org', label: 'Organization Service' },
  { key: 'employee', label: 'Employee Registry' },
  { key: 'attendance', label: 'Attendance Engine' },
  { key: 'payroll', label: 'Payroll Service' },
  { key: 'recruit', label: 'Recruitment Engine' },
  { key: 'notif', label: 'Notification Center' },
  { key: 'ai', label: 'AI Operations Assistant' },
  { key: 'analytics', label: 'Analytics Engine' },
  { key: 'audit', label: 'Audit System' },
  { key: 'security', label: 'Security Layer' },
  { key: 'db', label: 'Database Connection' },
  { key: 'services', label: 'Enterprise Services' }
];

export function useBootSequence(onComplete) {
  const [progress, setProgress] = useState(0);
  const [activeServices, setActiveServices] = useState({});
  const [logs, setLogs] = useState([]);
  const [phase, setPhase] = useState('booting'); // 'booting' | 'finished' | 'placeholder'
  const isMutedState = useState(() => soundManager.isMuted);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  
  const timerRef = useRef(null);
  const completedRef = useRef(false);

  const toggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const skipBoot = useCallback(() => {
    if (completedRef.current) return;
    soundManager.playClick();
    setProgress(100);
    
    // Immediately complete active status logs
    const completedServices = {};
    BOOT_SERVICES.forEach(s => {
      completedServices[s.key] = s.key === 'ai' ? 'Connected' : s.key === 'security' ? 'Verified' : 'Ready';
    });
    setActiveServices(completedServices);
    setLogs(BOOT_SERVICES.map(s => `${s.label} ... Done`));
    
    soundManager.playSuccess();
    setPhase('finished');
    completedRef.current = true;
    
    setTimeout(() => {
      setPhase('placeholder');
    }, 1200);
  }, []);

  useEffect(() => {
    // Play startup synth notes
    soundManager.playStartup();

    const totalDuration = 3000; // 3 seconds
    const intervalTime = 40;
    const steps = totalDuration / intervalTime;
    const progressPerStep = 100 / steps;

    let currentProgress = 0;
    let nextServiceIndex = 0;

    timerRef.current = setInterval(() => {
      if (completedRef.current) {
        clearInterval(timerRef.current);
        return;
      }

      currentProgress = Math.min(currentProgress + progressPerStep * (0.8 + Math.random() * 0.4), 100);
      setProgress(Math.floor(currentProgress));

      // Trigger services status loading based on progress thresholds
      const serviceThreshold = (100 / BOOT_SERVICES.length) * nextServiceIndex;
      if (currentProgress >= serviceThreshold && nextServiceIndex < BOOT_SERVICES.length) {
        const service = BOOT_SERVICES[nextServiceIndex];
        
        // Mark previous as active/done
        setActiveServices(prev => ({
          ...prev,
          [service.key]: 'Loading...'
        }));

        setLogs(prev => [...prev, `Loading ${service.label}...`]);

        // Complete the service loading slightly later
        const currentKey = service.key;
        setTimeout(() => {
          setActiveServices(prev => ({
            ...prev,
            [currentKey]: currentKey === 'ai' ? 'Connected' : currentKey === 'security' ? 'Verified' : 'Ready'
          }));
        }, 150);

        nextServiceIndex++;
      }

      if (currentProgress >= 100) {
        clearInterval(timerRef.current);
        soundManager.playSuccess();
        setPhase('finished');
        completedRef.current = true;

        // Smooth transition into Phase 2 placeholder screen
        setTimeout(() => {
          setPhase('placeholder');
        }, 1500);
      }
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    progress,
    activeServices,
    logs,
    phase,
    isMuted,
    toggleMute,
    skipBoot,
    servicesList: BOOT_SERVICES
  };
}
