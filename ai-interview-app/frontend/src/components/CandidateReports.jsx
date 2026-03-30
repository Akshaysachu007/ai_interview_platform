import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Award, Clock, Target, CheckCircle, XCircle, Search, Eye, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

export default function CandidateReports() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('candidateToken');
      const response = await fetch(`${API_URL}/candidate/my-applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
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

  const clr = (s) => {
    if (s >= 80) return '#27ae60';
    if (s >= 60) return '#f39c12';
    return '#e74c3c';
  };

  // Filter to only completed interviews with reports
  const completedInterviews = applications.filter(app => 
    app.status === 'completed' && app.score != null
  );

  const filtered = completedInterviews.filter(app => {
    const term = searchTerm.toLowerCase();
    return !term ||
      (app.stream || '').toLowerCase().includes(term) ||
      (app.title || '').toLowerCase().includes(term) ||
      (app.difficulty || '').toLowerCase().includes(term);
  });

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your reports...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={24} /> My Interview Reports
        </h2>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95em' }}>
          View detailed reports for all your completed interviews
        </p>
      </div>

      {/* Search */}
      {completedInterviews.length > 0 && (
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            placeholder="Search by stream, job title, or difficulty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 12px 12px 36px', 
              border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.9em',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <FileText size={56} style={{ opacity: 0.2, marginBottom: '16px' }} />
          <h3 style={{ color: '#666' }}>No Interview Reports Yet</h3>
          <p style={{ fontSize: '0.9em' }}>
            Reports will appear here after you complete your interviews.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filtered.map((app) => (
            <div key={app._id} style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                {/* Left: Info */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.1em' }}>
                    {app.title || app.stream}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.85em', color: '#666' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Target size={14} /> {app.stream}
                    </span>
                    <span style={{ 
                      background: app.difficulty === 'Hard' ? '#fee2e2' : app.difficulty === 'Medium' ? '#fff3cd' : '#d4edda',
                      color: app.difficulty === 'Hard' ? '#991b1b' : app.difficulty === 'Medium' ? '#856404' : '#155724',
                      padding: '2px 8px', borderRadius: '4px', fontWeight: 600
                    }}>
                      {app.difficulty}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {app.completedAt ? new Date(app.completedAt).toLocaleDateString() : 'N/A'}
                    </span>
                    {app.duration && (
                      <span>{app.duration} min</span>
                    )}
                  </div>
                </div>

                {/* Center: Score */}
                <div style={{ textAlign: 'center', minWidth: '80px' }}>
                  <div style={{ fontSize: '2em', fontWeight: 700, color: clr(app.score), lineHeight: 1 }}>
                    {app.score}
                  </div>
                  <div style={{ fontSize: '0.75em', color: '#999' }}>/ 100</div>
                </div>

                {/* Right: Action */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => navigate(`/interview/${app._id}/report`)}
                    style={{
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      boxShadow: '0 2px 6px rgba(102,126,234,0.3)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(102,126,234,0.3)'; }}
                  >
                    <Eye size={16} /> View Full Report
                  </button>
                </div>
              </div>

              {/* Bottom details */}
              <div style={{ 
                display: 'flex', gap: '16px', marginTop: '14px', paddingTop: '12px', 
                borderTop: '1px solid #f0f0f0', flexWrap: 'wrap', fontSize: '0.82em'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} color="#27ae60" /> Completed
                </span>
                {app.flagged && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e74c3c' }}>
                    <AlertTriangle size={14} /> Flagged for review
                  </span>
                )}
                {app.terminatedByViolation && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e74c3c' }}>
                    <XCircle size={14} /> Terminated: {app.terminationReason}
                  </span>
                )}
                {app.questions && (
                  <span style={{ color: '#888' }}>
                    {app.questions.filter(q => q.answer).length}/{app.questions.length} questions answered
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
