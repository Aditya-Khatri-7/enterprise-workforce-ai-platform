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
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/40';
      case 'LOGOUT':
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-800/40';
      case 'FAILED_LOGIN':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/40';
      case 'PASSWORD_CHANGE':
      case 'USER_PASSWORD_RESET':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/40';
      case 'ORGANIZATION_CREATED':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/40';
      case 'USER_CREATED':
      case 'EMPLOYEE_CREATED':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/40';
      case 'USER_UNLOCKED':
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-800/40';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800/40';
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
          <h3 className="text-xl font-black text-gray-900 dark:text-white">System Audit Logs</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Real-time audit logs fetched directly from the database</p>
        </div>
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-indigo-500/20 dark:border-indigo-500/20 bg-white/50 dark:bg-gray-900/40 rounded-xl py-2 px-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 dark:text-white font-medium"
          />
        </div>
      </div>

      <div className="glass-card bg-white/50 dark:bg-darkSurface/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-darkBorder">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs divide-y divide-gray-100 dark:divide-darkBorder">
            <thead className="table-header-premium uppercase text-[10px]">
              <tr>
                <th className="px-6 py-3 text-left">Timestamp</th>
                <th className="px-6 py-3 text-left">Action</th>
                <th className="px-6 py-3 text-left">Initiator</th>
                <th className="px-6 py-3 text-left">Target User</th>
                <th className="px-6 py-3 text-left">IP Address</th>
                <th className="px-6 py-3 text-left">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-darkBorder">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-gray-400 font-semibold">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600 dark:border-cyan-400"></div>
                      <span>Loading database audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-gray-400 font-semibold">
                    No matching audit logs found in the database.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log._id} className="table-row-premium">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-black text-gray-900 dark:text-white">{log.userRef?.username || 'System'}</div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">{log.userRef?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.targetUserRef ? (
                        <>
                          <div className="font-black text-gray-900 dark:text-white">{log.targetUserRef.username}</div>
                          <div className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">{log.targetUserRef.email}</div>
                        </>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-700 dark:text-gray-300 font-semibold">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-350 font-medium max-w-xs truncate" title={log.details}>
                      {log.details || '—'}
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
