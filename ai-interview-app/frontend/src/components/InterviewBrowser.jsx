import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Award, User, Clock, CheckCircle, Trash2, RefreshCw, FileText, Briefcase, Star, Camera } from 'lucide-react';
import ApplicationPhotoCapture from './ApplicationPhotoCapture';
import './InterviewBrowser.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function InterviewBrowser() {
  const [interviews, setInterviews] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [selectedStream, setSelectedStream] = useState('All');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [view, setView] = useState('available'); // 'available' or 'myApplications'
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [selectedInterview, setSelectedInterview] = useState(null); // For showing job details modal
  const [photoCaptureForId, setPhotoCaptureForId] = useState(null); // For photo capture before apply

  const streams = [
    'All',
    'Computer Science',
    'Information Technology',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Business Management',
    'Marketing',
    'Finance',
    'Data Science',
    'AI/ML'
  ];

  useEffect(() => {
    if (view === 'available') {
      fetchAvailableInterviews();
    } else {
      fetchMyApplications();
    }
  }, [selectedStream, view]);

  // Auto-refresh available interviews every 30 seconds
  useEffect(() => {
    if (view === 'available') {
      const intervalId = setInterval(() => {
        fetchAvailableInterviews();
        setLastRefresh(Date.now());
      }, 30000); // 30 seconds

      return () => clearInterval(intervalId);
    }
  }, [view, selectedStream]);

  const fetchAvailableInterviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('candidateToken');
      const streamParam = selectedStream !== 'All' ? `?stream=${encodeURIComponent(selectedStream)}` : '';
      const response = await fetch(`${API_URL}/candidate/interviews/available${streamParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch interviews');

      const data = await response.json();
      setInterviews(data);
      setLastRefresh(Date.now());
    } catch (err) {
      console.error('Error fetching interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('candidateToken');
      const response = await fetch(`${API_URL}/candidate/my-applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch applications');

      const data = await response.json();
      setMyApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (interviewId, candidatePhoto = null) => {
    setApplying(interviewId);
    setPhotoCaptureForId(null); // Close photo capture modal
    try {
      const token = localStorage.getItem('candidateToken');
      const response = await fetch(`${API_URL}/candidate/interviews/${interviewId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ candidatePhoto })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to apply');
      }

      let message = 'Application submitted successfully! The recruiter will review your application.';
      message += '\n\n💡 Tip: Make sure your resume is up to date for the best results!';
      
      alert(message);
      fetchAvailableInterviews(); // Refresh the list
    } catch (err) {
      console.error('Error applying for interview:', err);
      alert(err.message);
    } finally {
      setApplying(null);
    }
  };

  const handleDelete = async (interviewId, stream) => {
    const action = myApplications.find(app => app._id === interviewId)?.applicationStatus === 'pending' || 
                   myApplications.find(app => app._id === interviewId)?.applicationStatus === 'accepted'
      ? 'withdraw this application'
      : 'delete this job';
    
    if (!confirm(`Are you sure you want to ${action} for ${stream}?`)) {
      return;
    }

    setDeletingId(interviewId);
    try {
      const token = localStorage.getItem('candidateToken');
      const response = await fetch(`${API_URL}/candidate/interviews/${interviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Server returned non-JSON response');
        throw new Error('Server error: Backend may not be running or route not found. Please check if the backend server is running.');
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete');
      }

      const data = await response.json();
      alert(data.message);
      if (view === 'myApplications') {
        fetchMyApplications();
      }
    } catch (err) {
      console.error('Error deleting:', err);
      alert('❌ ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleManualRefresh = () => {
    if (view === 'available') {
      fetchAvailableInterviews();
    } else {
      fetchMyApplications();
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'green';
      case 'Medium': return 'orange';
      case 'Hard': return 'red';
      default: return 'gray';
    }
  };

  const getStatusBadge = (applicationStatus, interviewStatus) => {
    // Show completion status first
    if (interviewStatus === 'completed') {
      return (
        <span className="status-badge green">
          <CheckCircle size={14} />
          Completed
        </span>
      );
    }
    if (interviewStatus === 'in-progress') {
      return (
        <span className="status-badge blue">
          <Clock size={14} />
          In Progress
        </span>
      );
    }
    const badges = {
      pending: { text: 'Pending Review', color: 'orange', icon: Clock },
      accepted: { text: 'Accepted', color: 'green', icon: CheckCircle },
      rejected: { text: 'Rejected', color: 'red', icon: null }
    };
    const badge = badges[applicationStatus] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`status-badge ${badge.color}`}>
        {Icon && <Icon size={14} />}
        {badge.text}
      </span>
    );
  };

  return (
    <div className="interview-browser">
      <div className="browser-header">
        <h2>Job Opportunities</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="refresh-btn"
            onClick={handleManualRefresh}
            disabled={loading}
            title="Refresh jobs"
            style={{
              background: 'transparent',
              border: '2px solid #667eea',
              color: '#667eea',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.9em',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1
            }}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <div className="view-toggle">
            <button
              className={view === 'available' ? 'active' : ''}
              onClick={() => setView('available')}
            >
              Available Jobs
            </button>
            <button
              className={view === 'myApplications' ? 'active' : ''}
              onClick={() => setView('myApplications')}
            >
              My Applications
            </button>
          </div>
        </div>
      </div>

      {view === 'available' && (
        <>
          <div className="filter-section">
            <div className="stream-filters">
              {streams.map(stream => (
                <button
                  key={stream}
                  className={`stream-btn ${selectedStream === stream ? 'active' : ''}`}
                  onClick={() => setSelectedStream(stream)}
                >
                  {stream}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading jobs...</div>
          ) : interviews.length === 0 ? (
            <div className="no-interviews">
              <BookOpen size={48} />
              <h3>No Jobs Available</h3>
              <p>Check back later for new opportunities in {selectedStream}.</p>
            </div>
          ) : (
            <div className="interviews-grid">
              {interviews.map((interview) => (
                <div key={interview._id} className="interview-card">
                  <div className="card-header">
                    <div className="recruiter-info">
                      <div className="recruiter-avatar">
                        <User size={20} />
                      </div>
                      <div>
                        <h3>{interview.recruiterId?.name || 'Recruiter'}</h3>
                        <p>{interview.recruiterId?.company || interview.recruiterId?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-body">
                    {interview.title && (
                      <div className="job-title">
                        <Briefcase size={16} />
                        <strong>{interview.title}</strong>
                      </div>
                    )}
                    
                    <div className="interview-details">
                      <div className="detail-row">
                        <BookOpen size={18} />
                        <span><strong>Stream:</strong> <span className="stream-tag">{interview.stream}</span></span>
                      </div>
                      <div className="detail-row">
                        <Award size={18} />
                        <span><strong>Difficulty:</strong> <span className={`difficulty-badge ${getDifficultyColor(interview.difficulty)}`}>
                          {interview.difficulty}
                        </span></span>
                      </div>
                      {interview.timeLimit && (
                        <div className="detail-row">
                          <Clock size={18} />
                          <span><strong>Duration:</strong> {interview.timeLimit} minutes</span>
                        </div>
                      )}
                      {interview.numberOfQuestions && (
                        <div className="detail-row">
                          <FileText size={18} />
                          <span><strong>Questions:</strong> {interview.numberOfQuestions}</span>
                        </div>
                      )}
                    </div>
                    
                    {interview.jobDescription && (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        borderLeft: '3px solid #667eea'
                      }}>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.85rem', 
                          color: '#555',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.5'
                        }}>
                          {interview.jobDescription}
                        </p>
                        <button 
                          onClick={() => setSelectedInterview(interview)}
                          style={{
                            color: '#667eea',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '4px 0',
                            marginTop: '4px',
                            fontWeight: '600'
                          }}
                        >
                          Read full description →
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="card-footer">
                    <button
                      className="apply-btn"
                      onClick={() => setPhotoCaptureForId(interview._id)}
                      disabled={applying === interview._id}
                    >
                      <Camera size={16} style={{ marginRight: '6px' }} />
                      {applying === interview._id ? 'Applying...' : 'Apply with Photo'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'myApplications' && (
        <>
          {loading ? (
            <div className="loading">Loading applications...</div>
          ) : myApplications.length === 0 ? (
            <div className="no-interviews">
              <Clock size={48} />
              <h3>No Applications Yet</h3>
              <p>Browse available jobs and apply to get started.</p>
            </div>
          ) : (
            <div className="interviews-grid">
              {myApplications.map((app) => (
                <div key={app._id} className="interview-card">
                  <div className="card-header">
                    <div className="recruiter-info">
                      <div className="recruiter-avatar">
                        <User size={20} />
                      </div>
                      <div>
                        <h3>{app.recruiterId?.name || 'Recruiter'}</h3>
                        <p>{app.recruiterId?.company || app.recruiterId?.email}</p>
                      </div>
                    </div>
                    {getStatusBadge(app.applicationStatus, app.status)}
                  </div>

                  <div className="card-body">
                    <div className="interview-details">
                      <div className="detail-row">
                        <BookOpen size={18} />
                        <span className="stream-tag">{app.stream}</span>
                      </div>
                      <div className="detail-row">
                        <Award size={18} />
                        <span className={`difficulty-badge ${getDifficultyColor(app.difficulty)}`}>
                          {app.difficulty}
                        </span>
                      </div>
                      <div className="detail-row">
                        <Clock size={18} />
                        <span className="applied-date">
                          Applied: {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {app.status === 'completed' && app.score !== undefined && app.score !== null && (
                        <div className="detail-row">
                          <Award size={18} />
                          <span style={{ fontWeight: 'bold', color: app.score >= 70 ? '#27ae60' : app.score >= 50 ? '#f39c12' : '#e74c3c' }}>
                            Score: {app.score}/100
                          </span>
                        </div>
                      )}
                      {app.status === 'completed' && (
                        <div className="detail-row">
                          <CheckCircle size={18} />
                          <span style={{ color: '#27ae60', fontWeight: '500' }}>
                            ✅ Completed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {app.applicationStatus === 'accepted' && app.status !== 'completed' && (
                    <div className="card-footer">
                      <button
                        className="start-btn"
                        onClick={() => window.location.href = `/candidate/interview?id=${app._id}`}
                      >
                        Start Assessment
                      </button>
                      <button
                        className="delete-btn-small"
                        onClick={() => handleDelete(app._id, app.stream)}
                        disabled={deletingId === app._id}
                        title="Withdraw application"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  {(app.applicationStatus === 'pending' || (app.applicationStatus === 'accepted' && app.status === 'completed') || app.status === 'completed') && (
                    <div className="card-footer">
                      {app.status === 'completed' && (
                        <button
                          className="start-btn"
                          onClick={() => window.location.href = `/interview/${app._id}/report`}
                          style={{ background: '#3b82f6' }}
                        >
                          📊 View Report
                        </button>
                      )}
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(app._id, app.stream)}
                        disabled={deletingId === app._id || app.status === 'in-progress'}
                        title={app.status === 'in-progress' ? 'Cannot delete in-progress job' : app.applicationStatus === 'pending' ? 'Withdraw application' : 'Delete job'}
                      >
                        <Trash2 size={16} />
                        {deletingId === app._id ? 'Processing...' : app.applicationStatus === 'pending' ? 'Withdraw' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Job Description Modal */}
      {selectedInterview && (
        <div className="modal-overlay" onClick={() => setSelectedInterview(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '700px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <div className="modal-header">
              <h2>{selectedInterview.title || 'Job Details'}</h2>
              <button 
                className="close-btn" 
                onClick={() => setSelectedInterview(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              {selectedInterview.company && (
                <div style={{ marginBottom: '15px' , color: '#000000'}}>
                  <strong>Company:</strong> {selectedInterview.company}
                </div>
              )}
              
              <div style={{ marginBottom: '15px' , color: '#000000'}}>
                <strong>Stream:</strong> {selectedInterview.stream}
              </div>
              
              <div style={{ marginBottom: '15px' , color: '#000000'}}>
                <strong>Difficulty:</strong> <span className={`difficulty-badge ${getDifficultyColor(selectedInterview.difficulty)}`}>
                  {selectedInterview.difficulty}
                </span>
              </div>
              
              {selectedInterview.requiredSkills && selectedInterview.requiredSkills.length > 0 && (
                <div style={{ marginBottom: '15px' , color: '#000000'}}>
                  <strong>Required Skills:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {selectedInterview.requiredSkills.map((skill, idx) => (
                      <span key={idx} style={{
                        background: '#667eea',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.85rem'
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedInterview.preferredSkills && selectedInterview.preferredSkills.length > 0 && (
                <div style={{ marginBottom: '15px' , color: '#000000'}}>
                  <strong>Preferred Skills:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {selectedInterview.preferredSkills.map((skill, idx) => (
                      <span key={idx} style={{
                        color: '#000000',
                        background: '#e0e0e0',
    
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.85rem'
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedInterview.jobDescription && (
                <div style={{ marginTop: '20px' }}>
                  <strong>Job Description:</strong>
                  <div style={{
                    color :'black',
                    marginTop: '10px',
                    padding: '15px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6'
                  }}>
                    {selectedInterview.jobDescription}
                  </div>
                </div>
              )}
              
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  className="apply-btn"
                  onClick={() => {
                    const id = selectedInterview._id;
                    setSelectedInterview(null);
                    setPhotoCaptureForId(id);
                  }}
                  disabled={applying === selectedInterview._id}
                  style={{ flex: 1 }}
                >
                  <Camera size={16} style={{ marginRight: '6px' }} />
                  {applying === selectedInterview._id ? 'Applying...' : 'Apply with Photo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Capture Modal for Application */}
      {photoCaptureForId && (
        <div className="modal-overlay" onClick={() => setPhotoCaptureForId(null)}>
          <div className="modal-content photo-capture-modal" onClick={e => e.stopPropagation()}>
            <ApplicationPhotoCapture
              interviewId={photoCaptureForId}
              onPhotoCapture={(photo) => handleApply(photoCaptureForId, photo)}
              onCancel={() => setPhotoCaptureForId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
