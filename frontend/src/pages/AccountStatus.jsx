import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const AccountStatus = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests');
      // Filter self activation requests
      const actReqs = res.data.filter(r => r.requestType === 'Account Activation Request' && r.requester?._id === user?._id);
      setRequests(actReqs);
    } catch (e) {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRequestActivation = async () => {
    setSubmitting(true);
    try {
      await api.post('/requests', {
        requestType: 'Account Activation Request',
        targetUserId: user._id,
        newValues: { isActive: true },
        remarks: 'Please activate my profile. Need system clearance.'
      });
      toast.success('Activation request submitted successfully!');
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit activation request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-lightBg dark:bg-darkBg transition-colors duration-300">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const activeRequest = requests[0]; // Get the latest submitted request

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent transition-colors duration-300 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass-card bg-white/75 dark:bg-[#16213E]/70 border border-indigo-500/20 p-8 rounded-3xl shadow-glow-indigo space-y-6"
      >
        <div className="text-center space-y-2">
          <span className="text-5xl animate-bounce duration-1000 inline-block">🔒</span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-4">Account Restrained</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">Logged in as: <span className="font-bold text-gray-800 dark:text-slate-350">{user?.username} ({user?.email})</span></p>
        </div>

        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs space-y-1.5 text-center">
          <p className="font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Status: Restricted / Inactive</p>
          <p className="text-gray-500 dark:text-slate-300 font-medium">This account requires system activation or administrative clearance before access can be granted.</p>
        </div>

        {activeRequest ? (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-cyan-400">Activation Progress</h4>
              <div className="space-y-3 mt-2 text-xs">
                <div className="flex gap-2.5 items-center">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">✓</span>
                  <span className="text-gray-900 dark:text-white font-bold">Request Submitted</span>
                </div>
                <div className="flex gap-2.5 items-center">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold animate-pulse">●</span>
                  <span className="text-gray-900 dark:text-white font-bold">Under Administrative Review (Approvals pending)</span>
                </div>
                <div className="flex gap-2.5 items-center opacity-40">
                  <span className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-700 text-white flex items-center justify-center font-bold">3</span>
                  <span className="text-gray-600 dark:text-gray-400">Approved & Profile Unlocked</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center font-bold">Submitted On: {new Date(activeRequest.createdAt).toLocaleString()}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-slate-350 text-center leading-normal font-medium">
              Click the request button below to submit a reactivation query to your Organization Administrator.
            </p>
            <button
              onClick={handleRequestActivation}
              disabled={submitting}
              className="w-full btn-premium-gradient py-3 text-white rounded-xl font-bold border-0 cursor-pointer transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting Activation Request...' : 'Request Account Activation'}
            </button>
          </div>
        )}

        <div className="border-t border-indigo-500/10 dark:border-indigo-500/20 pt-4 flex gap-3">
          <button className="flex-1 rounded-xl py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-850 dark:text-white border-0 font-bold cursor-pointer text-xs transition-all" onClick={fetchStatus}>Refresh Check</button>
          <button className="flex-1 rounded-xl py-2.5 bg-transparent border border-red-500/20 hover:bg-red-500/10 text-red-500 font-bold cursor-pointer text-xs transition-all" onClick={logout}>Sign Out</button>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountStatus;
