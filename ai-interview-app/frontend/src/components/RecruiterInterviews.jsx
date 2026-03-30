import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, User, BookOpen, Award, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import './RecruiterInterviews.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function RecruiterInterviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('recruiterToken');
      const response = await fetch(`${API_URL}/recruiter/my-interviews`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch interviews');

      const data = await response.json();
      setInterviews(data);
    } catch (err) {
      console.error('Error fetching interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (interviewId, interviewStream) => {
    if (!confirm(`Are you sure you want to delete this ${interviewStream} job?`)) {
      return;
    }

    setDeletingId(interviewId);
    try {
      const token = localStorage.getItem('recruiterToken');
      const response = await fetch(`${API_URL}/recruiter/interview/${interviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete job');
      }

      alert('Job deleted successfully!');
      fetchInterviews(); // Refresh the list
    } catch (err) {
      console.error('Error deleting interview:', err);
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status, applicationStatus) => {
    // Check interview completion status first
    if (status === 'completed') {
      return { text: 'Completed', color: 'green', icon: CheckCircle };
    } else if (status === 'in-progress') {
      return { text: 'In Progress', color: 'blue', icon: Clock };
    } else if (applicationStatus === 'open') {
      return { text: 'Open', color: 'blue', icon: Clock };
    } else if (applicationStatus === 'pending') {
      return { text: 'Pending Review', color: 'orange', icon: Clock };
    } else if (applicationStatus === 'accepted') {
      return { text: 'Accepted', color: 'green', icon: CheckCircle };
    } else if (applicationStatus === 'rejected') {
      return { text: 'Rejected', color: 'red', icon: XCircle };
    }
    return { text: status || applicationStatus, color: 'gray', icon: null };
  };

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  if (interviews.length === 0) {
    return (
      <div className="no-interviews">
        <BookOpen size={48} />
        <h3>No Jobs Created</h3>
        <p>Click "Create Job" to post your first job opportunity.</p>
      </div>
    );
  }

  return (
    <div className="recruiter-interviews">
      <h2>My Jobs ({interviews.length})</h2>
      
      <div className="interviews-grid">
        {interviews.map((interview) => {
          const badge = getStatusBadge(interview.status, interview.applicationStatus);
          const Icon = badge.icon;
          
          return (
            <div key={interview._id} className="interview-card">
              <div className="card-header">
                <div className="interview-info">
                  <BookOpen size={20} />
                  <div>
                    <h3>{interview.stream}</h3>
                    <p className="difficulty">{interview.difficulty} Level</p>
                  </div>
                </div>
                <span className={`status-badge ${badge.color}`}>
                  {Icon && <Icon size={14} />}
                  {badge.text}
                </span>
              </div>

              {interview.candidateId && (
                <div className="candidate-section">
                  <div className="candidate-info">
                    <User size={16} />
                    <div>
                      <p className="candidate-name">{interview.candidateId.name}</p>
                      <p className="candidate-email">{interview.candidateId.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="card-details">
                <div className="detail-item">
                  <Clock size={14} />
                  <span>Created: {new Date(interview.createdAt).toLocaleDateString()}</span>
                </div>
                {interview.startTime && (
                  <div className="detail-item">
                    <CheckCircle size={14} />
                    <span>Started: {new Date(interview.startTime).toLocaleString()}</span>
                  </div>
                )}
                {interview.status === 'completed' && interview.completedAt && (
                  <div className="detail-item">
                    <CheckCircle size={14} />
                    <span>Completed: {new Date(interview.completedAt).toLocaleString()}</span>
                  </div>
                )}
                {interview.status === 'completed' && interview.score !== undefined && interview.score !== null && (
                  <div className="detail-item">
                    <Award size={14} />
                    <span style={{ fontWeight: 'bold', color: interview.score >= 70 ? '#27ae60' : interview.score >= 50 ? '#f39c12' : '#e74c3c' }}>
                      Score: {interview.score}/100
                    </span>
                  </div>
                )}
                {interview.status === 'completed' && interview.recommendation && (
                  <div className="detail-item">
                    <Award size={14} />
                    <span style={{ 
                      fontWeight: 'bold',
                      color: interview.recommendation === 'Strong Hire' ? '#10b981' : 
                             interview.recommendation === 'Hire' ? '#22c55e' : 
                             interview.recommendation === 'Maybe' ? '#f59e0b' : '#ef4444'
                    }}>
                      {interview.recommendation}
                    </span>
                  </div>
                )}
                {interview.flagged && (
                  <div className="detail-item" style={{ color: '#e74c3c' }}>
                    <XCircle size={14} />
                    <span style={{ fontWeight: 'bold' }}>⚠️ Flagged</span>
                  </div>
                )}
              </div>

              <div className="card-actions">
                {interview.status === 'completed' && (
                  <button
                    className="btn-view-report"
                    onClick={() => navigate(`/interview/${interview._id}/report`)}
                  >
                    <FileText size={16} />
                    View Report
                  </button>
                )}
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(interview._id, interview.stream)}
                  disabled={deletingId === interview._id || interview.status === 'in-progress'}
                  title={interview.status === 'in-progress' ? 'Cannot delete in-progress job' : 'Delete job'}
                >
                  <Trash2 size={16} />
                  {deletingId === interview._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
