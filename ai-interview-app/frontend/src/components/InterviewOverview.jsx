import React, { useState, useEffect } from 'react';
import './InterviewOverview.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function InterviewOverview() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/interviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminEmail');
        window.location.href = '/admin';
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setInterviews(data);
      } else {
        setError(data.message || 'Failed to load interviews');
      }
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredInterviews = () => {
    let filtered = interviews;
    if (filter === 'in-progress') filtered = filtered.filter(i => i.status === 'in-progress');
    if (filter === 'completed') filtered = filtered.filter(i => i.status === 'completed');
    if (filter === 'scheduled') filtered = filtered.filter(i => i.status === 'scheduled');
    if (filter === 'flagged') filtered = filtered.filter(i => i.flagged);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.candidateName?.toLowerCase().includes(term) ||
        i.recruiterName?.toLowerCase().includes(term) ||
        i.stream?.toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const filteredInterviews = getFilteredInterviews();

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return 'blue';
      case 'completed': return 'green';
      case 'scheduled': return 'gray';
      case 'flagged': return 'red';
      default: return 'gray';
    }
  };

  if (loading) return <div>Loading interviews...</div>;
  if (error) return <div className="error-message" style={{padding:'20px',color:'#c0392b',background:'#fdecea',borderRadius:'8px',margin:'16px'}}>⚠️ {error}</div>;

  return (
    <div className="interview-overview">
      <div className="overview-header">
        <h2>Interview Overview</h2>
        <div className="overview-summary">
          <div className="summary-item">
            <span className="summary-count">{interviews.length}</span>
            <span className="summary-label">Total</span>
          </div>
          <div className="summary-item blue">
            <span className="summary-count">{interviews.filter(i => i.status === 'in-progress').length}</span>
            <span className="summary-label">In Progress</span>
          </div>
          <div className="summary-item green">
            <span className="summary-count">{interviews.filter(i => i.status === 'completed').length}</span>
            <span className="summary-label">Completed</span>
          </div>
          <div className="summary-item red">
            <span className="summary-count">{interviews.filter(i => i.flagged).length}</span>
            <span className="summary-label">Flagged</span>
          </div>
        </div>
      </div>

      <div className="header-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Search by candidate, recruiter, or stream..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            All ({interviews.length})
          </button>
          <button className={filter === 'in-progress' ? 'active' : ''} onClick={() => setFilter('in-progress')}>
            In Progress ({interviews.filter(i => i.status === 'in-progress').length})
          </button>
          <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>
            Completed ({interviews.filter(i => i.status === 'completed').length})
          </button>
          <button className={filter === 'scheduled' ? 'active' : ''} onClick={() => setFilter('scheduled')}>
            Scheduled ({interviews.filter(i => i.status === 'scheduled').length})
          </button>
          <button className={filter === 'flagged' ? 'active' : ''} onClick={() => setFilter('flagged')}>
            Flagged ({interviews.filter(i => i.flagged).length})
          </button>
        </div>
      </div>

      {filteredInterviews.length === 0 ? (
        <p className="no-data">No interviews found.</p>
      ) : (
        <div className="interviews-table">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Recruiter</th>
                <th>Stream</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Score</th>
                <th>Application</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterviews.map((interview) => (
                <tr key={interview._id}>
                  <td>
                    <div className="cell-with-avatar">
                      <div className="avatar-sm candidate-bg">
                        {interview.candidateName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <span className="primary-text">{interview.candidateName || 'Unassigned'}</span>
                        <span className="secondary-text">{interview.candidateEmail || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cell-with-avatar">
                      <div className="avatar-sm recruiter-bg">
                        {interview.recruiterName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <span className="primary-text">{interview.recruiterName || 'Unknown'}</span>
                        <span className="secondary-text">{interview.recruiterCompany || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="stream-badge">{interview.stream}</span></td>
                  <td><span className={`difficulty-badge ${interview.difficulty?.toLowerCase()}`}>{interview.difficulty}</span></td>
                  <td>
                    <span className={`status-badge ${getStatusColor(interview.status)}`}>
                      {interview.flagged ? '⚠ Flagged' : interview.status}
                    </span>
                  </td>
                  <td className="score-cell">
                    {interview.score != null ? (
                      <span className={`score ${interview.score >= 70 ? 'high' : interview.score >= 40 ? 'mid' : 'low'}`}>
                        {interview.score}/100
                      </span>
                    ) : '-'}
                  </td>
                  <td><span className={`app-status ${interview.applicationStatus}`}>{interview.applicationStatus}</span></td>
                  <td>{new Date(interview.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
