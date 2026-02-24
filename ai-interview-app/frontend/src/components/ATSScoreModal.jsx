import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Briefcase,
  Award,
  Users,
  RefreshCw
} from 'lucide-react';
import './ATSScoreModal.css';

/**
 * ATSScoreModal Component
 * Displays detailed ATS score breakdown in a tabular format
 * Shows evaluation from resume and job description
 */
export default function ATSScoreModal({
  application,
  onClose,
  onAccept,
  onReject,
  isProcessing
}) {
  const [expandedSections, setExpandedSections] = useState({
    breakdown: true,
    strengths: true,
    weaknesses: true,
    gapAnalysis: true,
    jobMatch: true
  });

  if (!application) return null;

  const atsData = application.applicationScores && application.applicationScores.length > 0
    ? application.applicationScores[application.applicationScores.length - 1]
    : null;

  if (!atsData) return null;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 70) return '#3b82f6'; // blue
    if (score >= 60) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getRecommendationColor = (recommendation) => {
    const colors = {
      'Highly Recommended': '#10b981',
      'Recommended': '#3b82f6',
      'Consider': '#f59e0b',
      'Not Recommended': '#ef4444'
    };
    return colors[recommendation] || '#6b7280';
  };

  const breakdown = atsData.breakdown || {};
  const strengths = atsData.strengths || [];
  const weaknesses = atsData.weaknesses || [];
  const gapAnalysis = atsData.gapAnalysis || [];

  return (
    <div className="ats-modal-backdrop" onClick={onClose}>
      <div className="ats-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="ats-modal-header">
          <div className="header-title">
            <Target size={24} style={{ color: '#667eea' }} />
            <div>
              <h2>ATS Score Evaluation</h2>
              <p>Resume vs Job Description Analysis</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Main Score Card */}
        <div className="ats-score-card">
          <div className="score-main">
            <div className="score-circle" style={{ background: getScoreColor(atsData.score) }}>
              <span className="score-value">{atsData.score}%</span>
            </div>
            <div className="score-info">
              <div style={{ marginBottom: '12px' }}>
                <span
                  className="recommendation-badge"
                  style={{ backgroundColor: getRecommendationColor(atsData.recommendation) }}
                >
                  {atsData.recommendation}
                </span>
              </div>
              <p className="score-meta">
                Evaluated on {new Date(atsData.scoredAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Score Breakdown Table */}
        <div className="ats-section">
          <button
            className="section-header"
            onClick={() => toggleSection('breakdown')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} style={{ color: '#667eea' }} />
              <span>Score Breakdown</span>
            </div>
            {expandedSections.breakdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {expandedSections.breakdown && (
            <div className="breakdown-table">
              <table>
                <thead>
                  <tr>
                    <th>Evaluation Criteria</th>
                    <th>Score</th>
                    <th>Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="criteria-label">
                        <BookOpen size={16} />
                        Keyword Match
                      </div>
                      <span className="criteria-description">
                        How well resume keywords align with job description
                      </span>
                    </td>
                    <td>
                      <div className="score-display">
                        <span
                          className="score-percentage"
                          style={{ color: getScoreColor(breakdown.keywordMatch) }}
                        >
                          {breakdown.keywordMatch || 0}%
                        </span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${breakdown.keywordMatch || 0}%`,
                              backgroundColor: getScoreColor(breakdown.keywordMatch)
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {breakdown.keywordMatch >= 75
                        ? '✅ Excellent match'
                        : breakdown.keywordMatch >= 50
                        ? '⚠️ Moderate match'
                        : '❌ Poor match'}
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <div className="criteria-label">
                        <Briefcase size={16} />
                        Experience Relevance
                      </div>
                      <span className="criteria-description">
                        Candidate's work experience matches job requirements
                      </span>
                    </td>
                    <td>
                      <div className="score-display">
                        <span
                          className="score-percentage"
                          style={{ color: getScoreColor(breakdown.experienceRelevance) }}
                        >
                          {breakdown.experienceRelevance || 0}%
                        </span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${breakdown.experienceRelevance || 0}%`,
                              backgroundColor: getScoreColor(breakdown.experienceRelevance)
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {breakdown.experienceRelevance >= 75
                        ? '✅ Highly relevant'
                        : breakdown.experienceRelevance >= 50
                        ? '⚠️ Somewhat relevant'
                        : '❌ Not relevant'}
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <div className="criteria-label">
                        <Award size={16} />
                        Educational Alignment
                      </div>
                      <span className="criteria-description">
                        Education level and field match requirements
                      </span>
                    </td>
                    <td>
                      <div className="score-display">
                        <span
                          className="score-percentage"
                          style={{ color: getScoreColor(breakdown.educationalAlignment) }}
                        >
                          {breakdown.educationalAlignment || 0}%
                        </span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${breakdown.educationalAlignment || 0}%`,
                              backgroundColor: getScoreColor(breakdown.educationalAlignment)
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {breakdown.educationalAlignment >= 75
                        ? '✅ Perfect alignment'
                        : breakdown.educationalAlignment >= 50
                        ? '⚠️ Adequate'
                        : '❌ Misaligned'}
                    </td>
                  </tr>

                  <tr className="summary-row">
                    <td>
                      <div className="criteria-label overall">
                        <Users size={16} />
                        Overall Fit Score
                      </div>
                    </td>
                    <td>
                      <div className="score-display overall">
                        <span
                          className="score-percentage overall"
                          style={{ color: getScoreColor(breakdown.overallFit) }}
                        >
                          {breakdown.overallFit || 0}%
                        </span>
                        <div className="progress-bar overall">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${breakdown.overallFit || 0}%`,
                              backgroundColor: getScoreColor(breakdown.overallFit)
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="assessment-text">
                      {breakdown.overallFit >= 80
                        ? '🌟 Excellent candidate'
                        : breakdown.overallFit >= 60
                        ? '👍 Good candidate'
                        : '⚠️ Consider carefully'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Strengths Section */}
        {strengths.length > 0 && (
          <div className="ats-section">
            <button
              className="section-header"
              onClick={() => toggleSection('strengths')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} style={{ color: '#10b981' }} />
                <span>Candidate Strengths</span>
                <span className="section-count">{strengths.length}</span>
              </div>
              {expandedSections.strengths ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expandedSections.strengths && (
              <div className="strengths-list">
                {strengths.map((strength, idx) => (
                  <div key={idx} className="strength-item">
                    <CheckCircle size={16} className="strength-icon" />
                    <span>{strength}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Weaknesses Section */}
        {weaknesses.length > 0 && (
          <div className="ats-section">
            <button
              className="section-header"
              onClick={() => toggleSection('weaknesses')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} style={{ color: '#ef4444' }} />
                <span>Candidate Weaknesses</span>
                <span className="section-count">{weaknesses.length}</span>
              </div>
              {expandedSections.weaknesses ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expandedSections.weaknesses && (
              <div className="weaknesses-list">
                {weaknesses.map((weakness, idx) => (
                  <div key={idx} className="weakness-item">
                    <AlertCircle size={16} className="weakness-icon" />
                    <span>{weakness}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gap Analysis Section */}
        {gapAnalysis.length > 0 && (
          <div className="ats-section">
            <button
              className="section-header"
              onClick={() => toggleSection('gapAnalysis')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: '#f59e0b' }} />
                <span>Gap Analysis</span>
                <span className="section-count">{gapAnalysis.length}</span>
              </div>
              {expandedSections.gapAnalysis ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expandedSections.gapAnalysis && (
              <div className="gap-list">
                {gapAnalysis.map((gap, idx) => (
                  <div key={idx} className="gap-item">
                    <RefreshCw size={16} className="gap-icon" />
                    <span>{gap}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Candidate Information */}
        <div className="candidate-section">
          <h3>Candidate Information</h3>
          <div className="candidate-details">
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{application.candidateId?.name || 'Unknown'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Email:</span>
              <span className="value">{application.candidateId?.email || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Position Applied:</span>
              <span className="value">{application.stream} - {application.difficulty}</span>
            </div>
            <div className="detail-row">
              <span className="label">Applied On:</span>
              <span className="value">{new Date(application.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button
            className="btn-reject"
            onClick={() => onReject(application._id)}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : '✕ Reject Application'}
          </button>
          <button
            className="btn-accept"
            onClick={() => onAccept(application._id)}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : '✓ Accept Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
