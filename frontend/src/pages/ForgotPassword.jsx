import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900">Forgot Password</h2>
              <p className="mt-2 text-center text-sm text-gray-600">Enter your email to receive a secure OTP.</p>
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                type="email"
                required
                className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
              >
                {isSubmitting ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
            <div className="text-center text-sm">
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Back to Login</Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900">Enter OTP</h2>
              <p className="mt-2 text-center text-sm text-gray-600">We've sent a 6-digit code to {email}</p>
            </div>
            
            <div className="flex justify-center space-x-2 my-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={otpRefs[index]}
                  type="text"
                  maxLength="1"
                  className="w-12 h-14 text-center text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                required
                className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-70"
              >
                {isSubmitting ? 'Verifying...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Success!</h2>
            <p className="text-gray-600">Your password has been successfully reset.</p>
            <Link to="/login" className="inline-block w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Login to your account
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
