import React, { useEffect, useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const EmployeeManagement = () => {
  const { user } = useContext(AuthContext);
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
    if (user?.role === 'Organization Admin') {
      return role !== 'Organization Admin';
    }
    if (user?.role === 'HR Manager') {
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
            Viewing as: <span className="font-semibold text-blue-600">{user?.role || 'Admin'}</span>
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
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID & Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-4 text-center">Loading...</td></tr>
              ) : visibleEmployees.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No employees found.</td></tr>
              ) : (
                visibleEmployees.map(emp => (
                  <tr key={emp._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</div>
                          <div className="text-sm text-gray-500">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{emp.employeeId}</div>
                      <div className="text-sm text-gray-500">{emp.userRef?.role?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const isSuspended = emp.userRef?.isActive === false;
                        const statusLabel = isSuspended ? 'Suspended' : (emp.status || 'Active');
                        const statusColor = isSuspended
                          ? 'bg-orange-100 text-orange-800'
                          : emp.status === 'Active' ? 'bg-green-100 text-green-800'
                          : emp.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600';
                        return (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                            {statusLabel}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleToggleSuspend(emp)}
                          className={`font-semibold py-1 px-3 rounded text-xs transition-colors ${
                            emp.userRef?.isActive !== false
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {emp.userRef?.isActive !== false ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp._id, `${emp.firstName} ${emp.lastName}`)}
                          className="font-semibold py-1 px-3 rounded text-xs bg-gray-100 text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
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
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create New Employee</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input type="text" {...register('firstName', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input type="text" {...register('lastName', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input type="email" {...register('email', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input type="text" {...register('phone')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <input type="text" {...register('department', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Designation</label>
                      <input type="text" {...register('designation', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <select {...register('roleName', { required: true })} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                        <option value="HR Manager">HR Manager</option>
                        <option value="Finance">Finance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                      <input type="date" {...register('joiningDate', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-gray-500">Note: Employee ID, Username, and Password will be auto-generated securely upon creation.</p>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={isSubmitting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                    {isSubmitting ? 'Saving...' : 'Save Employee'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
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
