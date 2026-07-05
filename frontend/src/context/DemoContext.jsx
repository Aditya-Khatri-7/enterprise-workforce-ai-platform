import React, { createContext, useState } from 'react';

export const DemoContext = createContext();
export const DemoProgressContext = createContext();

export const DemoProvider = ({ children }) => {
  const [isDemoMode, setIsDemoModeState] = useState(localStorage.getItem('ewap_demo_mode') === 'true');
  const [demoRole, setDemoRoleState] = useState(localStorage.getItem('ewap_demo_role') || null);

  const setDemoMode = (val) => {
    setIsDemoModeState(val);
    if (val) {
      localStorage.setItem('ewap_demo_mode', 'true');
    } else {
      localStorage.removeItem('ewap_demo_mode');
    }
  };

  const setDemoRole = (role) => {
    setDemoRoleState(role);
    if (role) {
      localStorage.setItem('ewap_demo_role', role);
    } else {
      localStorage.removeItem('ewap_demo_role');
    }
  };

  const clearDemo = () => {
    setIsDemoModeState(false);
    setDemoRoleState(null);
    localStorage.removeItem('ewap_demo_mode');
    localStorage.removeItem('ewap_demo_role');
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, demoRole, setDemoMode, setDemoRole, clearDemo }}>
      {children}
    </DemoContext.Provider>
  );
};

export const DemoProgressProvider = ({ children }) => {
  const [progressStore, setProgressStore] = useState({
    'riya_sharma': 65,
    'karan_patel': 80,
    'priya_singh': 40,
    'amit_verma': 90,
    'neha_joshi': 55,
    'rohit_das': 30
  });

  const setProgress = (employeeId, taskId, percentage) => {
    setProgressStore(prev => ({
      ...prev,
      [employeeId]: Number(percentage)
    }));
  };

  return (
    <DemoProgressContext.Provider value={{ progressStore, setProgress }}>
      {children}
    </DemoProgressContext.Provider>
  );
};
