import React from 'react';
import { Sparkles, Key, PlusCircle, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExperienceCard from './ExperienceCard';

export default function ExperienceHub({ onStartTour }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mx-auto z-10 px-4">
      <ExperienceCard
        title="Explore Demo Workspace"
        desc="Experience the complete enterprise platform without authentication. Instantly interact with simulated data."
        btnText="Launch Demo"
        icon={Sparkles}
        onClick={() => navigate('/demo')}
      />

      <ExperienceCard
        title="Existing Organization"
        desc="Already registered as a member or manager? Securely sign in to access your administrative workspace."
        btnText="Secure Sign In"
        icon={Key}
        onClick={() => navigate('/login')}
      />

      <ExperienceCard
        title="Create Organization"
        desc="Deploy the Enterprise Workforce AI Platform for your company. Provision resources instantly."
        btnText="Create Organization"
        icon={PlusCircle}
        onClick={() => navigate('/create-organization')}
      />

      <ExperienceCard
        title="AI Guided Tour"
        desc="Allow EWAP AI to walk you through every module, layout, and administrative control panel."
        btnText="Start Tour"
        icon={Compass}
        onClick={onStartTour}
      />
    </div>
  );
}
