import React, { useContext, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Cpu, ShieldCheck, Activity } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Login = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const recaptchaRef = useRef(null);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Input Focus States
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Track cursor position for dynamic spotlight layer
  useEffect(() => {
    const handleMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    setRecaptchaError('');
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null);
  };

  const onSubmit = async (data) => {
    if (!recaptchaToken) {
      setRecaptchaError('Please complete the reCAPTCHA verification.');
      return;
    }

    try {
      await login({ ...data, recaptchaToken });
      toast.success('Logged in successfully!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to login');
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    }
  };

  // Generate 15 floating particles with random setups
  const particles = Array.from({ length: 15 });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans select-none">
      
      {/* Animated Aurora moving background gradients */}
      <motion.div 
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 20, 0],
          y: [0, -10, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-600/10 blur-[160px] pointer-events-none" 
      />
      <motion.div 
        animate={{
          scale: [1.1, 1, 1.1],
          x: [0, -20, 0],
          y: [0, 10, 0]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-purple-600/10 blur-[160px] pointer-events-none" 
      />
      
      {/* Grid and noise textures */}
      <div className="absolute inset-0 bg-grid-anim pointer-events-none" />
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Floating Particles in Background */}
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-indigo-500/10 rounded-full pointer-events-none"
          style={{
            width: Math.random() * 3 + 2,
            height: Math.random() * 3 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -120, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: Math.random() * 12 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}

      {/* Spotlight follower overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 opacity-60 hidden md:block"
        style={{
          background: `radial-gradient(400px at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.08), transparent 80%)`
        }}
      />

      {/* Main Glassmorphism Form Card Container (Staggered Stagger) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15, filter: "blur(4px)" }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          filter: "blur(0px)",
          transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
        }}
        className="w-full max-w-md relative z-10 p-[1px] rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Continuous Floating Loop & Border highlight wrap */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="w-full p-[1.5px] rounded-2xl bg-gradient-to-tr from-slate-800 via-indigo-500/20 to-slate-800"
        >
          <div className="bg-slate-950/95 rounded-[15px] p-8 sm:p-10 backdrop-blur-2xl space-y-8">
            {/* Header / Breathing Logo */}
            <div className="text-center space-y-4">
              <motion.div 
                animate={{
                  boxShadow: [
                    "0 0 15px rgba(99, 102, 241, 0.15)",
                    "0 0 25px rgba(99, 102, 241, 0.35)",
                    "0 0 15px rgba(99, 102, 241, 0.15)"
                  ],
                  scale: [1, 1.04, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="mx-auto h-11 w-11 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg cursor-pointer"
              >
                <Cpu className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Workforce Portal
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Sign in to your enterprise account
                </p>
              </div>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                {/* Email input component */}
                <div className="space-y-1">
                  <label htmlFor="email" className="sr-only">Email, Username, or Employee ID</label>
                  <motion.div 
                    animate={{ 
                      scale: isEmailFocused ? 1.015 : 1,
                      boxShadow: isEmailFocused ? "0 0 20px rgba(99, 102, 241, 0.15)" : "none"
                    }}
                    transition={{ duration: 0.2 }}
                    className="relative rounded-md shadow-sm"
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      id="email"
                      type="text"
                      autoComplete="email"
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      className={`block w-full pl-10 pr-3 py-3 bg-slate-950/80 border rounded-md text-white placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-300 ${
                        errors.email ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500' : 'border-slate-850/85'
                      }`}
                      placeholder="Email, Username, or Employee ID"
                      {...register('email', { 
                        required: 'Email, Username, or Employee ID is required'
                      })}
                    />
                  </motion.div>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, x: -5 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      className="text-[11px] text-red-400 pl-1 font-mono"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>

                {/* Password input component */}
                <div className="space-y-1">
                  <label htmlFor="password" className="sr-only">Password</label>
                  <motion.div 
                    animate={{ 
                      scale: isPasswordFocused ? 1.015 : 1,
                      boxShadow: isPasswordFocused ? "0 0 20px rgba(99, 102, 241, 0.15)" : "none"
                    }}
                    transition={{ duration: 0.2 }}
                    className="relative rounded-md shadow-sm"
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      className={`block w-full pl-10 pr-3 py-3 bg-slate-950/80 border rounded-md text-white placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-300 ${
                        errors.password ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500' : 'border-slate-850/85'
                      }`}
                      placeholder="Password"
                      {...register('password', { required: 'Password is required' })}
                    />
                  </motion.div>
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, x: -5 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      className="text-[11px] text-red-400 pl-1 font-mono"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Remember Me / Forgot Password */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 bg-slate-950 border-slate-800 rounded text-indigo-500 focus:ring-offset-slate-950 focus:ring-indigo-500 cursor-pointer"
                    {...register('rememberMe')}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-slate-300 hover:text-white cursor-pointer select-none">
                    Remember me
                  </label>
                </div>

                <div>
                  <Link to="/forgot-password" className="font-semibold text-indigo-400 hover:text-indigo-350 transition-colors">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              {/* reCAPTCHA dark frame wrapper */}
              <div className="flex flex-col items-center py-2 bg-slate-950/60 border border-slate-900 rounded-xl p-4 shadow-inner">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={handleRecaptchaChange}
                  onExpired={handleRecaptchaExpired}
                  theme="dark"
                />
                {recaptchaError && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="mt-2.5 text-[11px] text-red-400 font-mono text-center pl-1"
                  >
                    {recaptchaError}
                  </motion.p>
                )}
              </div>

              {/* Action Button Sign In */}
              <div>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(99, 102, 241, 0.45)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative flex w-full justify-center rounded-lg border border-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-3.5 px-4 text-sm font-semibold text-white transition-all duration-300 disabled:opacity-75 cursor-pointer shadow-lg shadow-indigo-600/10 overflow-hidden"
                >
                  {/* Sweep Shine Overlay */}
                  <div className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-150%] group-hover:animate-shine pointer-events-none" />
                  
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4.5 w-4.5 animate-spin text-white" />
                      <span>Validating credentials...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-white" />
                      <span>Sign in</span>
                    </div>
                  )}
                </motion.button>
              </div>
            </form>

            {/* Back Button */}
            <div className="text-center text-xs mt-4">
              <Link to="/" className="text-slate-500 hover:text-slate-350 transition-colors">
                &larr; Back to Landing Page
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
