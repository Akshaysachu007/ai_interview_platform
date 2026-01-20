import React, { useState, useEffect } from 'react';
import './SystemLogs.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, verify, delete, pricing

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLogs = () => {
    if (filter === 'all') return logs;
    return logs.filter(log => log.action.toLowerCase().includes(filter));
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('verify')) return 'action-verify';
    if (action.includes('delete')) return 'action-delete';
    if (action.includes('pricing')) return 'action-pricing';
    return 'action-default';
  };

  const filteredLogs = getFilteredLogs();

  if (loading) return <div>Loading logs...</div>;

  return (
    <div className="system-logs">
      <div className="logs-header">
        <h2>System Activity Logs</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All Logs
          </button>
          <button 
            className={filter === 'verify' ? 'active' : ''} 
            onClick={() => setFilter('verify')}
          >
            Verification
          </button>
          <button 
            className={filter === 'delete' ? 'active' : ''} 
            onClick={() => setFilter('delete')}
          >
            Deletions
          </button>
          <button 
            className={filter === 'pricing' ? 'active' : ''} 
            onClick={() => setFilter('pricing')}
          >
            Pricing Updates
          </button>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <p className="no-data">No logs found.</p>
      ) : (
        <div className="logs-table">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Target User</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td className="timestamp-cell">
                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                    <div className="time">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td>
                    <span className={`action-badge ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    {log.performedBy ? (
                      <>
                        <div>{log.performedBy.name}</div>
                        <div className="email">{log.performedBy.email}</div>
                      </>
                    ) : (
                      'System'
                    )}
                  </td>
                  <td>
                    {log.targetUser ? (
                      <>
                        <div>{log.targetUser.name}</div>
                        <div className="email">{log.targetUser.email}</div>
                        <span className="user-type-badge">{log.targetUserType}</span>
                      </>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="details-cell">
                    {log.details}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="metadata">
                        {Object.entries(log.metadata).map(([key, value]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {JSON.stringify(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{log.ipAddress || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
