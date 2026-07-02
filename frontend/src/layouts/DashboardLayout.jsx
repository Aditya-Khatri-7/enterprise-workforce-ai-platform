import React, { useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const isAdmin = ['Super Admin', 'Organization Admin', 'HR Manager', 'IT Administrator'].includes(user?.role);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-center">
          <h1 className="text-xl font-bold uppercase tracking-wider">Enterprise HRMS</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {isAdmin ? (
            <>
              <Link 
                to="/admin/dashboard" 
                className={`block px-4 py-3 rounded transition-colors ${location.pathname === '/admin/dashboard' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
              >
                Dashboard
              </Link>
              {['Organization Admin', 'HR Manager'].includes(user?.role) && (
                <Link 
                  to="/admin/employees" 
                  className={`block px-4 py-3 rounded transition-colors ${location.pathname.includes('/admin/employees') ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                >
                  Employee Management
                </Link>
              )}
              {user?.role === 'Super Admin' && (
                <Link 
                  to="/admin/audit" 
                  className={`block px-4 py-3 rounded transition-colors ${location.pathname.includes('/admin/audit') ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                >
                  Audit Logs
                </Link>
              )}
            </>
          ) : (
            <>
              <Link 
                to="/employee/dashboard" 
                className={`block px-4 py-3 rounded transition-colors ${location.pathname === '/employee/dashboard' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
              >
                My Dashboard
              </Link>
              <Link 
                to="/profile" 
                className={`block px-4 py-3 rounded transition-colors ${location.pathname === '/profile' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
              >
                My Profile
              </Link>
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="bg-white shadow-sm flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">
            {location.pathname.split('/').pop().replace('-', ' ') || 'Dashboard'}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, <span className="font-bold text-gray-900">{user?.username}</span>
            </span>
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
