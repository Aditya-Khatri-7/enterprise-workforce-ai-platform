import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, archived: 0 });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await api.get('/employees');
        
        // Calculate basic stats
        const active = data.filter(e => e.status === 'Active').length;
        const archived = data.filter(e => e.status === 'Archived').length;
        setStats({ total: data.length, active, archived });

        // Get 5 most recent
        setRecentEmployees(data.slice(-5).reverse());
      } catch (error) {
        console.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading dashboard metrics...</div>;

  return (
    <div className="space-y-6">
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
                <dd className="text-3xl font-semibold text-gray-900">{stats.total}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Employees</dt>
                <dd className="text-3xl font-semibold text-gray-900">{stats.active}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 flex items-center">
            <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Archived / Terminated</dt>
                <dd className="text-3xl font-semibold text-gray-900">{stats.archived}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Employees */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Recent Employees Table */}
        <div className="bg-white shadow rounded-lg lg:col-span-2">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Employees</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {recentEmployees.length === 0 ? (
              <li className="px-4 py-4 sm:px-6 text-gray-500 text-sm">No employees found.</li>
            ) : (
              recentEmployees.map(emp => (
                <li key={emp._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-blue-600 truncate">{emp.firstName} {emp.lastName}</div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {emp.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {emp.designation} - {emp.department}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>Joined {new Date(emp.joiningDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-4 flex flex-col space-y-4">
            <Link to="/admin/employees" className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
              Create New Employee
            </Link>
            <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
              Generate Payroll Report
            </button>
            <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
              Manage Roles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
