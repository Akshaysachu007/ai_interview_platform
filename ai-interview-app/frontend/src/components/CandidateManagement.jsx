import React, { useState, useEffect } from 'react';
import './CandidateManagement.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function CandidateManagement() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/candidates`, {
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
        setCandidates(data);
      } else {
        setError(data.message || 'Failed to load candidates');
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete candidate "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/candidates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminEmail');
        window.location.href = '/admin';
        return;
      }
      if (res.ok) {
        alert('Candidate deleted successfully!');
        fetchCandidates();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete candidate');
      }
    } catch (err) {
      alert('Error deleting candidate: ' + err.message);
    }
  };

  const getFilteredCandidates = () => {
    let filtered = candidates;
    if (filter === 'completed') filtered = filtered.filter(c => c.completed);
    if (filter === 'incomplete') filtered = filtered.filter(c => !c.completed);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.stream?.toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const filteredCandidates = getFilteredCandidates();

  if (loading) return <div>Loading candidates...</div>;
  if (error) return <div className="error-message" style={{padding:'20px',color:'#c0392b',background:'#fdecea',borderRadius:'8px',margin:'16px'}}>⚠️ {error}</div>;

  return (
    <div className="candidate-management">
      <div className="management-header">
        <h2>Candidate Management</h2>
        <div className="header-controls">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, or stream..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="filter-buttons">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({candidates.length})
            </button>
            <button
              className={filter === 'completed' ? 'active' : ''}
              onClick={() => setFilter('completed')}
            >
              Profile Complete ({candidates.filter(c => c.completed).length})
            </button>
            <button
              className={filter === 'incomplete' ? 'active' : ''}
              onClick={() => setFilter('incomplete')}
            >
              Incomplete ({candidates.filter(c => !c.completed).length})
            </button>
          </div>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <p className="no-data">No candidates found.</p>
      ) : (
        <div className="candidates-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Stream</th>
                <th>Skills</th>
                <th>Profile</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => (
                <tr key={candidate._id}>
                  <td>
                    <div className="candidate-cell">
                      <div className="candidate-avatar">
                        {candidate.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span>{candidate.name}</span>
                    </div>
                  </td>
                  <td>{candidate.email}</td>
                  <td>
                    <span className="stream-badge">
                      {candidate.stream || 'Not Set'}
                    </span>
                  </td>
                  <td>
                    <div className="skills-cell">
                      {candidate.skills?.slice(0, 3).map((skill, i) => (
                        <span key={i} className="skill-tag">{skill}</span>
                      ))}
                      {candidate.skills?.length > 3 && (
                        <span className="skill-tag more">+{candidate.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${candidate.completed ? 'complete' : 'incomplete'}`}>
                      {candidate.completed ? 'Complete' : 'Incomplete'}
                    </span>
                  </td>
                  <td>{new Date(candidate.createdAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(candidate._id, candidate.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
