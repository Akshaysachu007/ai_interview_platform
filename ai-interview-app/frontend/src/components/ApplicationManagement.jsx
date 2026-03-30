import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, BookOpen, Camera, Target, ChevronDown, ChevronUp, TrendingUp, AlertTriangle } from 'lucide-react';
import './ApplicationManagement.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function ApplicationManagement() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);
  const [expandedATS, setExpandedATS] = useState(null); // For photo enlargement modal

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
        <p>You'll see candidate applications here when they apply for your jobs.</p>
      </div>
    );
  }

  return (
    <>
      <div className="application-management">
      <h2>Pending Applications ({applications.length})</h2>
      
      <div className="applications-list">
        {applications.map((app) => {
          return (
            <div key={app._id} className="application-card">
              <div className="application-header">
                <div className="candidate-info">
                  <div 
                    className="candidate-avatar"
                    onClick={() => app.candidateApplicationPhoto && setEnlargedPhoto(app.candidateApplicationPhoto)}
                    style={app.candidateApplicationPhoto ? { cursor: 'pointer', padding: 0, overflow: 'hidden' } : {}}
                    title={app.candidateApplicationPhoto ? 'Click to enlarge photo' : 'No photo submitted'}
                  >
                    {app.candidateApplicationPhoto ? (
                      <img 
                        src={app.candidateApplicationPhoto} 
                        alt={app.candidateId?.name || 'Candidate'} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div>
                    <h3>{app.candidateId?.name || 'Unknown'}</h3>
                    <p>{app.candidateId?.email || 'No email'}</p>
                    {app.candidateApplicationPhoto && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: '#10b981', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        marginTop: '4px'
                      }}>
                        <Camera size={12} /> Photo verified
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {app.atsScore != null && (
                    <div style={{
                      background: app.atsScore >= 80 ? '#10b981' : app.atsScore >= 60 ? '#f59e0b' : app.atsScore >= 40 ? '#ef4444' : '#6b7280',
                      color: 'white',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      fontSize: '0.85em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Target size={14} />
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

              {/* ATS Score Detailed Breakdown */}
              {(() => {
                const atsData = app.applicationScores && app.applicationScores.length > 0 
                  ? app.applicationScores[app.applicationScores.length - 1] 
                  : null;
                const isExpanded = expandedATS === app._id;
                
                if (!atsData && app.atsScore == null) return null;
                
                const breakdown = atsData?.breakdown || {};
                const scoreClr = (s) => s >= 80 ? '#27ae60' : s >= 60 ? '#f39c12' : s >= 40 ? '#e67e22' : '#e74c3c';
                const scoreBand = (s) => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Average' : 'Poor';
                const recColors = {
                  'Highly Recommended': { bg: '#d4edda', color: '#155724' },
                  'Recommended': { bg: '#cce5ff', color: '#004085' },
                  'Consider': { bg: '#fff3cd', color: '#856404' },
                  'Not Recommended': { bg: '#f8d7da', color: '#721c24' }
                };
                const recStyle = recColors[atsData?.recommendation] || { bg: '#e9ecef', color: '#495057' };
                
                return (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      onClick={() => setExpandedATS(isExpanded ? null : app._id)}
                      style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%',
                        fontWeight: 600,
                        fontSize: '0.9em',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Target size={16} />
                      {isExpanded ? 'Hide' : 'View'} Detailed ATS Score Analysis
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {isExpanded && (
                      <div style={{ marginTop: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                        {/* Overall Score Header */}
                        <div style={{ 
                          background: 'linear-gradient(135deg, #f8f9ff, #eef2ff)', 
                          padding: '16px 20px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderBottom: '1px solid #e2e8f0'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.8em', color: '#666', marginBottom: '4px' }}>Overall ATS Score</div>
                            <div style={{ fontSize: '2em', fontWeight: 700, color: scoreClr(app.atsScore || atsData?.score || 0) }}>
                              {app.atsScore || atsData?.score || 0}<span style={{ fontSize: '0.5em', color: '#999' }}>/100</span>
                            </div>
                            <div style={{ fontSize: '0.8em', color: '#888' }}>{scoreBand(app.atsScore || atsData?.score || 0)}</div>
                          </div>
                          {atsData?.recommendation && (
                            <div style={{
                              background: recStyle.bg, color: recStyle.color,
                              padding: '8px 16px', borderRadius: '20px', fontWeight: 600, fontSize: '0.85em'
                            }}>
                              {atsData.recommendation}
                            </div>
                          )}
                        </div>

                        {/* Score Breakdown Table */}
                        <div style={{ padding: '16px 20px' }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '0.95em' }}>📐 How ATS Score Was Calculated</h4>
                          <p style={{ margin: '0 0 12px', fontSize: '0.8em', color: '#888' }}>
                            The ATS score is computed by matching the candidate's resume against the job description across 4 dimensions.
                          </p>
                          
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
                            <thead>
                              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Evaluation Factor</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#555' }}>Weight</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#555' }}>Raw Score</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#555' }}>Contribution</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { 
                                  factor: 'Keyword Match', 
                                  weight: '40%', 
                                  raw: breakdown.keywordMatch || 0, 
                                  weightNum: 0.4,
                                  desc: 'Percentage of required skills, technologies, and keywords from the job description found in the resume',
                                  criteria: (s) => s >= 80 ? 'Most required keywords matched' : s >= 60 ? 'Good keyword coverage with some gaps' : s >= 40 ? 'Partial keyword match — missing several key terms' : 'Low keyword match — resume may not align with role'
                                },
                                { 
                                  factor: 'Experience Relevance', 
                                  weight: '30%', 
                                  raw: breakdown.experienceRelevance || 0, 
                                  weightNum: 0.3,
                                  desc: 'How well the candidate\'s years and type of experience match the job requirements',
                                  criteria: (s) => s >= 80 ? 'Experience strongly aligns with requirements' : s >= 60 ? 'Relevant experience with minor gaps' : s >= 40 ? 'Some relevant experience but insufficient depth' : 'Experience does not match role requirements'
                                },
                                { 
                                  factor: 'Educational Alignment', 
                                  weight: '15%', 
                                  raw: breakdown.educationalAlignment || 0, 
                                  weightNum: 0.15,
                                  desc: 'Alignment of educational qualifications, certifications, and degrees with the position requirements',
                                  criteria: (s) => s >= 80 ? 'Education strongly matches the requirement' : s >= 60 ? 'Education is generally relevant' : s >= 40 ? 'Partial educational alignment' : 'Education does not match requirements'
                                },
                                { 
                                  factor: 'Overall Fit', 
                                  weight: '15%', 
                                  raw: breakdown.overallFit || 0, 
                                  weightNum: 0.15,
                                  desc: 'General resume quality, structure, and holistic fit for the role based on contextual analysis',
                                  criteria: (s) => s >= 80 ? 'Strong overall fit for the position' : s >= 60 ? 'Good fit with minor concerns' : s >= 40 ? 'Average fit — some reservations' : 'Poor overall fit for the role'
                                }
                              ].map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.factor}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#666' }}>{row.weight}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <span style={{ fontWeight: 700, color: scoreClr(row.raw) }}>{row.raw}</span>
                                    <span style={{ color: '#999', fontSize: '0.85em' }}>/100</span>
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                                    {(row.raw * row.weightNum).toFixed(1)} pts
                                  </td>
                                  <td style={{ padding: '10px 12px', fontSize: '0.85em', color: '#555' }}>
                                    {row.desc}
                                    <div style={{ fontStyle: 'italic', color: '#888', marginTop: '2px', fontSize: '0.92em' }}>
                                      → {row.criteria(row.raw)}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              <tr style={{ background: '#f8f9ff', borderTop: '2px solid #dee2e6' }}>
                                <td colSpan={3} style={{ padding: '10px 12px', fontWeight: 700 }}>Final ATS Score</td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: scoreClr(app.atsScore || atsData?.score || 0), fontSize: '1.1em' }}>
                                  {app.atsScore || atsData?.score || 0} pts
                                </td>
                                <td style={{ padding: '10px 12px', fontSize: '0.85em', color: '#555' }}>
                                  = ({breakdown.keywordMatch || 0}×0.4) + ({breakdown.experienceRelevance || 0}×0.3) + ({breakdown.educationalAlignment || 0}×0.15) + ({breakdown.overallFit || 0}×0.15)
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Score Bands Legend */}
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px', padding: '8px 12px', background: '#f8f9fa', borderRadius: '6px', fontSize: '0.8em' }}>
                            <span style={{ fontWeight: 600 }}>Score Bands:</span>
                            <span style={{ color: '#27ae60' }}>■ 80-100: Excellent</span>
                            <span style={{ color: '#f39c12' }}>■ 60-79: Good</span>
                            <span style={{ color: '#e67e22' }}>■ 40-59: Average</span>
                            <span style={{ color: '#e74c3c' }}>■ 0-39: Poor</span>
                          </div>
                        </div>

                        {/* Strengths & Weaknesses */}
                        {((atsData?.strengths || []).length > 0 || (atsData?.weaknesses || []).length > 0) && (
                          <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {(atsData?.strengths || []).length > 0 && (
                              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                                <h5 style={{ margin: '0 0 8px', color: '#166534', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <CheckCircle size={14} /> Resume Strengths
                                </h5>
                                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82em', color: '#166534' }}>
                                  {atsData.strengths.map((s, i) => <li key={i} style={{ marginBottom: '3px' }}>{s}</li>)}
                                </ul>
                              </div>
                            )}
                            {(atsData?.weaknesses || []).length > 0 && (
                              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px' }}>
                                <h5 style={{ margin: '0 0 8px', color: '#991b1b', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <AlertTriangle size={14} /> Resume Gaps
                                </h5>
                                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82em', color: '#991b1b' }}>
                                  {atsData.weaknesses.map((w, i) => <li key={i} style={{ marginBottom: '3px' }}>{w}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Gap Analysis */}
                        {(atsData?.gapAnalysis || []).length > 0 && (
                          <div style={{ padding: '0 20px 16px' }}>
                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px' }}>
                              <h5 style={{ margin: '0 0 8px', color: '#92400e', fontSize: '0.85em' }}>📋 Gap Analysis</h5>
                              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82em', color: '#92400e' }}>
                                {atsData.gapAnalysis.map((g, i) => <li key={i} style={{ marginBottom: '3px' }}>{g}</li>)}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

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
    
    {/* Photo Enlargement Modal */}
    {enlargedPhoto && (
      <div 
        onClick={() => setEnlargedPhoto(null)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          cursor: 'pointer'
        }}
      >
        <div style={{ position: 'relative', maxWidth: '500px', maxHeight: '80vh' }}>
          <img 
            src={enlargedPhoto} 
            alt="Candidate Photo" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '80vh', 
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: '0.9rem'
          }}>
            Click anywhere to close
          </div>
        </div>
      </div>
    )}
    </>
  );
}
