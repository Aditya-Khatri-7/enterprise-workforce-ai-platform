import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const employee = user?.employeeRef || {};
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'password'

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      mobile: employee.mobile,
      address: employee.address
    }
  });

  const { register: pwdRegister, handleSubmit: pwdHandleSubmit, reset: pwdReset, formState: { isSubmitting: pwdIsSubmitting, errors: pwdErrors } } = useForm();

  const onDetailsSubmit = async (data) => {
    try {
      await api.put(`/employees/${employee._id}`, data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Password changed successfully');
      pwdReset();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        
        {/* Header Profile Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-8">
          <div className="flex items-center space-x-6">
            <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center text-gray-800 text-3xl font-bold border-4 border-white shadow-lg relative group cursor-pointer">
              {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-medium">Upload Photo</span>
              </div>
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h1>
              <p className="text-gray-300">{employee.designation} - {employee.department}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Employee ID: {employee.employeeId}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={`${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Personal Details
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`${activeTab === 'password' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Change Password
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'details' ? (
            <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input type="text" {...register('firstName')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input type="text" {...register('lastName')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile</label>
                  <input type="text" {...register('mobile')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address (Read Only)</label>
                  <input type="text" value={employee.email} disabled className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-500 sm:text-sm border cursor-not-allowed" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea {...register('address')} rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm border"></textarea>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-70">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={pwdHandleSubmit(onPasswordSubmit)} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <input type="password" {...pwdRegister('currentPassword', { required: true })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input type="password" {...pwdRegister('newPassword', { required: true, minLength: 8 })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm border" />
                {pwdErrors.newPassword && <p className="mt-1 text-xs text-red-500">Password must be at least 8 characters long</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input type="password" {...pwdRegister('confirmPassword', { required: true })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm border" />
              </div>
              <div>
                <button type="submit" disabled={pwdIsSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-70">
                  {pwdIsSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
