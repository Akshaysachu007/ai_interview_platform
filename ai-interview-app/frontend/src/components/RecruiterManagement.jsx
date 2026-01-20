import React, { useState, useEffect } from 'react';
import './RecruiterManagement.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function RecruiterManagement() {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, verified

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const fetchRecruiters = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/recruiters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRecruiters(data);
      }
    } catch (err) {
      console.error('Error fetching recruiters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unverify' : 'verify'} this recruiter?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/recruiters/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verified: !currentStatus })
      });
      
      if (res.ok) {
        alert(`Recruiter ${currentStatus ? 'unverified' : 'verified'} successfully!`);
        fetchRecruiters();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update verification');
      }
    } catch (err) {
      alert('Error updating verification: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete recruiter "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/recruiters/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert('Recruiter deleted successfully!');
        fetchRecruiters();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete recruiter');
      }
    } catch (err) {
      alert('Error deleting recruiter: ' + err.message);
    }
  };

  const getFilteredRecruiters = () => {
    if (filter === 'all') return recruiters;
    if (filter === 'pending') return recruiters.filter(r => !r.verified);
    if (filter === 'verified') return recruiters.filter(r => r.verified);
    return recruiters;
  };

  const filteredRecruiters = getFilteredRecruiters();

  if (loading) return <div>Loading recruiters...</div>;

  return (
    <div className="recruiter-management">
      <div className="management-header">
        <h2>Recruiter Management</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All ({recruiters.length})
          </button>
          <button 
            className={filter === 'pending' ? 'active' : ''} 
            onClick={() => setFilter('pending')}
          >
            Pending ({recruiters.filter(r => !r.verified).length})
          </button>
          <button 
            className={filter === 'verified' ? 'active' : ''} 
            onClick={() => setFilter('verified')}
          >
            Verified ({recruiters.filter(r => r.verified).length})
          </button>
        </div>
      </div>

      {filteredRecruiters.length === 0 ? (
        <p className="no-data">No recruiters found.</p>
      ) : (
        <div className="recruiters-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Subscription</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecruiters.map((recruiter) => (
                <tr key={recruiter._id}>
                  <td>{recruiter.name}</td>
                  <td>{recruiter.email}</td>
                  <td>{recruiter.companyName || 'N/A'}</td>
                  <td>
                    <span className={`subscription-badge ${recruiter.subscriptionPlan}`}>
                      {recruiter.subscriptionPlan || 'None'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${recruiter.verified ? 'verified' : 'pending'}`}>
                      {recruiter.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>{new Date(recruiter.createdAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button
                      className={recruiter.verified ? 'unverify-btn' : 'verify-btn'}
                      onClick={() => handleVerify(recruiter._id, recruiter.verified)}
                    >
                      {recruiter.verified ? 'Unverify' : 'Verify'}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(recruiter._id, recruiter.name)}
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
