import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Filter, Award, Clock, Target, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

export default function RecruiterReports() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => { fetchInterviews(); }, []);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('recruiterToken');
      const response = await fetch(`${API_URL}/recruiter/my-interviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
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

  const clr = (s) => {
    if (s >= 80) return '#27ae60';
    if (s >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const getRecBadge = (rec) => {
    const map = {
      'Strong Hire': { bg: '#d4edda', color: '#155724' },
      'Hire': { bg: '#cce5ff', color: '#004085' },
      'Maybe': { bg: '#fff3cd', color: '#856404' },
      'No Hire': { bg: '#f8d7da', color: '#721c24' },
    };
    return map[rec] || { bg: '#e9ecef', color: '#495057' };
  };

  // Filter to only interviews that have reports (completed/flagged with scores)
  const reportableInterviews = interviews.filter(iv => 
    (iv.status === 'completed' || iv.status === 'flagged') && iv.score != null
  );

  // Search filter
  const filtered = reportableInterviews.filter(iv => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || 
      (iv.candidateId?.name || '').toLowerCase().includes(term) ||
      (iv.candidateId?.email || '').toLowerCase().includes(term) ||
      (iv.stream || '').toLowerCase().includes(term) ||
      (iv.title || '').toLowerCase().includes(term);
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'flagged' && iv.flagged) ||
      (filterStatus === 'clean' && !iv.flagged) ||
      (filterStatus === 'strong-hire' && iv.recommendation === 'Strong Hire') ||
      (filterStatus === 'hire' && iv.recommendation === 'Hire') ||
      (filterStatus === 'maybe' && iv.recommendation === 'Maybe') ||
      (filterStatus === 'no-hire' && iv.recommendation === 'No Hire');

    return matchesSearch && matchesFilter;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'date') cmp = new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt);
    else if (sortBy === 'score') cmp = (b.score || 0) - (a.score || 0);
    else if (sortBy === 'name') cmp = (a.candidateId?.name || '').localeCompare(b.candidateId?.name || '');
    return sortDir === 'desc' ? cmp : -cmp;
  });

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading reports...</div>;

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5em' }}>📊 Interview Reports</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.9em' }}>
            {sorted.length} completed assessment{sorted.length !== 1 ? 's' : ''} with full reports
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            placeholder="Search by candidate, email, stream, or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 36px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.9em' }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.9em', background: 'white' }}
        >
          <option value="all">All Reports</option>
          <option value="flagged">Flagged</option>
          <option value="clean">Clean</option>
          <option value="strong-hire">Strong Hire</option>
          <option value="hire">Hire</option>
          <option value="maybe">Maybe</option>
          <option value="no-hire">No Hire</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <FileText size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ fontSize: '1.1em' }}>No completed assessment reports yet</p>
          <p style={{ fontSize: '0.85em' }}>Reports will appear here after candidates complete their interviews</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                <th style={thStyle} onClick={() => toggleSort('name')}>
                  Candidate {sortBy === 'name' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th style={thStyle}>Position</th>
                <th style={thStyle} onClick={() => toggleSort('score')}>
                  Score {sortBy === 'score' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th style={thStyle}>Recommendation</th>
                <th style={thStyle}>Integrity</th>
                <th style={thStyle} onClick={() => toggleSort('date')}>
                  Completed {sortBy === 'date' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((iv) => {
                const rec = iv.recommendation || 'N/A';
                const recStyle = getRecBadge(rec);
                const totalViolations = (iv.noFaceDetected || 0) + (iv.multipleFacesDetected || 0) + 
                  (iv.lookingAwayDetected || 0) + (iv.tabSwitchCount || 0) + (iv.voiceChangesDetected || 0);

                return (
                  <tr key={iv._id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{iv.candidateId?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.8em', color: '#888' }}>{iv.candidateId?.email || ''}</div>
                    </td>
                    <td style={tdStyle}>
                      <div>{iv.title || iv.stream}</div>
                      <div style={{ fontSize: '0.8em', color: '#888' }}>{iv.difficulty}</div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1em', color: clr(iv.score) }}>{iv.score}</span>
                      <span style={{ color: '#999', fontSize: '0.8em' }}>/100</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{ 
                        background: recStyle.bg, color: recStyle.color,
                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.8em', fontWeight: 600
                      }}>{rec}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {iv.flagged ? (
                        <span style={{ color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                          <AlertTriangle size={14} /> {totalViolations}
                        </span>
                      ) : (
                        <span style={{ color: '#27ae60', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                          <CheckCircle size={14} /> Clean
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.85em', color: '#666' }}>
                      {iv.completedAt ? new Date(iv.completedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={() => navigate(`/interview/${iv._id}/report`)}
                        style={{
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'transform 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Eye size={14} /> View Report
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '0.85em',
  fontWeight: 600,
  color: '#555',
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '0.9em'
};
