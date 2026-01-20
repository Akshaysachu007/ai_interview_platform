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
    if (!confirm(`Are you sure you want to delete this ${interviewStream} interview?`)) {
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
        throw new Error(data.message || 'Failed to delete interview');
      }

      alert('Interview deleted successfully!');
      fetchInterviews(); // Refresh the list
    } catch (err) {
      console.error('Error deleting interview:', err);
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status, applicationStatus) => {
    if (applicationStatus === 'open') {
      return { text: 'Open', color: 'blue', icon: Clock };
    } else if (applicationStatus === 'pending') {
      return { text: 'Pending Review', color: 'orange', icon: Clock };
    } else if (applicationStatus === 'accepted') {
      return { text: 'Accepted', color: 'green', icon: CheckCircle };
    } else if (status === 'completed') {
      return { text: 'Completed', color: 'gray', icon: CheckCircle };
    }
    return { text: status, color: 'gray', icon: null };
  };

  if (loading) {
    return <div className="loading">Loading interviews...</div>;
  }

  if (interviews.length === 0) {
    return (
      <div className="no-interviews">
        <BookOpen size={48} />
        <h3>No Interviews Created</h3>
        <p>Click "Create Interview" to post your first interview opportunity.</p>
      </div>
    );
  }

  return (
    <div className="recruiter-interviews">
      <h2>My Interviews ({interviews.length})</h2>
      
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
                  title={interview.status === 'in-progress' ? 'Cannot delete in-progress interview' : 'Delete interview'}
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
