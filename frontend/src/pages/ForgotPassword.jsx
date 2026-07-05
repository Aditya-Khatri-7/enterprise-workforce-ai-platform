import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import api from '../services/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');
    
    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next box
    if (value !== '' && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return toast.error('Please enter the full 6-digit OTP');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', { email, otp: otpValue, newPassword });
      toast.success('Password reset successfully! You can now login.');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent py-12 px-4 sm:px-6 lg:px-8 relative z-10 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full space-y-8 glass-card p-10 rounded-2xl shadow-xl"
      >
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <h2 className="text-center text-3xl font-black text-gray-900 dark:text-white">Forgot Password</h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 font-medium">Enter your email to receive a secure OTP.</p>
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 bg-white/40 dark:bg-[#0B1023]/40 border border-indigo-500/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm transition-all duration-300"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3.5 px-4 btn-premium-gradient text-sm font-bold rounded-xl text-white focus:outline-none disabled:opacity-70 transition-all duration-300 shadow-lg"
              >
                {isSubmitting ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
            <div className="text-center text-sm">
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors duration-300">Back to Login</Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <h2 className="text-center text-3xl font-black text-gray-900 dark:text-white">Enter OTP</h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 font-medium font-sans">We've sent a 6-digit code to {email}</p>
            </div>
            
            <div className="flex justify-center space-x-2 my-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={otpRefs[index]}
                  type="text"
                  maxLength="1"
                  className="w-12 h-14 text-center text-xl font-bold text-gray-900 dark:text-white bg-white/40 dark:bg-[#0B1023]/40 border border-indigo-500/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                />
              ))}
            </div>

            <div className="space-y-4">
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 bg-white/40 dark:bg-[#0B1023]/40 border border-indigo-500/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm transition-all duration-300"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 bg-white/40 dark:bg-[#0B1023]/40 border border-indigo-500/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm transition-all duration-300"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all duration-300 shadow-md shadow-indigo-500/20 disabled:opacity-70"
              >
                {isSubmitting ? 'Verifying...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Success!</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Your password has been successfully reset.</p>
            <Link to="/login" className="inline-block w-full py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-md shadow-indigo-500/20">
              Login to your account
            </Link>
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default ForgotPassword;
