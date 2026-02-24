import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, BookOpen, Target, TrendingUp, Award } from 'lucide-react';
import ATSScoreModal from './ATSScoreModal';
import './ApplicationManagement.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function ApplicationManagement() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null); // For modal
  const [expandedApp, setExpandedApp] = useState(null); // For showing ATS details

  const getATSScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // orange
    if (score >= 40) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  const getATSRecommendationBadge = (recommendation) => {
    const colors = {
      'Highly Recommended': '#10b981',
      'Recommended': '#3b82f6',
      'Consider': '#f59e0b',
      'Not Recommended': '#ef4444'
    };
    return colors[recommendation] || '#6b7280';
  };

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
      setSelectedApplication(null); // Close modal
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
    <>
      {/* ATS Score Modal */}
      {selectedApplication && (
        <ATSScoreModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onAccept={(id) => handleDecision(id, 'accepted')}
          onReject={(id) => handleDecision(id, 'rejected')}
          isProcessing={processingId !== null}
        />
      )}

      <div className="application-management">
      <h2>Pending Applications ({applications.length})</h2>
      
      <div className="applications-list">
        {applications.map((app) => {
          const atsData = app.applicationScores && app.applicationScores.length > 0 
            ? app.applicationScores[app.applicationScores.length - 1] 
            : null;
          const isExpanded = expandedApp === app._id;
          
          return (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {app.atsScore !== null && app.atsScore !== undefined && (
                    <div
                      onClick={() => setSelectedApplication(app)}
                      style={{
                        background: getATSScoreColor(app.atsScore),
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        transform: 'scale(1)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title="Click to view detailed ATS analysis"
                    >
                      <Target size={16} />
                      ATS: {app.atsScore}%
                    </div>
                  )}
                  <span className="status-badge pending">
                    <Clock size={14} />
                    Pending
                  </span>
                </div>
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
                {app.title && (
                  <div className="detail-item">
                    <span><strong>Position:</strong> {app.title}</span>
                  </div>
                )}
              </div>

              {/* ATS Score Details - View Modal Button */}
              {atsData && (
                <div style={{ marginTop: '15px' }}>
                  <button
                    onClick={() => setSelectedApplication(app)}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      width: '100%',
                      fontWeight: '600',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <Target size={18} />
                    📊 View Detailed ATS Analysis
                  </button>
                </div>
              )}

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
          );
        })}
      </div>
    </div>
    </>
  );
}
