import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LiveInterviewMonitor.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LiveInterviewMonitor = () => {
  const [liveInterviews, setLiveInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [interviewDetails, setInterviewDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('recruiterToken')}`
    }
  });

  // Fetch list of live interviews
  const fetchLiveInterviews = async () => {
    try {
      console.log('🔍 Fetching live interviews...');
      const response = await api.get('/recruiter/live-interviews');
      console.log('✅ Live interviews response:', response.data);
      setLiveInterviews(response.data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching live interviews:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to fetch live interviews');
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed interview data
  const fetchInterviewDetails = async (interviewId) => {
    try {
      const response = await api.get(`/recruiter/live-interview/${interviewId}`);
      setInterviewDetails(response.data);
    } catch (err) {
      console.error('Error fetching interview details:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLiveInterviews();
  }, []);

  // Auto-refresh every 3 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveInterviews();
      if (selectedInterview) {
        fetchInterviewDetails(selectedInterview);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedInterview]);

  // When an interview is selected, fetch its details
  useEffect(() => {
    if (selectedInterview) {
      fetchInterviewDetails(selectedInterview);
    }
  }, [selectedInterview]);

  const handleSelectInterview = (interviewId) => {
    setSelectedInterview(interviewId);
  };

  const handleBackToList = () => {
    setSelectedInterview(null);
    setInterviewDetails(null);
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just started';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="live-monitor-loading">
        <div className="spinner"></div>
        <p>Loading live interviews...</p>
      </div>
    );
  }

  // List view - showing all live interviews
  if (!selectedInterview) {
    return (
      <div className="live-interview-monitor">
        <div className="monitor-header">
          <div className="header-content">
            <h2>🔴 Live Interviews</h2>
            <div className="live-badge">
              <span className="pulse-dot"></span>
              <span>{liveInterviews.length} Active</span>
            </div>
          </div>
          <p className="header-subtitle">Monitor ongoing candidate interviews in real-time</p>
        </div>

        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        {liveInterviews.length === 0 ? (
          <div className="no-interviews">
            <div className="no-interviews-icon">📹</div>
            <h3>No Live Interviews</h3>
            <p>There are currently no ongoing interviews. Check back when candidates start their interviews.</p>
          </div>
        ) : (
          <div className="interviews-grid">
            {liveInterviews.map((interview) => (
              <div key={interview._id} className="interview-card">
                <div className="card-header">
                  <div className="candidate-info">
                    <div className="candidate-avatar">
                      {interview.candidateId?.name?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div>
                      <h3>{interview.candidateId?.name || 'Unknown Candidate'}</h3>
                      <p className="candidate-email">{interview.candidateId?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className={`status-badge ${interview.flagged ? 'flagged' : 'active'}`}>
                    {interview.flagged ? '🚩 Flagged' : '✓ Active'}
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Stream:</span>
                    <span className="value">{interview.stream}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Difficulty:</span>
                    <span className="value">{interview.difficulty}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Started:</span>
                    <span className="value">{formatTime(interview.startedAt)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Progress:</span>
                    <span className="value">
                      {interview.currentQuestionIndex + 1} / {interview.questions?.length || 0}
                    </span>
                  </div>
                </div>

                <div className="card-footer">
                  <button 
                    className="btn-monitor"
                    onClick={() => handleSelectInterview(interview._id)}
                  >
                    <span>👁️</span> Monitor Live
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Detail view - showing selected interview
  if (interviewDetails) {
    const recentMalpractices = interviewDetails.malpractices
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    return (
      <div className="interview-detail-view">
        <div className="detail-header">
          <button className="btn-back" onClick={handleBackToList}>
            ← Back to List
          </button>
          <div className="detail-title">
            <h2>Live Interview Monitoring</h2>
            <div className="live-indicator">
              <span className="pulse-dot"></span>
              <span>LIVE</span>
            </div>
          </div>
        </div>

        <div className="detail-content">
          {/* Webcam Feed Section */}
          <div className="detail-section webcam-section">
            <h3>📹 Live Webcam Feed</h3>
            <div className="webcam-feed-container">
              {interviewDetails.currentWebcamSnapshot ? (
                <>
                  <img 
                    src={interviewDetails.currentWebcamSnapshot} 
                    alt="Candidate Webcam" 
                    className="webcam-feed-image"
                  />
                  <div className={`face-status-overlay ${interviewDetails.currentFaceCount === 1 ? 'good' : 'warning'}`}>
                    {interviewDetails.currentFaceCount === 1 ? (
                      <>✓ Face Detected</>
                    ) : interviewDetails.currentFaceCount === 0 ? (
                      <>⚠️ No Face</>
                    ) : (
                      <>⚠️ Multiple Faces</>
                    )}
                  </div>
                  <div className="snapshot-time">
                    Last updated: {interviewDetails.lastSnapshotUpdate ? 
                      new Date(interviewDetails.lastSnapshotUpdate).toLocaleTimeString() : 'N/A'}
                  </div>
                </>
              ) : (
                <div className="no-webcam">
                  <span>📷</span>
                  <p>Waiting for webcam feed...</p>
                </div>
              )}
            </div>
          </div>

          {/* Candidate Info Section */}
          <div className="detail-section candidate-section">
            <h3>Candidate Information</h3>
            <div className="candidate-details">
              <div className="candidate-avatar-large">
                {interviewDetails.candidate?.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div className="candidate-info-text">
                <h4>{interviewDetails.candidate?.name || 'Unknown'}</h4>
                <p>{interviewDetails.candidate?.email || 'N/A'}</p>
                <div className="interview-meta">
                  <span>📚 {interviewDetails.stream}</span>
                  <span>⚡ {interviewDetails.difficulty}</span>
                  <span>🕒 {formatTime(interviewDetails.startedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interview Progress */}
          <div className="detail-section progress-section">
            <h3>Interview Progress</h3>
            <div className="progress-info">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${((interviewDetails.currentQuestionIndex + 1) / (interviewDetails.questions?.length || 1)) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="progress-text">
                Question {interviewDetails.currentQuestionIndex + 1} of {interviewDetails.questions?.length || 0}
              </div>
            </div>

            {/* Current Question */}
            {interviewDetails.questions && interviewDetails.questions[interviewDetails.currentQuestionIndex] && (
              <div className="current-question">
                <h4>Current Question:</h4>
                <p>{interviewDetails.questions[interviewDetails.currentQuestionIndex].question}</p>
              </div>
            )}

            {/* All Questions & Answers */}
            <div className="qa-section">
              <h4>Questions & Answers</h4>
              {interviewDetails.questions && interviewDetails.questions.length > 0 ? (
                <div className="qa-list">
                  {interviewDetails.questions.map((q, index) => (
                    <div 
                      key={index} 
                      className={`qa-item ${index === interviewDetails.currentQuestionIndex ? 'current' : ''} ${q.answer ? 'answered' : ''}`}
                    >
                      <div className="qa-header">
                        <span className="qa-number">Q{index + 1}</span>
                        <span className={`qa-status ${q.answer ? 'answered' : index === interviewDetails.currentQuestionIndex ? 'active' : 'pending'}`}>
                          {q.answer ? '✓ Answered' : index === interviewDetails.currentQuestionIndex ? '⏳ Active' : '⏸️ Pending'}
                        </span>
                      </div>
                      <div className="qa-question">{q.question}</div>
                      {q.answer && (
                        <div className="qa-answer">
                          <strong>Answer:</strong>
                          <p>{q.answer}</p>
                          {q.aiConfidence && (
                            <span className={`ai-confidence ${q.aiConfidence > 70 ? 'warning' : 'good'}`}>
                              AI Detection: {q.aiConfidence}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-qa">No questions available</p>
              )}
            </div>
          </div>

          {/* Malpractice Monitor */}
          <div className="detail-section malpractice-section">
            <h3>🚨 Proctoring Analytics</h3>
            <div className="malpractice-stats">
              <div className="stat-card">
                <div className="stat-icon">🔄</div>
                <div className="stat-content">
                  <span className={`stat-value ${interviewDetails.tabSwitchCount > 2 ? 'warning' : ''}`}>
                    {interviewDetails.tabSwitchCount || interviewDetails.tabSwitches}
                  </span>
                  <span className="stat-label">Tab Switches</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👤</div>
                <div className="stat-content">
                  <span className={`stat-value ${interviewDetails.faceViolations > 3 ? 'warning' : ''}`}>
                    {interviewDetails.faceViolations}
                  </span>
                  <span className="stat-label">Face Violations</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🤖</div>
                <div className="stat-content">
                  <span className={`stat-value ${interviewDetails.aiDetections > 0 ? 'warning' : ''}`}>
                    {interviewDetails.aiDetections}
                  </span>
                  <span className="stat-label">AI Detections</span>
                </div>
              </div>
              <div className="stat-card">
                <div className={`stat-icon ${interviewDetails.flagged ? 'flagged' : ''}`}>
                  {interviewDetails.flagged ? '🚩' : '✅'}
                </div>
                <div className="stat-content">
                  <span className={`stat-value ${interviewDetails.flagged ? 'warning' : ''}`}>
                    {interviewDetails.flagged ? 'Yes' : 'No'}
                  </span>
                  <span className="stat-label">Flagged</span>
                </div>
              </div>
            </div>

            {/* Recent Violations */}
            <div className="violations-log">
              <h4>Recent Activity</h4>
              {recentMalpractices.length === 0 ? (
                <p className="no-violations">✅ No violations detected</p>
              ) : (
                <div className="violations-list">
                  {recentMalpractices.map((mal, index) => (
                    <div key={index} className={`violation-item ${mal.severity}`}>
                      <div className="violation-icon">
                        {mal.type === 'tab-switch' && '🔄'}
                        {mal.type === 'no-face' && '👤'}
                        {mal.type === 'multiple-faces' && '👥'}
                        {mal.type === 'ai-answer' && '🤖'}
                      </div>
                      <div className="violation-details">
                        <span className="violation-type">
                          {mal.type.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className="violation-time">
                          {new Date(mal.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className={`severity-badge ${mal.severity}`}>
                        {mal.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-monitor-loading">
      <div className="spinner"></div>
      <p>Loading interview details...</p>
    </div>
  );
};

export default LiveInterviewMonitor;
