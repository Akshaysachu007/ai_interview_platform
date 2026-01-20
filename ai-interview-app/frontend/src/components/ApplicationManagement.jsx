import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, BookOpen } from 'lucide-react';
import './ApplicationManagement.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function ApplicationManagement() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('recruiterToken');
      const response = await fetch(`${API_URL}/recruiter/pending-applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch applications');

      const data = await response.json();
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (interviewId, decision) => {
    setProcessingId(interviewId);
    try {
      const token = localStorage.getItem('recruiterToken');
      const response = await fetch(`${API_URL}/recruiter/application/${interviewId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ decision })
      });

      if (!response.ok) throw new Error('Failed to process application');

      alert(`Application ${decision} successfully!`);
      fetchApplications(); // Refresh the list
    } catch (err) {
      console.error('Error processing application:', err);
      alert('Failed to process application. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading applications...</div>;
  }

  if (applications.length === 0) {
    return (
      <div className="no-applications">
        <Clock size={48} />
        <h3>No Pending Applications</h3>
        <p>You'll see candidate applications here when they apply for your interviews.</p>
      </div>
    );
  }

  return (
    <div className="application-management">
      <h2>Pending Applications ({applications.length})</h2>
      
      <div className="applications-list">
        {applications.map((app) => (
          <div key={app._id} className="application-card">
            <div className="application-header">
              <div className="candidate-info">
                <div className="candidate-avatar">
                  <User size={24} />
                </div>
                <div>
                  <h3>{app.candidateId?.name || 'Unknown'}</h3>
                  <p>{app.candidateId?.email || 'No email'}</p>
                </div>
              </div>
              <span className="status-badge pending">
                <Clock size={14} />
                Pending
              </span>
            </div>

            <div className="application-details">
              <div className="detail-item">
                <BookOpen size={16} />
                <span><strong>Stream:</strong> {app.stream}</span>
              </div>
              <div className="detail-item">
                <span><strong>Difficulty:</strong> {app.difficulty}</span>
              </div>
              <div className="detail-item">
                <span><strong>Applied:</strong> {new Date(app.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="application-actions">
              <button
                className="btn-accept"
                onClick={() => handleDecision(app._id, 'accepted')}
                disabled={processingId === app._id}
              >
                <CheckCircle size={18} />
                Accept
              </button>
              <button
                className="btn-reject"
                onClick={() => handleDecision(app._id, 'rejected')}
                disabled={processingId === app._id}
              >
                <XCircle size={18} />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
