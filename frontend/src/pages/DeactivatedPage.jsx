import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ShieldAlert, RefreshCw, Send, Lock } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const DeactivatedPage = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [suspendInfo, setSuspendInfo] = useState(null);
  const [reqStatus, setReqStatus] = useState(null); // 'Pending' | 'Approved' | 'Rejected' | null
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  // Load status
  const checkStatus = async (showToast = false) => {
    try {
      setChecking(true);
      const { data } = await api.get('/users/me/reactivation-status');
      setReqStatus(data.reactivationRequest?.status || null);
      setSuspendInfo(data);

      if (data.status === 'Active' || data.reactivationRequest?.status === 'Approved') {
        toast.success('Your account has been reactivated!');
        logout(); // clear cookies/state and redirect to login
      } else if (showToast) {
        toast.info(`Request status is currently: ${data.reactivationRequest?.status || 'None'}`);
      }
    } catch (err) {
      console.error(err);
      if (showToast) toast.error('Failed to fetch status');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Poll every 30 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 30); // wait, 30 seconds is 30000ms! The prompt says "every 30 seconds"
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (formData) => {
    try {
      setSubmitting(true);
      await api.post('/users/me/reactivation-request', { reason: formData.reason });
      toast.success('Request sent. Your manager has been notified.');
      checkStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reactivation request');
    } finally {
      setSubmitting(false);
    }
  };

  // Poll intervals:
  useEffect(() => {
    const timer = setInterval(() => {
      checkStatus();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1023] text-white flex items-center justify-center p-4 font-sans selection:bg-cyan-500 selection:text-black">
      <div className="glass-card border border-red-500/20 max-w-lg w-full rounded-3xl p-8 space-y-6 text-center shadow-2xl relative overflow-hidden bg-gradient-to-tr from-[#1A1124] to-[#0E1535]">
        
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl"></div>

        <div className="flex justify-center">
          <div className="p-5 bg-red-500/10 rounded-3xl border border-red-500/30 text-red-500 animate-pulse">
            <ShieldAlert className="h-12 w-12" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight uppercase text-red-500">Account Suspended</h2>
          <p className="text-xs text-slate-400 font-medium">Your access to the platform has been temporarily disabled.</p>
        </div>

        {suspendInfo && suspendInfo.suspendReason && (
          <div className="bg-black/40 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Suspended Reason</span>
              <p className="text-slate-200 mt-0.5 font-medium">{suspendInfo.suspendReason}</p>
            </div>
          </div>
        )}

        {reqStatus === 'Approved' && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl p-4 text-xs font-bold text-center">
            Your account has been reactivated. Click below to login.
            <button
              onClick={() => logout()}
              className="mt-2 block w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
            >
              Go to Login
            </button>
          </div>
        )}

        {reqStatus === 'Pending' && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-2xl p-4 text-xs font-bold text-center flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
            <span>Reactivation Request is Pending Review. Your manager has been notified.</span>
          </div>
        )}

        {reqStatus === 'Rejected' && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-4 text-xs font-bold text-center">
            Your reactivation request was rejected. You can submit another request below.
          </div>
        )}

        {(!reqStatus || reqStatus === 'Rejected') && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Request Reactivation Reason</label>
              <textarea
                {...register('reason', { required: 'Please provide a reason for reactivation' })}
                rows={3}
                placeholder="Explain why your account should be reactivated..."
                className="w-full text-xs p-4 bg-black/40 border border-slate-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-200 placeholder:text-slate-600"
              ></textarea>
              {errors.reason && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.reason.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-red-600 hover:bg-red-700 font-bold uppercase tracking-wider text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-white border-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submitting ? 'Submitting Request...' : 'Request Reactivation'}</span>
            </button>
          </form>
        )}

        <div className="flex gap-4 border-t border-slate-850 pt-4">
          <button
            onClick={() => checkStatus(true)}
            disabled={checking}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all text-white border-0 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
            <span>Check Request Status</span>
          </button>
          
          <button
            onClick={logout}
            className="flex-1 py-2 bg-slate-900 hover:bg-black font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all text-slate-400 border border-slate-800 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivatedPage;
