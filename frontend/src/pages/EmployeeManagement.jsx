import React, { useEffect, useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { DemoContext } from '../context/DemoContext';

const EmployeeManagement = () => {
  const { user } = useContext(AuthContext);
  const { isDemoMode, demoRole } = useContext(DemoContext);
  const activeRole = isDemoMode ? demoRole : user?.role;
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      setEmployees(data);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const onSubmit = async (data) => {
    try {
      // Step 5: Backend generates ID, username, password. We just send the details.
      const res = await api.post('/employees', data);
      
      toast.success(res.data.message);
      
      // We can display the generated credentials (since it's an admin creating it, they'd send it to the user)
      alert(`Employee Created! \nUsername: ${res.data.credentials.username} \nTemporary Password: ${res.data.credentials.temporaryPassword}`);
      
      setShowModal(false);
      reset();
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create employee');
    }
  };

  const handleToggleSuspend = async (emp) => {
    const isSuspended = !emp.userRef?.isActive;
    const action = isSuspended ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} ${emp.firstName} ${emp.lastName}'s account?`)) return;
    try {
      await api.put(`/users/${emp.userRef?._id}/status`, { isActive: isSuspended });
      toast.success(`Employee account ${isSuspended ? 'activated' : 'suspended'} successfully`);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${action} employee`);
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Permanently delete ${name}'s record? This cannot be undone.`)) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee record deleted');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  // Role-based filtering: exclude archived, Org Admin accounts, and HR Manager accounts
  const visibleEmployees = employees.filter(emp => {
    const role = emp.userRef?.role?.name;
    if (emp.status === 'Archived') return false;
    if (activeRole === 'Organization Admin') {
      return role !== 'Organization Admin';
    }
    if (activeRole === 'HR Manager') {
      return role !== 'Organization Admin' && role !== 'HR Manager';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Manage Employees</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Viewing as: <span className="font-semibold text-blue-600">{activeRole || 'Admin'}</span>
            {' '}&mdash; {visibleEmployees.length} record{visibleEmployees.length !== 1 ? 's' : ''} visible
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow-sm transition-colors"
        >
          + Add Employee
        </button>
      </div>

      {/* Employee List Table */}
      <div className="glass-card bg-white/50 dark:bg-darkSurface/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-darkBorder">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs divide-y divide-gray-100 dark:divide-darkBorder">
            <thead className="table-header-premium uppercase text-[10px]">
              <tr>
                <th className="px-6 py-3 text-left">Employee</th>
                <th className="px-6 py-3 text-left">ID & Role</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-darkBorder">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-gray-400 font-semibold">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600 dark:border-cyan-400"></div>
                      <span>Loading employee files...</span>
                    </div>
                  </td>
                </tr>
              ) : visibleEmployees.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-gray-400 font-semibold">No employees found.</td></tr>
              ) : (
                visibleEmployees.map(emp => (
                  <tr key={emp._id} className="table-row-premium">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 flex-shrink-0 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center text-indigo-700 dark:text-cyan-400 font-black border border-indigo-250/20 text-xs">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="font-black text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</div>
                          <div className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">
                      <div className="font-mono text-gray-900 dark:text-white font-semibold">{emp.employeeId}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{emp.userRef?.role?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const isSuspended = emp.userRef?.isActive === false;
                        const statusLabel = isSuspended ? 'Suspended' : (emp.status || 'Active');
                        const statusColor = isSuspended
                          ? 'bg-orange-50 text-orange-700 border-orange-100'
                          : emp.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100'
                          : emp.status === 'On Leave' ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                          : 'bg-gray-50 text-gray-600 border-gray-150';
                        return (
                          <span className={`px-2 py-0.5 inline-flex text-[9px] leading-5 font-black uppercase tracking-wider rounded-full border ${statusColor}`}>
                            {statusLabel}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleToggleSuspend(emp)}
                          className={`font-bold py-1.5 px-3 rounded-xl text-xs border transition-all ${
                            emp.userRef?.isActive !== false
                              ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/10 dark:text-orange-400'
                              : 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/10 dark:text-green-400'
                          }`}
                        >
                          {emp.userRef?.isActive !== false ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp._id, `${emp.firstName} ${emp.lastName}`)}
                          className="font-bold py-1.5 px-3 rounded-xl text-xs bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/10 dark:text-red-400 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom glass-card bg-white dark:bg-[#151A30] rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-indigo-500/20 dark:border-indigo-500/35">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="px-6 pt-6 pb-4 sm:p-6 sm:pb-4 space-y-4">
                  <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">Create New Employee</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">First Name</label>
                      <input type="text" {...register('firstName', { required: true })} className="mt-1 block w-full border border-indigo-500/20 dark:border-indigo-500/20 bg-white/50 dark:bg-[#0B1023]/40 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Last Name</label>
                      <input type="text" {...register('lastName', { required: true })} className="mt-1 block w-full border border-indigo-500/20 dark:border-indigo-500/20 bg-white/50 dark:bg-[#0B1023]/40 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Email Address</label>
                      <input type="email" {...register('email', { required: true })} className="mt-1 block w-full border border-indigo-500/20 dark:border-indigo-500/20 bg-white/50 dark:bg-[#0B1023]/40 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Phone</label>
                      <input type="text" {...register('phone')} className="mt-1 block w-full border border-indigo-500/20 dark:border-indigo-500/20 bg-white/50 dark:bg-[#0B1023]/40 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Department</label>
                      <input type="text" {...register('department', { required: true })} className="mt-1 block w-full border border-indigo-500/20 dark:border-indigo-500/20 bg-white/50 dark:bg-[#0B1023]/40 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Designation</label>
                      <input type="text" {...register('designation', { required: true })} className="mt-1 block w-full border border-indigo-500/20 dark:border-indigo-500/20 bg-white/50 dark:bg-[#0B1023]/40 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Security Role</label>
                      <select {...register('roleName', { required: true })} className="mt-1 block w-full bg-white dark:bg-[#151A30] border border-indigo-500/20 dark:border-indigo-500/35 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:text-white">
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                        <option value="HR Manager">HR Manager</option>
                        <option value="Finance">Finance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Joining Date</label>
                      <input type="date" {...register('joiningDate', { required: true })} className="mt-1 block w-full border border-indigo-500/20 dark:border-indigo-500/20 bg-white/50 dark:bg-[#0B1023]/40 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:text-white" />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">💡 Note: Employee credentials (username, password) and official ID are generated securely by the kernel directory services upon saving.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/40 px-6 py-4 flex flex-row-reverse gap-3 border-t border-indigo-500/10 dark:border-indigo-500/20">
                  <button type="submit" disabled={isSubmitting} className="btn-premium-gradient inline-flex justify-center text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md">
                    {isSubmitting ? 'Onboarding...' : 'Onboard Employee'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="inline-flex justify-center rounded-xl border border-indigo-500/20 dark:border-indigo-500/30 px-4 py-2.5 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
