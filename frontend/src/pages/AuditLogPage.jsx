import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/audit');
      setLogs(data);
    } catch (error) {
      toast.error('Failed to load audit logs from the database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'FAILED_LOGIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PASSWORD_CHANGE':
      case 'USER_PASSWORD_RESET':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ORGANIZATION_CREATED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'USER_CREATED':
      case 'EMPLOYEE_CREATED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'USER_UNLOCKED':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const actionMatch = log.action?.toLowerCase().includes(term);
    const userMatch = log.userRef?.username?.toLowerCase().includes(term) || log.userRef?.email?.toLowerCase().includes(term);
    const targetMatch = log.targetUserRef?.username?.toLowerCase().includes(term) || log.targetUserRef?.email?.toLowerCase().includes(term);
    const detailsMatch = log.details?.toLowerCase().includes(term);
    return actionMatch || userMatch || targetMatch || detailsMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">System Audit Logs</h3>
          <p className="text-sm text-gray-500">Real-time audit logs fetched directly from the database</p>
        </div>
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Initiator</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Target User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                      <span>Loading database audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    No matching audit logs found in the database.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.userRef?.username || 'System'}</div>
                      <div className="text-xs text-gray-500">{log.userRef?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.targetUserRef ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">{log.targetUserRef.username}</div>
                          <div className="text-xs text-gray-500">{log.targetUserRef.email}</div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={log.details}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
