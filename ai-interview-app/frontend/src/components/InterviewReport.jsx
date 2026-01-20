import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Download, CheckCircle, XCircle, AlertTriangle, 
  Clock, Target, Award, TrendingUp, ArrowLeft 
} from 'lucide-react';
import './InterviewReport.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function InterviewReport() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [interviewId]);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('candidateToken') || localStorage.getItem('recruiterToken');
      const response = await fetch(`${API_URL}/interview/${interviewId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch report');

      const data = await response.json();
      setReport(data);
    } catch (err) {
      console.error('Fetch report error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    // Create a formatted text version of the report
    const reportText = `
INTERVIEW PERFORMANCE REPORT
========================================

Candidate: ${report.candidateName}
Email: ${report.candidateEmail}
Stream: ${report.stream}
Difficulty: ${report.difficulty}
${report.isMock ? 'Type: Mock Interview (Practice)\n' : ''}
Date: ${new Date(report.startTime).toLocaleString()}

SCORES & PERFORMANCE
----------------------------------------
Final Score: ${report.finalScore}/100
Integrity Score: ${report.integrityScore}/100
Completion Rate: ${report.completionRate}%
Status: ${report.status.toUpperCase()}
${report.flagged ? '⚠️ FLAGGED FOR VIOLATIONS\n' : ''}

TIME METRICS
----------------------------------------
Duration: ${report.duration} minutes
Start Time: ${new Date(report.startTime).toLocaleString()}
${report.endTime ? `End Time: ${new Date(report.endTime).toLocaleString()}` : 'In Progress'}

QUESTION ANALYSIS
----------------------------------------
Total Questions: ${report.totalQuestions}
Questions Answered: ${report.answeredQuestions}
AI-Generated Answers: ${report.aiDetections}

INTEGRITY MONITORING
----------------------------------------
Tab Switches: ${report.tabSwitches}
Face Violations: ${report.faceViolations}
  - No Face Detected: ${report.noFaceDetected || 0}
  - Multiple Faces Detected: ${report.multipleFacesDetected || 0}
Voice Changes: ${report.voiceChanges}
Total Malpractices: ${report.totalMalpractices}

STRENGTHS
----------------------------------------
${report.strengths.map(s => `✓ ${s}`).join('\n')}

${report.weaknesses.length > 0 ? `
AREAS FOR IMPROVEMENT
----------------------------------------
${report.weaknesses.map(w => `✗ ${w}`).join('\n')}
` : ''}

${report.recommendations.length > 0 ? `
RECOMMENDATIONS
----------------------------------------
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}

========================================
Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${interviewId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="report-loading">
        <div className="spinner"></div>
        <p>Generating your report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-error">
        <XCircle size={48} />
        <h2>Error Loading Report</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!report) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <div className="interview-report">
      <div className="report-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className="header-content">
          <FileText size={48} />
          <h1>Interview Performance Report</h1>
          {report.isMock && <span className="mock-badge">🎯 Mock Interview</span>}
        </div>
        <button className="download-btn" onClick={downloadReport}>
          <Download size={20} /> Download Report
        </button>
      </div>

      {/* Score Cards */}
      <div className="score-cards">
        <div className="score-card main-score" style={{ borderColor: getScoreColor(report.finalScore) }}>
          <Award size={32} style={{ color: getScoreColor(report.finalScore) }} />
          <h3>Final Score</h3>
          <div className="score-value" style={{ color: getScoreColor(report.finalScore) }}>
            {report.finalScore}
            <span>/100</span>
          </div>
        </div>

        <div className="score-card" style={{ borderColor: getScoreColor(report.integrityScore) }}>
          <CheckCircle size={32} style={{ color: getScoreColor(report.integrityScore) }} />
          <h3>Integrity Score</h3>
          <div className="score-value" style={{ color: getScoreColor(report.integrityScore) }}>
            {report.integrityScore}
            <span>/100</span>
          </div>
        </div>

        <div className="score-card" style={{ borderColor: getScoreColor(report.completionRate) }}>
          <Target size={32} style={{ color: getScoreColor(report.completionRate) }} />
          <h3>Completion</h3>
          <div className="score-value" style={{ color: getScoreColor(report.completionRate) }}>
            {report.completionRate}
            <span>%</span>
          </div>
        </div>

        <div className="score-card">
          <Clock size={32} style={{ color: '#3498db' }} />
          <h3>Duration</h3>
          <div className="score-value" style={{ color: '#3498db' }}>
            {report.duration}
            <span>min</span>
          </div>
        </div>
      </div>

      {/* Interview Details */}
      <div className="report-section">
        <h2>Interview Details</h2>
        <div className="details-grid">
          <div className="detail-item">
            <span className="label">Candidate:</span>
            <span className="value">{report.candidateName}</span>
          </div>
          <div className="detail-item">
            <span className="label">Email:</span>
            <span className="value">{report.candidateEmail}</span>
          </div>
          <div className="detail-item">
            <span className="label">Stream:</span>
            <span className="value">{report.stream}</span>
          </div>
          <div className="detail-item">
            <span className="label">Difficulty:</span>
            <span className={`value badge ${report.difficulty.toLowerCase()}`}>
              {report.difficulty}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Status:</span>
            <span className={`value badge ${report.status}`}>
              {report.status}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Flagged:</span>
            <span className={`value ${report.flagged ? 'flagged' : 'clean'}`}>
              {report.flagged ? '⚠️ Yes' : '✓ No'}
            </span>
          </div>
        </div>
      </div>

      {/* Question Analysis */}
      <div className="report-section">
        <h2>Question Analysis</h2>
        <div className="questions-stats">
          <div className="stat-box">
            <h4>{report.totalQuestions}</h4>
            <p>Total Questions</p>
          </div>
          <div className="stat-box">
            <h4>{report.answeredQuestions}</h4>
            <p>Answered</p>
          </div>
          <div className="stat-box">
            <h4>{report.aiDetections}</h4>
            <p>AI Detected</p>
          </div>
        </div>
      </div>

      {/* Malpractice Summary */}
      {report.totalMalpractices > 0 && (
        <div className="report-section malpractice-section">
          <h2>
            <AlertTriangle size={24} />
            Integrity Monitoring
          </h2>
          <div className="malpractice-grid">
            <div className="malpractice-stat">
              <span className="count">{report.tabSwitches}</span>
              <span className="label">Tab Switches</span>
            </div>
            <div className="malpractice-stat">
              <span className="count">{report.faceViolations}</span>
              <span className="label">Face Violations</span>
            </div>
            <div className="malpractice-stat">
              <span className="count">{report.noFaceDetected || 0}</span>
              <span className="label">No Face Detected</span>
            </div>
            <div className="malpractice-stat">
              <span className="count">{report.multipleFacesDetected || 0}</span>
              <span className="label">Multiple Faces</span>
            </div>
            <div className="malpractice-stat">
              <span className="count">{report.voiceChanges}</span>
              <span className="label">Voice Changes</span>
            </div>
            <div className="malpractice-stat">
              <span className="count">{report.aiDetections}</span>
              <span className="label">AI Answers</span>
            </div>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="report-section">
        <div className="strengths-weaknesses">
          {report.strengths.length > 0 && (
            <div className="strengths">
              <h3>
                <CheckCircle size={20} />
                Strengths
              </h3>
              <ul>
                {report.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {report.weaknesses.length > 0 && (
            <div className="weaknesses">
              <h3>
                <AlertTriangle size={20} />
                Areas for Improvement
              </h3>
              <ul>
                {report.weaknesses.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="report-section recommendations">
          <h2>
            <TrendingUp size={24} />
            Recommendations
          </h2>
          <ol>
            {report.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
