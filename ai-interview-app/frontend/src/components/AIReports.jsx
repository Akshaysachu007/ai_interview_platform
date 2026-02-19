import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Award, User, Clock, CheckCircle, XCircle, 
  AlertTriangle, BarChart3, Brain, Target, ThumbsUp, ThumbsDown,
  Filter, Search, Download, Eye, Star
} from 'lucide-react';
import './AIReports.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function AIReports() {
  const [evaluations, setEvaluations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterRecommendation, setFilterRecommendation] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  useEffect(() => {
    fetchAIEvaluations();
  }, []);

  const fetchAIEvaluations = async () => {
    try {
      const token = localStorage.getItem('recruiterToken');
      const response = await fetch(`${API_URL}/recruiter/ai-evaluations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch AI evaluations');

      const data = await response.json();
      setEvaluations(data.evaluations);
      setSummary(data.summary);
    } catch (err) {
      console.error('Error fetching AI evaluations:', err);
      alert('Failed to load AI evaluations');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'Strong Hire': return '#10b981';
      case 'Hire': return '#22c55e';
      case 'Maybe': return '#f59e0b';
      case 'No Hire': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'Strong Hire': return <Star size={16} fill="currentColor" />;
      case 'Hire': return <CheckCircle size={16} />;
      case 'Maybe': return <AlertTriangle size={16} />;
      case 'No Hire': return <XCircle size={16} />;
      default: return null;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#22c55e';
    if (score >= 55) return '#f59e0b';
    return '#ef4444';
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesFilter = filterRecommendation === 'All' || evaluation.recommendation === filterRecommendation;
    const matchesSearch = !searchTerm || 
      evaluation.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return <div className="loading">Loading AI evaluations...</div>;
  }

  return (
    <div className="ai-reports-container">
      <div className="reports-header">
        <div className="header-title">
          <Brain size={32} />
          <div>
            <h1>AI Interview Evaluations</h1>
            <p>Comprehensive AI-powered analysis of all completed interviews</p>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {summary && (
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#3b82f6' }}>
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <h3>{summary.totalEvaluations}</h3>
              <p>Total Evaluations</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#10b981' }}>
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>{summary.averageScore}</h3>
              <p>Average Score</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#22c55e' }}>
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{summary.recommendations.strongHire + summary.recommendations.hire}</h3>
              <p>Hire Recommended</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f59e0b' }}>
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <h3>{summary.averageDuration} min</h3>
              <p>Avg Duration</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <h3>{summary.flaggedCount}</h3>
              <p>Flagged Interviews</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by candidate name, email, or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <Filter size={18} />
          <span>Filter by:</span>
          {['All', 'Strong Hire', 'Hire', 'Maybe', 'No Hire'].map(filter => (
            <button
              key={filter}
              className={`filter-btn ${filterRecommendation === filter ? 'active' : ''}`}
              onClick={() => setFilterRecommendation(filter)}
              style={{
                borderColor: filter !== 'All' ? getRecommendationColor(filter) : '#d1d5db',
                color: filterRecommendation === filter ? getRecommendationColor(filter) : '#6b7280'
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Evaluations List */}
      {filteredEvaluations.length === 0 ? (
        <div className="no-evaluations">
          <Brain size={48} />
          <h3>No AI Evaluations Found</h3>
          <p>No completed interviews match your search criteria.</p>
        </div>
      ) : (
        <div className="evaluations-grid">
          {filteredEvaluations.map((evaluation) => (
            <div key={evaluation.interviewId} className="evaluation-card">
              <div className="card-header-eval">
                <div className="candidate-info-eval">
                  <User size={20} />
                  <div>
                    <h3>{evaluation.candidateName}</h3>
                    <p>{evaluation.candidateEmail}</p>
                  </div>
                </div>
                <div 
                  className="recommendation-badge"
                  style={{ 
                    background: getRecommendationColor(evaluation.recommendation),
                    color: 'white'
                  }}
                >
                  {getRecommendationIcon(evaluation.recommendation)}
                  {evaluation.recommendation}
                </div>
              </div>

              <div className="job-details">
                <strong>{evaluation.jobTitle}</strong>
                <span className={`difficulty-badge-sm ${evaluation.difficulty.toLowerCase()}`}>
                  {evaluation.difficulty}
                </span>
                {evaluation.flagged && (
                  <span className="flagged-badge">
                    <AlertTriangle size={14} />
                    Flagged
                  </span>
                )}
              </div>

              {/* Score Display */}
              <div className="score-display-card">
                <div className="score-circle" style={{ borderColor: getScoreColor(evaluation.score) }}>
                  <span className="score-number" style={{ color: getScoreColor(evaluation.score) }}>
                    {evaluation.score}
                  </span>
                  <span className="score-label">Score</span>
                </div>

                <div className="mini-stats">
                  <div className="mini-stat">
                    <Clock size={14} />
                    <span>{evaluation.duration || 0} min</span>
                  </div>
                  <div className="mini-stat">
                    <Target size={14} />
                    <span>{evaluation.questionsSummary.answered}/{evaluation.questionsSummary.total} Q</span>
                  </div>
                  {evaluation.enhancedEvaluation && (
                    <div className="mini-stat">
                      <Brain size={14} />
                      <span>{evaluation.enhancedEvaluation.percentileRank}th %ile</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pros and Cons */}
              <div className="pros-cons-section">
                {evaluation.pros && evaluation.pros.length > 0 && (
                  <div className="pros-section-mini">
                    <div className="section-title-mini">
                      <ThumbsUp size={14} style={{ color: '#10b981' }} />
                      <strong>Strengths</strong>
                    </div>
                    <ul>
                      {evaluation.pros.slice(0, 2).map((pro, idx) => (
                        <li key={idx}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.cons && evaluation.cons.length > 0 && (
                  <div className="cons-section-mini">
                    <div className="section-title-mini">
                      <ThumbsDown size={14} style={{ color: '#ef4444' }} />
                      <strong>Areas for Improvement</strong>
                    </div>
                    <ul>
                      {evaluation.cons.slice(0, 2).map((con, idx) => (
                        <li key={idx}>{con}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Enhanced Metrics Preview */}
              {evaluation.enhancedEvaluation && (
                <div className="enhanced-metrics-preview">
                  <div className="metric-item">
                    <span className="metric-label">Quality</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill" 
                        style={{ 
                          width: `${evaluation.enhancedEvaluation.overallQualityScore}%`,
                          background: getScoreColor(evaluation.enhancedEvaluation.overallQualityScore)
                        }}
                      />
                    </div>
                    <span className="metric-value">{evaluation.enhancedEvaluation.overallQualityScore}</span>
                  </div>

                  {evaluation.enhancedEvaluation.toneAnalysis && (
                    <div className="metric-item">
                      <span className="metric-label">Communication</span>
                      <div className="metric-bar">
                        <div 
                          className="metric-fill" 
                          style={{ 
                            width: `${evaluation.enhancedEvaluation.toneAnalysis.clarity}%`,
                            background: getScoreColor(evaluation.enhancedEvaluation.toneAnalysis.clarity)
                          }}
                        />
                      </div>
                      <span className="metric-value">{evaluation.enhancedEvaluation.toneAnalysis.clarity}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="card-actions-eval">
                <button 
                  className="btn-view-details"
                  onClick={() => setSelectedEvaluation(evaluation)}
                >
                  <Eye size={16} />
                  View Full Report
                </button>
              </div>

              <div className="card-footer-eval">
                <small>Completed: {new Date(evaluation.completedAt).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Evaluation Modal */}
      {selectedEvaluation && (
        <div className="modal-overlay" onClick={() => setSelectedEvaluation(null)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-eval">
              <div>
                <h2>AI Evaluation Report - {selectedEvaluation.candidateName}</h2>
                <p>{selectedEvaluation.jobTitle} | {selectedEvaluation.stream}</p>
              </div>
              <button className="close-btn" onClick={() => setSelectedEvaluation(null)}>×</button>
            </div>

            <div className="modal-body-eval">
              {/* Overall Assessment */}
              <section className="eval-section">
                <h3>Overall Assessment</h3>
                <div className="assessment-box">
                  <div className="assessment-header">
                    <div className="assessment-score">
                      <span className="large-score" style={{ color: getScoreColor(selectedEvaluation.score) }}>
                        {selectedEvaluation.score}/100
                      </span>
                      <span className="assessment-label">Overall Score</span>
                    </div>
                    <div 
                      className="recommendation-badge-large"
                      style={{ background: getRecommendationColor(selectedEvaluation.recommendation) }}
                    >
                      {getRecommendationIcon(selectedEvaluation.recommendation)}
                      <span>{selectedEvaluation.recommendation}</span>
                    </div>
                  </div>
                  <p className="overall-text">{selectedEvaluation.overallAssessment}</p>
                  {selectedEvaluation.enhancedEvaluation && (
                    <div className="comparative-analysis">
                      <span><strong>Performance:</strong> {selectedEvaluation.enhancedEvaluation.comparedToAverage}</span>
                      <span><strong>Percentile:</strong> {selectedEvaluation.enhancedEvaluation.percentileRank}th</span>
                      <span><strong>AI Confidence:</strong> {selectedEvaluation.aiConfidenceLevel}%</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Strengths and Weaknesses */}
              <section className="eval-section">
                <h3>Detailed Analysis</h3>
                <div className="pros-cons-detailed">
                  <div className="pros-section">
                    <h4><ThumbsUp size={18} style={{ color: '#10b981' }} /> Strengths</h4>
                    <ul>
                      {selectedEvaluation.pros.map((pro, idx) => (
                        <li key={idx}><CheckCircle size={16} /> {pro}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="cons-section">
                    <h4><ThumbsDown size={18} style={{ color: '#ef4444' }} /> Areas for Improvement</h4>
                    <ul>
                      {selectedEvaluation.cons.map((con, idx) => (
                        <li key={idx}><AlertTriangle size={16} /> {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Enhanced Evaluation Metrics */}
              {selectedEvaluation.enhancedEvaluation && (
                <>
                  <section className="eval-section">
                    <h3>Performance Metrics</h3>
                    <div className="metrics-grid">
                      <div className="metric-card">
                        <h4>Technical Accuracy</h4>
                        <div className="metric-score">
                          {selectedEvaluation.enhancedEvaluation.technicalAccuracyScore}/100
                        </div>
                        <div className="metric-bar-large">
                          <div 
                            className="metric-fill-large" 
                            style={{ 
                              width: `${selectedEvaluation.enhancedEvaluation.technicalAccuracyScore}%`,
                              background: getScoreColor(selectedEvaluation.enhancedEvaluation.technicalAccuracyScore)
                            }}
                          />
                        </div>
                      </div>

                      <div className="metric-card">
                        <h4>Answer Relevance</h4>
                        <div className="metric-score">
                          {selectedEvaluation.enhancedEvaluation.relevanceScore}/100
                        </div>
                        <div className="metric-bar-large">
                          <div 
                            className="metric-fill-large" 
                            style={{ 
                              width: `${selectedEvaluation.enhancedEvaluation.relevanceScore}%`,
                              background: getScoreColor(selectedEvaluation.enhancedEvaluation.relevanceScore)
                            }}
                          />
                        </div>
                      </div>

                      <div className="metric-card">
                        <h4>Completeness</h4>
                        <div className="metric-score">
                          {selectedEvaluation.enhancedEvaluation.completenessScore}/100
                        </div>
                        <div className="metric-bar-large">
                          <div 
                            className="metric-fill-large" 
                            style={{ 
                              width: `${selectedEvaluation.enhancedEvaluation.completenessScore}%`,
                              background: getScoreColor(selectedEvaluation.enhancedEvaluation.completenessScore)
                            }}
                          />
                        </div>
                      </div>

                      <div className="metric-card">
                        <h4>Answer Depth</h4>
                        <div className="metric-score">
                          {selectedEvaluation.enhancedEvaluation.answerDepthScore}/100
                        </div>
                        <div className="metric-bar-large">
                          <div 
                            className="metric-fill-large" 
                            style={{ 
                              width: `${selectedEvaluation.enhancedEvaluation.answerDepthScore}%`,
                              background: getScoreColor(selectedEvaluation.enhancedEvaluation.answerDepthScore)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Timing Analysis */}
                  <section className="eval-section">
                    <h3>Timing & Response Analysis</h3>
                    <div className="timing-analysis">
                      <div className="timing-stat">
                        <strong>Average Answer Time:</strong>
                        <span>{selectedEvaluation.enhancedEvaluation.averageAnswerTime}s</span>
                      </div>
                      <div className="timing-stat">
                        <strong>Response Consistency:</strong>
                        <span className={`badge-${selectedEvaluation.enhancedEvaluation.responseConsistency?.toLowerCase()}`}>
                          {selectedEvaluation.enhancedEvaluation.responseConsistency}
                        </span>
                      </div>
                      <div className="timing-stat">
                        <strong>Pace Analysis:</strong>
                        <span className={`badge-${selectedEvaluation.enhancedEvaluation.paceAnalysis?.toLowerCase().replace('-', '')}`}>
                          {selectedEvaluation.enhancedEvaluation.paceAnalysis}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Tone Analysis */}
                  {selectedEvaluation.enhancedEvaluation.toneAnalysis && (
                    <section className="eval-section">
                      <h3>Communication & Tone Analysis</h3>
                      <div className="tone-metrics">
                        <div className="tone-metric">
                          <span className="tone-label">Professionalism</span>
                          <div className="tone-bar">
                            <div 
                              className="tone-fill" 
                              style={{ 
                                width: `${selectedEvaluation.enhancedEvaluation.toneAnalysis.professionalism}%`,
                                background: getScoreColor(selectedEvaluation.enhancedEvaluation.toneAnalysis.professionalism)
                              }}
                            />
                          </div>
                          <span className="tone-value">{selectedEvaluation.enhancedEvaluation.toneAnalysis.professionalism}</span>
                        </div>

                        <div className="tone-metric">
                          <span className="tone-label">Confidence</span>
                          <div className="tone-bar">
                            <div 
                              className="tone-fill" 
                              style={{ 
                                width: `${selectedEvaluation.enhancedEvaluation.toneAnalysis.confidence}%`,
                                background: getScoreColor(selectedEvaluation.enhancedEvaluation.toneAnalysis.confidence)
                              }}
                            />
                          </div>
                          <span className="tone-value">{selectedEvaluation.enhancedEvaluation.toneAnalysis.confidence}</span>
                        </div>

                        <div className="tone-metric">
                          <span className="tone-label">Clarity</span>
                          <div className="tone-bar">
                            <div 
                              className="tone-fill" 
                              style={{ 
                                width: `${selectedEvaluation.enhancedEvaluation.toneAnalysis.clarity}%`,
                                background: getScoreColor(selectedEvaluation.enhancedEvaluation.toneAnalysis.clarity)
                              }}
                            />
                          </div>
                          <span className="tone-value">{selectedEvaluation.enhancedEvaluation.toneAnalysis.clarity}</span>
                        </div>

                        <div className="tone-metric">
                          <span className="tone-label">Articulation</span>
                          <div className="tone-bar">
                            <div 
                              className="tone-fill" 
                              style={{ 
                                width: `${selectedEvaluation.enhancedEvaluation.toneAnalysis.articulation}%`,
                                background: getScoreColor(selectedEvaluation.enhancedEvaluation.toneAnalysis.articulation)
                              }}
                            />
                          </div>
                          <span className="tone-value">{selectedEvaluation.enhancedEvaluation.toneAnalysis.articulation}</span>
                        </div>

                        <div className="overall-tone">
                          <strong>Overall Tone:</strong>
                          <span className={`tone-badge tone-${selectedEvaluation.enhancedEvaluation.toneAnalysis.overallTone?.toLowerCase()}`}>
                            {selectedEvaluation.enhancedEvaluation.toneAnalysis.overallTone}
                          </span>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Improvement Suggestions */}
                  {selectedEvaluation.enhancedEvaluation.improvementSuggestions && 
                   selectedEvaluation.enhancedEvaluation.improvementSuggestions.length > 0 && (
                    <section className="eval-section">
                      <h3>Improvement Suggestions</h3>
                      <ul className="suggestions-list">
                        {selectedEvaluation.enhancedEvaluation.improvementSuggestions.map((suggestion, idx) => (
                          <li key={idx}>
                            <TrendingUp size={16} style={{ color: '#3b82f6' }} />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              )}

              {/* Integrity Report */}
              <section className="eval-section">
                <h3>Integrity Report</h3>
                <div className="integrity-stats">
                  <div className="integrity-stat">
                    <span className="stat-label">Total Violations:</span>
                    <span className={selectedEvaluation.malpractices.total > 0 ? 'stat-warning' : 'stat-success'}>
                      {selectedEvaluation.malpractices.total}
                    </span>
                  </div>
                  <div className="integrity-stat">
                    <span className="stat-label">Tab Switches:</span>
                    <span>{selectedEvaluation.malpractices.tabSwitches}</span>
                  </div>
                  <div className="integrity-stat">
                    <span className="stat-label">AI Answers:</span>
                    <span>{selectedEvaluation.malpractices.aiAnswers}</span>
                  </div>
                  <div className="integrity-stat">
                    <span className="stat-label">Face Violations:</span>
                    <span>{selectedEvaluation.malpractices.faceViolations}</span>
                  </div>
                </div>
              </section>

              {/* Interview Metadata */}
              <section className="eval-section">
                <h3>Interview Details</h3>
                <div className="metadata-grid">
                  <div><strong>Stream:</strong> {selectedEvaluation.stream}</div>
                  <div><strong>Difficulty:</strong> {selectedEvaluation.difficulty}</div>
                  <div><strong>Duration:</strong> {selectedEvaluation.duration} minutes</div>
                  <div><strong>Questions Answered:</strong> {selectedEvaluation.questionsSummary.answered}/{selectedEvaluation.questionsSummary.total}</div>
                  <div><strong>Completed:</strong> {new Date(selectedEvaluation.completedAt).toLocaleString()}</div>
                  <div><strong>Status:</strong> {selectedEvaluation.status}</div>
                </div>
              </section>
            </div>

            <div className="modal-footer-eval">
              <button className="btn-secondary" onClick={() => setSelectedEvaluation(null)}>
                Close
              </button>
              <button className="btn-primary">
                <Download size={16} />
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
