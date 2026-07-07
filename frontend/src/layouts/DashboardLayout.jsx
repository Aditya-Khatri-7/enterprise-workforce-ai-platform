import React, { useContext, useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  GitPullRequest, 
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  History,
  FileText,
  Star,
  ShieldAlert,
  ClipboardList,
  Calendar,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { DemoContext } from '../context/DemoContext';
import AIChatWidget from '../components/AIChatWidget';
import api from '../services/api';
import DemoBadge from '../components/showcase/DemoBadge';
import AIExplainer from '../components/showcase/AIExplainer';
import GuidedTour from '../components/showcase/GuidedTour';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

// ─── Futuristic Multi-layered Gradient Logo ──────────────────────────────────
const FuturisticLogo = ({ className = "h-6 w-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#grad-top)" />
    <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="url(#grad-stroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="grad-top" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22D3EE" />
        <stop offset="0.5" stopColor="#6366F1" />
        <stop offset="1" stopColor="#D946EF" />
      </linearGradient>
      <linearGradient id="grad-stroke" x1="2" y1="12" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
);

const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { isDemoMode, demoRole, clearDemo } = useContext(DemoContext);
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  // Collapsible Sidebar States
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const activeRole = isDemoMode ? demoRole : (user?.role?.name || user?.role || '');
  const isAdmin = ['Super Admin', 'Organization Admin', 'HR Manager', 'IT Administrator', 'Auditor', 'Finance', 'Team Lead', 'Manager', 'Department Manager'].includes(activeRole);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (e) { /* silently ignore */ }
  };

  useEffect(() => {
    fetchNotifs();

    // Establish Socket.IO Connection
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const socket = io(`http://${hostname}:3000`, {
      withCredentials: true
    });

    if (user?._id) {
      socket.emit('join', user._id);
      console.log(`Joined Socket.IO Room for user: ${user._id}`);
    }

    socket.on('notification', (newNotif) => {
      console.log('Real-time notification arrived:', newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
      toast.info(`🔔 ${newNotif.title}: ${newNotif.message}`);
    });

    const interval = setInterval(fetchNotifs, 15000); // Polling fallback

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [user]);

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifs();
    } catch (e) { /* ignore */ }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex h-screen bg-transparent font-sans text-gray-800 dark:text-gray-100 overflow-hidden relative p-2 sm:p-4">
      {/* Sidebar */}
      <div 
        id="tour-sidebar" 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`border border-white/15 dark:border-indigo-500/10 bg-white/18 dark:bg-[#16213E]/18 text-gray-900 dark:text-white flex flex-col z-20 rounded-2xl shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-in-out ${isCollapsed && !isHovered ? 'w-20' : 'w-64'}`}
      >
        <div className="p-4 border-b border-indigo-500/10 dark:border-indigo-500/20 flex items-center justify-between gap-2 h-[72px]">
          <div className="flex items-center gap-2.5 mx-auto">
            <FuturisticLogo className="h-6 w-6 animate-pulse" />
            {(!isCollapsed || isHovered) && (
              <h1 className="text-sm font-black tracking-wider bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent uppercase">EWAP SAAS</h1>
            )}
          </div>
          {(!isCollapsed || isHovered) && (
            <button 
              onClick={() => setIsCollapsed(true)} 
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E2544]/60 text-slate-400 hover:text-slate-600 transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {isCollapsed && isHovered && (
            <button 
              onClick={() => setIsCollapsed(false)} 
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E2544]/60 text-slate-400 hover:text-slate-600 transition-colors"
              title="Expand Sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {/* Main Dashboard - applicable to all */}
          {['Super Admin', 'Organization Admin', 'HR Manager', 'IT Administrator', 'Auditor', 'Finance', 'Team Lead', 'Manager', 'Department Manager'].includes(activeRole) ? (
            <Link 
              to="/admin/dashboard" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname === '/admin/dashboard' ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-450 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'}`}
              title={isCollapsed && !isHovered ? "Dashboard Overview" : ""}
            >
              <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isHovered) && <span>Dashboard Overview</span>}
            </Link>
          ) : (
            <Link 
              to="/employee/dashboard" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname === '/employee/dashboard' ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'}`}
              title={isCollapsed && !isHovered ? "My Dashboard" : ""}
            >
              <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isHovered) && <span>My Dashboard</span>}
            </Link>
          )}

          {/* Org Admins, HR Managers, IT, Auditors */}
          {['Super Admin', 'Organization Admin', 'HR Manager', 'IT Administrator', 'Auditor'].includes(activeRole) && (
            <>
              <Link 
                to="/admin/employees" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/admin/employees') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Employee Records" : ""}
              >
                <Users className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Employee Records</span>}
              </Link>
              <Link 
                to="/admin/audit" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/admin/audit') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Audit logs" : ""}
              >
                <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Audit logs</span>}
              </Link>
              <Link 
                to="/admin/requests" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/admin/requests') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-305 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Workflow Requests" : ""}
              >
                <GitPullRequest className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Workflow Requests</span>}
              </Link>
            </>
          )}

          {/* Department Managers (Manager / Department Manager) */}
          {['Manager', 'Department Manager'].includes(activeRole) && (
            <>
              <Link 
                to="/admin/team-leads" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/admin/team-leads') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Supervised Team Leads" : ""}
              >
                <Users className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Team Leads Overview</span>}
              </Link>
              <Link 
                to="/admin/project-requests" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/admin/project-requests') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Project Modifications" : ""}
              >
                <GitPullRequest className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Project Requests</span>}
              </Link>
              <Link 
                to="/admin/team-requests" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/admin/team-requests') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Team Leadership Change Polls" : ""}
              >
                <ClipboardList className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Team Lead Swaps</span>}
              </Link>
              <Link 
                to="/admin/grievances" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/admin/grievances') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-305 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Employee Grievances" : ""}
              >
                <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Grievance Desk</span>}
              </Link>
              <Link 
                to="/admin/employee-ratings" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/admin/employee-ratings') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Review & Rate Department Employees" : ""}
              >
                <Star className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Employee Reviews</span>}
              </Link>
            </>
          )}

          {/* Team Leads */}
          {activeRole === 'Team Lead' && (
            <>
              <Link 
                to="/admin/my-team" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/admin/my-team') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-305 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "My Supervised Team" : ""}
              >
                <Users className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>My Team & Tasks</span>}
              </Link>
              <Link 
                to="/admin/team-lead-requests" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/admin/team-lead-requests') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-305 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Task Objections & Requests" : ""}
              >
                <GitPullRequest className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Team Requests</span>}
              </Link>
              <Link 
                to="/admin/employee-ratings" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/admin/employee-ratings') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-305 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Review & Rate Team Members" : ""}
              >
                <Star className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Team Reviews</span>}
              </Link>
            </>
          )}

          {/* Employees */}
          {['Employee', 'Manager', 'Department Manager', 'Team Lead'].includes(activeRole) && (
            <>
              <Link 
                to="/employee/projects" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/employee/projects') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-305 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "My Assigned Projects" : ""}
              >
                <Briefcase className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Team Projects</span>}
              </Link>
              <Link 
                to="/employee/history" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/employee/history') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-305 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Project & Task History Logs" : ""}
              >
                <History className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>History Logs</span>}
              </Link>
              <Link 
                to="/employee/company-info" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/employee/company-info') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "My Resume & Corporate Ratings" : ""}
              >
                <FileText className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Resume & Ratings</span>}
              </Link>
              <Link 
                to="/employee/leaves" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/employee/leaves') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Leave Status" : ""}
              >
                <Calendar className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Leave Status</span>}
              </Link>
              <Link 
                to="/employee/tickets" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/employee/tickets') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Service Tickets" : ""}
              >
                <MessageSquare className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Service Tickets</span>}
              </Link>
              <Link 
                to="/employee/team-lead-requests" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/employee/team-lead-requests') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Team Lead Swaps" : ""}
              >
                <UserCheck className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Team Lead Swaps</span>}
              </Link>
              <Link 
                to="/employee/project-requests" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname.includes('/employee/project-requests') ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-white'}`}
                title={isCollapsed && !isHovered ? "Project Requests" : ""}
              >
                <GitPullRequest className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isHovered) && <span>Project Requests</span>}
              </Link>
            </>
          )}

          {/* Profile link for all */}
          <Link 
            to="/profile" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isCollapsed && !isHovered ? 'justify-center' : ''} ${location.pathname === '/profile' ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-700 dark:text-cyan-400 border-l-4 border-cyan-455 shadow-sm' : 'hover:bg-slate-100/60 dark:hover:bg-[#1A1F3C]/50 text-slate-700 hover:text-indigo-600 dark:text-slate-305 dark:hover:text-white'}`}
            title={isCollapsed && !isHovered ? "My Profile" : ""}
          >
            <User className="h-5 w-5 flex-shrink-0" />
            {(!isCollapsed || isHovered) && <span>My Profile</span>}
          </Link>
        </nav>
        
        <div className="p-4 border-t border-indigo-500/10 dark:border-indigo-500/20">
          <button 
            onClick={logout}
            className={`flex items-center justify-center gap-2.5 w-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold py-2.5 rounded-xl transition-all duration-200 border border-red-500/10 ${isCollapsed && !isHovered ? 'px-0' : ''}`}
            title="Logout Account"
          >
            <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
            {(!isCollapsed || isHovered) && <span>Logout Account</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 sm:ml-4">
        {isDemoMode && (
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white px-6 py-2.5 flex items-center justify-between border-b border-indigo-500/30 text-xs font-bold shadow-md rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>DEMO MODE ACTIVE: Previewing as <span className="text-cyan-300 uppercase tracking-wider font-extrabold">{activeRole}</span></span>
            </div>
            <button 
              onClick={() => {
                clearDemo();
                window.location.href = '/demo';
              }} 
              className="bg-white/10 hover:bg-white/20 text-white font-bold py-1 px-3 rounded-lg border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              ← Switch Persona
            </button>
          </div>
        )}
        {/* Navbar */}
        <header className="bg-white/18 dark:bg-[#16213E]/18 border border-white/15 dark:border-indigo-500/10 flex items-center justify-between px-6 py-4 z-20 rounded-2xl shadow-xl backdrop-blur-2xl">
          <h2 className="text-lg font-black text-gray-900 dark:text-white capitalize tracking-wide">
            {location.pathname.split('/').pop().replace('-', ' ') || 'Dashboard'}
          </h2>
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-[#0B1023]/60 text-gray-600 dark:text-cyan-400 hover:bg-gray-200 dark:hover:bg-[#16213E] transition-colors border border-indigo-500/10"
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Notifications Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(prev => !prev)}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 glass-card bg-white dark:bg-darkSurface border border-gray-200 dark:border-darkBorder shadow-2xl rounded-2xl overflow-hidden py-2 z-50">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-darkBorder">
                    <span className="font-bold text-xs">Alert Notifications</span>
                    <button onClick={markAllAsRead} className="text-[10px] text-indigo-600 hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-darkBorder">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-gray-400">No notifications yet</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} className={`p-3 text-xs ${n.isRead ? 'opacity-60' : 'bg-indigo-50/20 dark:bg-indigo-950/10'}`}>
                          <p className="font-bold text-gray-900 dark:text-white">{n.title}</p>
                          <p className="text-gray-600 dark:text-gray-300 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Welcome, <span className="font-black text-gray-800 dark:text-gray-200">{isDemoMode ? `Demo (${activeRole})` : `${user?.username} (${activeRole})`}</span>
            </span>
            <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow">
              {(isDemoMode ? 'Demo' : user?.username)?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global AI Floating Widget Drawer */}
      <AIChatWidget />

      {localStorage.getItem('ewap_demo_mode') === 'true' && (
        <>
          <DemoBadge />
          <AIExplainer />
          <GuidedTour />
        </>
      )}
    </div>
  );
};

export default DashboardLayout;
