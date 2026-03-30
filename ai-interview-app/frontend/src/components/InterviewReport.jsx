import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Download, CheckCircle, XCircle, AlertTriangle,
  Clock, Target, Award, TrendingUp, ArrowLeft, ChevronDown, ChevronUp,
  Eye, EyeOff, Users, MonitorOff, Mic, Bot, Shield, Timer, BookOpen
} from 'lucide-react';
import './InterviewReport.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function InterviewReport() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => { fetchReport(); }, [interviewId]);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('candidateToken') || localStorage.getItem('recruiterToken');
      const response = await fetch(`${API_URL}/interview/${interviewId}/report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch report');
      const data = await response.json();
      console.log('Report data received:', data);
      setReport(data);
    } catch (err) {
      console.error('Fetch report error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ===== ROLE DETECTION ===== */
  const isRecruiter = report?.viewerRole === 'recruiter';

  /* ===== HELPERS ===== */
  const clr = (s) => {
    if (s >= 80) return '#27ae60';
    if (s >= 60) return '#f39c12';
    return '#e74c3c';
  };
  const sevClr = (s) => {
    if (s === 'High') return '#e74c3c';
    if (s === 'Medium') return '#f39c12';
    return '#27ae60';
  };
  const barWidth = (v, max = 100) => `${Math.min(100, (v / max) * 100)}%`;
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  /* ===== DOWNLOAD ===== */
  const downloadReport = () => {
    if (!report) return;
    const lines = [];
    const prefix = isRecruiter ? 'RECRUITER' : 'CANDIDATE';
    lines.push(`${prefix} ASSESSMENT REPORT`);
    lines.push('='.repeat(60));
    lines.push(`Candidate: ${report.candidateName}`);
    lines.push(`Email: ${report.candidateEmail}`);
    lines.push(`Stream: ${report.stream} | Difficulty: ${report.difficulty}`);
    lines.push(`Date: ${report.startTime ? new Date(report.startTime).toLocaleString() : 'N/A'}`);
    lines.push(`Duration: ${report.duration || 0} minutes`);
    lines.push('');
    lines.push(`Final Score: ${report.finalScore}/100`);
    lines.push(`Completion Rate: ${report.completionRate}%`);

    if (isRecruiter) {
      lines.push(`Integrity Score: ${report.integrityScore}/100`);
      lines.push(`Recommendation: ${report.recommendation || 'N/A'}`);
      lines.push(`Flagged: ${report.flagged ? 'YES' : 'No'}`);
      lines.push('');

      lines.push('--- SCORE BREAKDOWN ---');
      (report.scoreBreakdownTable || []).forEach(r => {
        lines.push(`  ${r.factor} (${r.weight}): Raw ${r.rawScore} -> ${r.contribution} pts  [${r.description}]`);
      });
      lines.push('');

      lines.push('--- VIOLATION DEDUCTIONS ---');
      (report.violationDeductions || []).filter(v => v.count > 0).forEach(v => {
        lines.push(`  ${v.type}: ${v.count} x -${v.ratePerIncident} = -${v.deduction} pts (max ${v.maxDeduction})  [${v.severity}]`);
      });
      lines.push(`  TOTAL: -${report.totalViolationDeduction || 0} pts`);
      lines.push('');

      lines.push('--- PER-QUESTION EVALUATION ---');
      (report.questionEvaluations || []).forEach(q => {
        lines.push(`Q${q.questionNumber}: ${q.question}`);
        lines.push(`  Status: ${q.answered ? 'Answered' : 'Skipped'}  Score: ${q.overallScore}/100  Words: ${q.wordCount}  Time: ${formatDuration(q.answerDuration)}`);
        if (q.answered) lines.push(`  Rel:${q.relevanceScore} Comp:${q.completenessScore} Clar:${q.clarityScore} Depth:${q.technicalDepthScore}`);
        if (q.isAiGenerated) lines.push(`  ⚠ AI-Generated (${q.aiConfidence}% confidence)`);
        lines.push('');
      });
    }

    lines.push('--- WEAKNESSES ---');
    (report.weaknesses || []).forEach(w => lines.push(`  - ${w}`));
    lines.push('');

    if ((report.improvementSuggestions || []).length > 0) {
      lines.push('--- IMPROVEMENT SUGGESTIONS ---');
      report.improvementSuggestions.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
      lines.push('');
    }

    if (report.overallAssessment) {
      lines.push('--- OVERALL ASSESSMENT ---');
      lines.push(report.overallAssessment);
    }
    lines.push('\nGenerated: ' + new Date().toLocaleString());

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-report-${interviewId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ===== LOADING / ERROR ===== */
  if (loading) return (
    <div className="report-loading">
      <div className="spinner"></div>
      <p>Generating your report...</p>
    </div>
  );

  if (error) return (
    <div className="report-error">
      <XCircle size={48} />
      <h2>Error Loading Report</h2>
      <p>{error}</p>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  if (!report) return null;

  const qEvals = report.questionEvaluations || [];
  const sbTable = report.scoreBreakdownTable || [];
  const vdTable = (report.violationDeductions || []).filter(v => v.count > 0);
  const enhEval = report.enhancedEvaluation || {};
  const tone = enhEval.toneAnalysis || {};

  /* ================================================================
     CANDIDATE VIEW — Simplified: score, weaknesses, improvements
     ================================================================ */
  if (!isRecruiter) {
    return (
      <div className="interview-report candidate-view">
        {/* Header */}
        <div className="report-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} /> Back
          </button>
          <div className="header-content">
            <FileText size={42} />
            <h1>Your Assessment Report</h1>
            {report.isMock && <span className="mock-badge">🎯 Practice Test</span>}
          </div>
          <button className="download-btn" onClick={downloadReport}>
            <Download size={20} /> Download
          </button>
        </div>

        {/* Score Summary */}
        <div className="candidate-score-hero" style={{ borderColor: clr(report.finalScore) }}>
          <Award size={56} style={{ color: clr(report.finalScore) }} />
          <div className="hero-score" style={{ color: clr(report.finalScore) }}>
            {report.finalScore}<span>/100</span>
          </div>
          <p className="hero-label">Final Score</p>
          <div className="hero-meta">
            <span><Target size={16} /> {report.completionRate}% completed</span>
            <span><Clock size={16} /> {report.duration || 0} min</span>
            <span><BookOpen size={16} /> {report.answeredQuestions}/{report.totalQuestions} answered</span>
          </div>
        </div>

        {/* Termination Warning */}
        {report.terminatedByViolation && (
          <div className="report-section" style={{ background: '#fff5f5', borderLeft: '4px solid #e74c3c' }}>
            <h2 style={{ color: '#c53030' }}>🚫 Interview Terminated</h2>
            <p style={{ color: '#c53030', margin: 0 }}>
              Your interview was automatically terminated due to excessive violations: <strong>{report.terminationReason}</strong>
            </p>
          </div>
        )}

        {/* Assessment Details */}
        <div className="report-section">
          <h2>📋 Assessment Details</h2>
          <div className="details-grid">
            <div className="detail-item"><span className="label">Stream:</span><span className="value">{report.stream}</span></div>
            <div className="detail-item"><span className="label">Difficulty:</span><span className={`value badge ${report.difficulty?.toLowerCase()}`}>{report.difficulty}</span></div>
            <div className="detail-item"><span className="label">Status:</span><span className={`value badge ${report.status}`}>{report.status}</span></div>
            <div className="detail-item"><span className="label">Date:</span><span className="value">{report.startTime ? new Date(report.startTime).toLocaleDateString() : 'N/A'}</span></div>
          </div>
        </div>

        {/* Overall Assessment */}
        {report.overallAssessment && (
          <div className="report-section assessment-section">
            <h2>📄 Overall Assessment</h2>
            <p className="assessment-text">{report.overallAssessment}</p>
          </div>
        )}

        {/* Strengths */}
        {(report.strengths || []).length > 0 && (
          <div className="report-section">
            <div className="strengths">
              <h3><CheckCircle size={20} /> Your Strengths</h3>
              <ul>{report.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {(report.weaknesses || []).length > 0 && (
          <div className="report-section">
            <div className="weaknesses">
              <h3><AlertTriangle size={20} /> Areas for Improvement</h3>
              <ul>{report.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {(report.improvementSuggestions || []).length > 0 && (
          <div className="report-section">
            <h2><TrendingUp size={22} /> How to Improve</h2>
            <ol className="suggestions-list">
              {report.improvementSuggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        )}

        {/* Simple question summary */}
        <div className="report-section">
          <h2>📝 Question Summary</h2>
          <div className="candidate-question-list">
            {qEvals.map((q, i) => (
              <div key={i} className={`candidate-q-item ${q.answered ? '' : 'skipped'}`}>
                <div className="cq-header">
                  <span className="cq-num">Q{q.questionNumber}</span>
                  <span className={`cq-status ${q.answered ? 'answered' : 'not-answered'}`}>
                    {q.answered ? <><CheckCircle size={14} /> Answered</> : <><XCircle size={14} /> Skipped</>}
                  </span>
                  <span className="cq-score" style={{ color: clr(q.overallScore) }}>{q.overallScore}/100</span>
                </div>
                <p className="cq-text">{q.question}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================
     RECRUITER VIEW — Full detailed report with all tables
     ================================================================ */
  return (
    <div className="interview-report recruiter-view">
      {/* Header */}
      <div className="report-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className="header-content">
          <FileText size={48} />
          <h1>Detailed Recruiter Report</h1>
          {report.isMock && <span className="mock-badge">🎯 Practice Test</span>}
        </div>
        <button className="download-btn" onClick={downloadReport}>
          <Download size={20} /> Download Report
        </button>
      </div>

      {/* Score Cards */}
      <div className="score-cards">
        <div className="score-card main-score" style={{ borderColor: clr(report.finalScore) }}>
          <Award size={32} style={{ color: clr(report.finalScore) }} />
          <h3>Final Score</h3>
          <div className="score-value" style={{ color: clr(report.finalScore) }}>
            {report.finalScore}<span>/100</span>
          </div>
        </div>
        <div className="score-card" style={{ borderColor: clr(report.integrityScore) }}>
          <Shield size={32} style={{ color: clr(report.integrityScore) }} />
          <h3>Integrity</h3>
          <div className="score-value" style={{ color: clr(report.integrityScore) }}>
            {report.integrityScore}<span>/100</span>
          </div>
        </div>
        <div className="score-card" style={{ borderColor: clr(report.completionRate) }}>
          <Target size={32} style={{ color: clr(report.completionRate) }} />
          <h3>Completion</h3>
          <div className="score-value" style={{ color: clr(report.completionRate) }}>
            {report.completionRate}<span>%</span>
          </div>
        </div>
        <div className="score-card">
          <Clock size={32} style={{ color: '#3498db' }} />
          <h3>Duration</h3>
          <div className="score-value" style={{ color: '#3498db' }}>
            {report.duration || 0}<span>min</span>
          </div>
        </div>
      </div>

      {/* Recommendation Banner */}
      {report.recommendation && report.recommendation !== 'N/A' && (
        <div className={`recommendation-banner rec-${report.recommendation.toLowerCase().replace(/\s+/g, '-')}`}>
          <span className="rec-label">AI Recommendation:</span>
          <span className="rec-value">{report.recommendation}</span>
          {report.aiConfidenceLevel > 0 && (
            <span className="rec-conf">({report.aiConfidenceLevel}% confidence)</span>
          )}
        </div>
      )}

      {/* Termination Banner */}
      {report.terminatedByViolation && (
        <div className="recommendation-banner rec-do-not-recommend" style={{ borderLeftWidth: '5px' }}>
          <span className="rec-label">🚫 TERMINATED:</span>
          <span className="rec-value">{report.terminationReason}</span>
          <span className="rec-conf">Interview was auto-terminated due to violation thresholds</span>
        </div>
      )}

      {/* Identity Verification Status */}
      {report.identityVerificationRequired && (
        <div className="recommendation-banner" style={{ 
          borderLeft: `5px solid ${report.identityVerificationCompleted ? '#28a745' : report.identityVerificationSkipped ? '#ffc107' : '#dc3545'}`,
          background: report.identityVerificationCompleted ? '#d4edda' : report.identityVerificationSkipped ? '#fff3cd' : '#f8d7da',
          padding: '12px 16px', marginBottom: '16px', borderRadius: '4px'
        }}>
          <span style={{ fontWeight: 'bold' }}>
            {report.identityVerificationCompleted ? '✅ Identity Verified' : 
             report.identityVerificationSkipped ? '⚠️ Identity Verification Skipped' : 
             '❌ Identity Not Verified'}
          </span>
          {report.identityVerificationData?.faceMatchScore && (
            <span style={{ marginLeft: '12px' }}>Match Score: {report.identityVerificationData.faceMatchScore}%</span>
          )}
          {report.identityVerificationSkipped && report.identityVerificationData?.skipReason && (
            <span style={{ display: 'block', fontSize: '13px', color: '#856404', marginTop: '4px' }}>
              Reason: {report.identityVerificationData.skipReason}
            </span>
          )}
        </div>
      )}

      {/* Candidate Info */}
      <div className="report-section">
        <h2>📋 Assessment Details</h2>
        <div className="details-grid">
          <div className="detail-item"><span className="label">Candidate:</span><span className="value">{report.candidateName}</span></div>
          <div className="detail-item"><span className="label">Email:</span><span className="value">{report.candidateEmail}</span></div>
          <div className="detail-item"><span className="label">Stream:</span><span className="value">{report.stream}</span></div>
          <div className="detail-item">
            <span className="label">Difficulty:</span>
            <span className={`value badge ${report.difficulty?.toLowerCase()}`}>{report.difficulty}</span>
          </div>
          <div className="detail-item">
            <span className="label">Status:</span>
            <span className={`value badge ${report.status}`}>{report.status}</span>
          </div>
          <div className="detail-item">
            <span className="label">Flagged:</span>
            <span className={`value ${report.flagged ? 'flagged' : 'clean'}`}>{report.flagged ? '⚠️ Yes' : '✓ No'}</span>
          </div>
        </div>
      </div>

      {/* ===== TABLE 1: SCORE BREAKDOWN ===== */}
      <div className="report-section">
        <h2>📊 Score Breakdown — How the Final Score Was Computed</h2>
        <p className="section-subtitle">Each evaluation factor is weighted and contributes to the final composite score.</p>
        <div className="table-wrapper">
          <table className="report-table score-table">
            <thead>
              <tr>
                <th>Evaluation Factor</th>
                <th>Weight</th>
                <th>Raw Score</th>
                <th>Contribution</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {sbTable.map((row, i) => (
                <tr key={i}>
                  <td className="factor-name">{row.factor}</td>
                  <td className="center">{row.weight}</td>
                  <td className="center">
                    <span className="mini-score" style={{ color: clr(row.rawScore) }}>{row.rawScore}</span>
                  </td>
                  <td className="center"><strong>{row.contribution}</strong> pts</td>
                  <td className="desc">{row.description}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={3}><strong>Computed Total</strong></td>
                <td className="center"><strong>{report.computedScore}</strong> pts</td>
                <td>Final score: <strong style={{ color: clr(report.finalScore) }}>{report.finalScore}/100</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== TABLE 2: VIOLATION DEDUCTIONS ===== */}
      <div className="report-section violation-section">
        <h2><AlertTriangle size={22} /> Violation Deduction Breakdown</h2>
        <p className="section-subtitle">Points deducted from the integrity component based on detected proctoring violations.</p>
        {vdTable.length === 0 ? (
          <div className="clean-badge"><CheckCircle size={20} /> No violations detected — Full integrity maintained</div>
        ) : (
          <div className="table-wrapper">
            <table className="report-table violation-table">
              <thead>
                <tr>
                  <th>Violation Type</th>
                  <th>Count</th>
                  <th>Rate / Incident</th>
                  <th>Deduction</th>
                  <th>Max Allowed</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {vdTable.map((v, i) => (
                  <tr key={i}>
                    <td className="viol-type">{v.type}</td>
                    <td className="center">{v.count}</td>
                    <td className="center">-{v.ratePerIncident} pts</td>
                    <td className="center deduction">-{v.deduction}</td>
                    <td className="center">-{v.maxDeduction}</td>
                    <td className="center">
                      <span className="severity-badge" style={{ background: sevClr(v.severity) }}>{v.severity}</span>
                    </td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={3}><strong>Total Points Deducted</strong></td>
                  <td className="center deduction"><strong>-{report.totalViolationDeduction}</strong></td>
                  <td className="center">-40 max</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== TABLE 3: PER-QUESTION EVALUATION WITH TIMING ===== */}
      <div className="report-section">
        <h2>📝 Per-Question Evaluation & Timing</h2>
        <p className="section-subtitle">
          Average Score: <strong style={{ color: clr(report.avgQuestionScore) }}>{report.avgQuestionScore}/100</strong>
          {' '}across {report.answeredQuestions} answered of {report.totalQuestions} total.
          Click any row to see full answer and scoring breakdown.
        </p>
        <div className="table-wrapper">
          <table className="report-table question-table">
            <thead>
              <tr>
                <th>Q#</th>
                <th>Question</th>
                <th>Status</th>
                <th>Time Taken</th>
                <th>Pace</th>
                <th>Overall</th>
                <th>Relevance</th>
                <th>Complete</th>
                <th>Clarity</th>
                <th>Depth</th>
                <th>Words</th>
                <th>AI?</th>
              </tr>
            </thead>
            <tbody>
              {qEvals.map((q, i) => (
                <React.Fragment key={i}>
                  <tr
                    className={`q-row ${!q.answered ? 'skipped' : ''} ${q.isAiGenerated ? 'ai-flagged' : ''}`}
                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="center">{q.questionNumber}</td>
                    <td className="q-text">
                      {q.question.length > 70 ? q.question.slice(0, 70) + '…' : q.question}
                      {expandedQ === i ? <ChevronUp size={14} className="chevron" /> : <ChevronDown size={14} className="chevron" />}
                    </td>
                    <td className="center">
                      {q.answered ? <CheckCircle size={16} color="#27ae60" /> : <XCircle size={16} color="#e74c3c" />}
                    </td>
                    <td className="center timing-cell">{formatDuration(q.answerDuration)}</td>
                    <td className="center">
                      {q.responseSpeed && q.responseSpeed !== 'N/A'
                        ? <span className={`pace-badge pace-${q.responseSpeed.toLowerCase().replace(/\s/g, '-')}`}>{q.responseSpeed}</span>
                        : '-'}
                    </td>
                    <td className="center">
                      <span className="mini-score" style={{ color: clr(q.overallScore) }}>{q.overallScore}</span>
                    </td>
                    <td className="center">{q.answered ? q.relevanceScore : '-'}</td>
                    <td className="center">{q.answered ? q.completenessScore : '-'}</td>
                    <td className="center">{q.answered ? q.clarityScore : '-'}</td>
                    <td className="center">{q.answered ? q.technicalDepthScore : '-'}</td>
                    <td className="center">{q.wordCount}</td>
                    <td className="center">
                      {q.isAiGenerated
                        ? <span className="ai-badge">⚠️ {q.aiConfidence}%</span>
                        : '✓'}
                    </td>
                  </tr>
                  {expandedQ === i && (
                    <tr className="expanded-row">
                      <td colSpan={12}>
                        <div className="expanded-content">
                          <div className="expanded-question"><strong>Full Question:</strong> {q.question}</div>
                          {q.answered ? (
                            <>
                              <div className="expanded-answer"><strong>Answer:</strong> {q.answer}</div>

                              {/* How This Score Was Calculated */}
                              <div className="score-calc-box">
                                <h4>📐 Detailed Marking Scheme & Score Breakdown</h4>

                                {/* Grading Legend */}
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', padding: '10px', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.85em' }}>
                                  <span style={{ fontWeight: 600 }}>Score Bands:</span>
                                  <span style={{ color: '#27ae60' }}>■ 80-100: Excellent</span>
                                  <span style={{ color: '#f39c12' }}>■ 60-79: Good</span>
                                  <span style={{ color: '#e67e22' }}>■ 40-59: Average</span>
                                  <span style={{ color: '#e74c3c' }}>■ 0-39: Poor</span>
                                </div>

                                <div className="expanded-metrics">
                                  {[
                                    { 
                                      label: 'Relevance', 
                                      val: q.relevanceScore, 
                                      weight: '25%',
                                      desc: 'How relevant the answer is to the question topic',
                                      criteria: q.relevanceScore >= 80 
                                        ? 'Directly addresses the question with highly relevant points and examples'
                                        : q.relevanceScore >= 60 
                                        ? 'Mostly on-topic but may include some tangential content'
                                        : q.relevanceScore >= 40
                                        ? 'Partially relevant — misses key aspects of the question'
                                        : 'Off-topic or largely irrelevant to what was asked'
                                    },
                                    { 
                                      label: 'Completeness', 
                                      val: q.completenessScore,
                                      weight: '25%',
                                      desc: 'Coverage of key concepts and expected points',
                                      criteria: q.completenessScore >= 80
                                        ? 'Covers all major concepts with thorough explanations and examples'
                                        : q.completenessScore >= 60
                                        ? 'Covers most key points but lacks some important details'
                                        : q.completenessScore >= 40
                                        ? 'Addresses some points but significant gaps in coverage'
                                        : 'Minimal coverage — most expected concepts are missing'
                                    },
                                    { 
                                      label: 'Clarity', 
                                      val: q.clarityScore,
                                      weight: '25%',
                                      desc: 'Structure, grammar, and readability of the response',
                                      criteria: q.clarityScore >= 80
                                        ? 'Well-structured, clear language, excellent grammar and logical flow'
                                        : q.clarityScore >= 60
                                        ? 'Generally clear with minor structural or grammatical issues'
                                        : q.clarityScore >= 40
                                        ? 'Somewhat unclear — disorganized or has notable grammatical errors'
                                        : 'Difficult to understand — poor structure and unclear expression'
                                    },
                                    { 
                                      label: 'Technical Depth', 
                                      val: q.technicalDepthScore,
                                      weight: '25%',
                                      desc: 'Depth of technical knowledge demonstrated',
                                      criteria: q.technicalDepthScore >= 80
                                        ? 'Demonstrates strong expertise with detailed technical insights and real-world application'
                                        : q.technicalDepthScore >= 60
                                        ? 'Shows good understanding with some technical detail'
                                        : q.technicalDepthScore >= 40
                                        ? 'Basic understanding — lacks deeper technical insight'
                                        : 'Superficial or inaccurate technical knowledge'
                                    },
                                  ].map(m => (
                                    <div className="metric-bar-group" key={m.label}>
                                      <div className="metric-info">
                                        <span className="metric-label">{m.label} <span style={{ fontWeight: 400, fontSize: '0.85em', color: '#888' }}>({m.weight})</span></span>
                                        <span className="metric-desc">{m.desc}</span>
                                      </div>
                                      <div className="metric-bar">
                                        <div style={{ width: barWidth(m.val), background: clr(m.val) }}></div>
                                      </div>
                                      <span className="metric-val">{m.val}/100</span>
                                      <div style={{ width: '100%', fontSize: '0.82em', color: '#555', fontStyle: 'italic', marginTop: '2px', paddingLeft: '4px' }}>
                                        → {m.criteria}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="score-formula" style={{ marginTop: '12px', padding: '12px', background: '#f0f4ff', borderRadius: '8px' }}>
                                  <strong>Formula:</strong> Overall = (Relevance × 25% + Completeness × 25% + Clarity × 25% + Depth × 25%)<br/>
                                  <span style={{ fontSize: '0.9em', color: '#555' }}>
                                    = ({q.relevanceScore} × 0.25) + ({q.completenessScore} × 0.25) + ({q.clarityScore} × 0.25) + ({q.technicalDepthScore} × 0.25)
                                  </span>
                                  <br/>
                                  <strong style={{ color: clr(q.overallScore), fontSize: '1.1em' }}>= {q.overallScore}/100</strong>
                                  {' '}<span style={{ fontSize: '0.85em', color: '#888' }}>
                                    ({q.overallScore >= 80 ? 'Excellent' : q.overallScore >= 60 ? 'Good' : q.overallScore >= 40 ? 'Average' : 'Poor'})
                                  </span>
                                </div>
                              </div>

                              {/* Timing Info */}
                              <div className="timing-info-box">
                                <h4><Timer size={16} /> Timing Details</h4>
                                <div className="timing-details">
                                  <span>Time taken: <strong>{formatDuration(q.answerDuration)}</strong></span>
                                  <span>Pace: <strong>{q.responseSpeed || 'N/A'}</strong></span>
                                  <span>Word count: <strong>{q.wordCount}</strong></span>
                                  {q.wordCount > 0 && q.answerDuration > 0 && (
                                    <span>Speed: <strong>{Math.round(q.wordCount / (q.answerDuration / 60))} words/min</strong></span>
                                  )}
                                </div>
                              </div>

                              {q.isAiGenerated && (
                                <div className="ai-warning-box">
                                  ⚠️ <strong>AI-Generated Answer Detected</strong> — Confidence: {q.aiConfidence}%. This answer was flagged for potential AI assistance.
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="expanded-skipped">⚠️ This question was not answered (skipped). Score: 0.</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== CANDIDATE RESPONSES SECTION ===== */}
      <div className="report-section">
        <h2>💬 Candidate Responses</h2>
        <p className="section-subtitle">Full answers given by the candidate for each question during the assessment.</p>
        <div className="candidate-responses-list">
          {qEvals.map((q, i) => (
            <div key={i} className={`response-card ${!q.answered ? 'response-skipped' : ''}`}>
              <div className="response-card-header">
                <span className="response-q-num">Q{q.questionNumber}</span>
                <span className="response-q-text">{q.question}</span>
                <div className="response-meta">
                  {q.answered ? (
                    <>
                      <span className="response-badge answered">Answered</span>
                      <span className="response-score" style={{ color: clr(q.overallScore) }}>{q.overallScore}/100</span>
                      {q.wordCount > 0 && <span className="response-words">{q.wordCount} words</span>}
                      {q.answerDuration > 0 && <span className="response-time">{formatDuration(q.answerDuration)}</span>}
                    </>
                  ) : (
                    <span className="response-badge skipped">Not Answered</span>
                  )}
                  {q.isAiGenerated && (
                    <span className="response-badge ai-flagged">⚠️ AI Detected ({q.aiConfidence}%)</span>
                  )}
                </div>
              </div>
              {q.answered ? (
                <div className="response-answer-text">{q.answer}</div>
              ) : (
                <div className="response-answer-empty">— No answer provided —</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tone & Communication */}
      {tone.professionalism != null && (
        <div className="report-section">
          <h2>🗣️ Communication & Tone Analysis</h2>
          <div className="tone-grid">
            {['professionalism', 'confidence', 'clarity', 'articulation'].map(k => (
              tone[k] != null && (
                <div key={k} className="tone-card">
                  <h4>{k.charAt(0).toUpperCase() + k.slice(1)}</h4>
                  <div className="tone-circle" style={{ borderColor: clr(tone[k] || 0) }}>
                    <span style={{ color: clr(tone[k] || 0) }}>{tone[k] || 0}</span>
                  </div>
                </div>
              )
            ))}
          </div>
          {tone.overallTone && <p className="tone-overall">Overall Tone: <strong>{tone.overallTone}</strong></p>}
        </div>
      )}

      {/* Integrity Monitoring Visual */}
      <div className="report-section malpractice-section">
        <h2><Shield size={22} /> Integrity Monitoring Summary</h2>
        <div className="malpractice-grid">
          <div className="malpractice-stat">
            <EyeOff size={20} />
            <span className="count">{report.noFaceDetected || 0}</span>
            <span className="label">No Face</span>
          </div>
          <div className="malpractice-stat">
            <Users size={20} />
            <span className="count">{report.multipleFacesDetected || 0}</span>
            <span className="label">Multi Face</span>
          </div>
          <div className="malpractice-stat">
            <Eye size={20} />
            <span className="count">{report.lookingAwayDetected || 0}</span>
            <span className="label">Looking Away</span>
          </div>
          <div className="malpractice-stat">
            <MonitorOff size={20} />
            <span className="count">{report.tabSwitches || 0}</span>
            <span className="label">Tab Switches</span>
          </div>
          <div className="malpractice-stat">
            <Mic size={20} />
            <span className="count">{report.voiceChanges || 0}</span>
            <span className="label">Voice Anomaly</span>
          </div>
          <div className="malpractice-stat">
            <Bot size={20} />
            <span className="count">{report.aiDetections || 0}</span>
            <span className="label">AI Answers</span>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="report-section">
        <div className="strengths-weaknesses">
          {(report.strengths || []).length > 0 && (
            <div className="strengths">
              <h3><CheckCircle size={20} /> Strengths</h3>
              <ul>{report.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {(report.weaknesses || []).length > 0 && (
            <div className="weaknesses">
              <h3><AlertTriangle size={20} /> Areas for Improvement</h3>
              <ul>{report.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
        </div>
      </div>

      {/* Overall Assessment */}
      {report.overallAssessment && (
        <div className="report-section assessment-section">
          <h2>📄 Overall Assessment</h2>
          <p className="assessment-text">{report.overallAssessment}</p>
        </div>
      )}

      {/* Improvement Suggestions */}
      {(report.improvementSuggestions || []).length > 0 && (
        <div className="report-section">
          <h2><TrendingUp size={22} /> Improvement Suggestions</h2>
          <ol className="suggestions-list">
            {report.improvementSuggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}
