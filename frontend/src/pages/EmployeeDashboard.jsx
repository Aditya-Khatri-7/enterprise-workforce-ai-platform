import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 sm:p-10 text-white">
          <h2 className="text-3xl font-bold">Welcome back, {user?.employeeRef?.firstName || user?.username}!</h2>
          <p className="mt-2 text-blue-100 text-lg">Here's a summary of your workplace activities.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Placeholder Widgets */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Attendance</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">98%</p>
          <p className="mt-1 text-sm text-green-600">+2% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Leave Balance</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">12 Days</p>
          <p className="mt-1 text-sm text-gray-600">3 Sick, 9 Casual</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Assigned Tasks</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">5</p>
          <p className="mt-1 text-sm text-blue-600">2 pending review</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Profile Completion</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">85%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Notifications</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="h-2 w-2 mt-2 rounded-full bg-blue-500 mr-2"></span>
              <p className="text-gray-700 text-sm">Your leave request for Aug 15 has been approved.</p>
            </li>
            <li className="flex items-start">
              <span className="h-2 w-2 mt-2 rounded-full bg-blue-500 mr-2"></span>
              <p className="text-gray-700 text-sm">Quarterly Townhall meeting scheduled for Friday.</p>
            </li>
            <li className="flex items-start">
              <span className="h-2 w-2 mt-2 rounded-full bg-gray-400 mr-2"></span>
              <p className="text-gray-500 text-sm">Please update your emergency contact details in the profile.</p>
            </li>
          </ul>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-gray-50 hover:bg-gray-100 border rounded py-3 text-sm font-medium text-gray-700 transition-colors">Apply Leave</button>
            <button className="bg-gray-50 hover:bg-gray-100 border rounded py-3 text-sm font-medium text-gray-700 transition-colors">View Payslip</button>
            <button className="bg-gray-50 hover:bg-gray-100 border rounded py-3 text-sm font-medium text-gray-700 transition-colors">Company Policies</button>
            <button className="bg-gray-50 hover:bg-gray-100 border rounded py-3 text-sm font-medium text-gray-700 transition-colors">IT Support Ticket</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
