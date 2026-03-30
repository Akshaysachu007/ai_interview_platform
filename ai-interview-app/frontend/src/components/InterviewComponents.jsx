// Reusable UI Components for AI Interview
import React from 'react';

/**
 * Question Card Component
 */
export const QuestionCard = ({ 
  question, 
  questionIndex, 
  totalQuestions, 
  onReadAloud, 
  isReading 
}) => (
  <div className="question-card">
    <div className="question-header">
      <span className="question-number">
        Question {questionIndex + 1} of {totalQuestions}
      </span>
      <span className="question-category">{question?.category || 'Technical'}</span>
    </div>
    <div className="question-text">{question?.question}</div>
    <div className="voice-controls">
      <button 
        className="btn-voice"
        onClick={onReadAloud}
        disabled={isReading}
      >
        {isReading ? '🔊 Speaking...' : '🔊 Read Aloud'}
      </button>
      {isReading && <button className="btn-voice-stop">🛑 Stop</button>}
    </div>
  </div>
);


/**
 * Answer Section Component
 */
export const AnswerSection = ({
  answer,
  setAnswer,
  isListening,
  interimTranscript,
  voiceAvailable,
  onStartVoice,
  onStopVoice,
  loading,
  onSubmit,
  onSkip,
  onPrevious,
  onComplete
}) => (
  <div className="answer-section">
    <div className="answer-header">
      <h3>Your Answer</h3>
      
      {voiceAvailable && (
        <div className="voice-input-controls">
          {!isListening ? (
            <button className="btn-microphone" onClick={onStartVoice}>
              🎤 Start Voice
            </button>
          ) : (
            <>
              <button className="btn-microphone-stop" onClick={onStopVoice}>
                🔴 Stop
              </button>
              <span className="listening-indicator">
                <span className="pulse-dot"></span> Listening...
              </span>
            </>
          )}
        </div>
      )}
    </div>

    <textarea
      className="answer-textarea"
      value={answer}
      onChange={(e) => setAnswer(e.target.value)}
      placeholder="Type or speak your answer..."
      rows="8"
      disabled={loading}
    />

    {isListening && interimTranscript && (
      <div className="interim-transcript">
        <strong>🎙️ Hearing:</strong> {interimTranscript}
        <span className="cursor-blink"></span>
      </div>
    )}

    <div className="answer-actions">
      <button
        className="btn btn-submit"
        onClick={onSubmit}
        disabled={loading || !answer.trim()}
      >
        {loading ? '⏳ Submitting...' : '✅ Submit'}
      </button>
      <button className="btn btn-skip" onClick={onSkip} disabled={loading}>
        ⏭️ Skip
      </button>
      <button className="btn btn-previous" onClick={onPrevious} disabled={loading}>
        ⬅️ Previous
      </button>
      <button className="btn btn-complete" onClick={onComplete} disabled={loading}>
        🏁 Complete
      </button>
    </div>
  </div>
);


/**
 * Face Monitoring Component
 */
export const FaceMonitor = ({ videoRef, canvasRef, faceMetrics, webcamActive }) => {
  const faceStatus = faceMetrics?.face_count ?? 0;
  const isViolation = !faceMetrics?.face_detected || faceStatus !== 1;

  return (
    <div className="face-monitor">
      <div className="webcam-display">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-feed"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Status Overlay */}
        <div className={`webcam-status ${faceStatus === 1 ? 'good' : 'warning'}`}>
          {webcamActive ? (
            <>
              <span className="live-indicator">🔴 LIVE</span>
              {faceStatus === 1 ? (
                <><span className="status-icon">✓</span> Face OK</>
              ) : faceStatus === 0 ? (
                <><span className="status-icon">⚠️</span> No Face</>
              ) : (
                <><span className="status-icon">⚠️</span> Multiple ({faceStatus})</>
              )}
            </>
          ) : (
            <><span className="status-icon">📷</span> Initializing...</>
          )}
        </div>

        {/* Violation Banner */}
        {isViolation && webcamActive && (
          <div className="violation-banner">
            <div className="violation-banner-icon">🚨</div>
            <div className="violation-banner-text">
              <strong>
                {faceStatus === 0 ? 'NO FACE' : 'MULTIPLE FACES'}
              </strong>
              <div>
                {faceStatus === 0
                  ? 'Position yourself in front of the camera'
                  : `Only you should be visible (${faceStatus} found)`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


/**
 * Proctoring Stats Component
 */
export const ProctorStats = ({ faceMetrics, malpractices }) => (
  <div className="proctoring-stats">
    <h3>🚨 Proctoring Status</h3>

    <div className="stats-grid">
      <div className="stat-item">
        <div className="stat-icon">👤</div>
        <div className="stat-label">Face Status</div>
        <div className={`stat-value ${faceMetrics?.face_count !== 1 ? 'warning' : ''}`}>
          {faceMetrics?.face_count === 1 ? 'OK' : 'Violation'}
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-icon">👀</div>
        <div className="stat-label">Gaze</div>
        <div className={`stat-value ${faceMetrics?.looking_away ? 'warning' : ''}`}>
          {faceMetrics?.gaze_direction || '-'}
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-icon">😊</div>
        <div className="stat-label">Emotion</div>
        <div className="stat-value">{faceMetrics?.emotion || '-'}</div>
      </div>

      <div className="stat-item">
        <div className="stat-icon">🔄</div>
        <div className="stat-label">Tab Switches</div>
        <div className={`stat-value ${malpractices.tabSwitches > 0 ? 'warning' : ''}`}>
          {malpractices.tabSwitches}
        </div>
      </div>
    </div>

    {malpractices.warnings.length > 0 && (
      <div className="warnings-list">
        <h4>⚠️ Warnings</h4>
        {malpractices.warnings.slice(-3).map((w, i) => (
          <div key={i} className="warning-item">
            <span className="warning-dot"></span>
            {w}
          </div>
        ))}
      </div>
    )}
  </div>
);


/**
 * Results Card Component
 */
export const ResultsCard = ({ results }) => (
  <div className="results-card">
    <div className="score-display">
      <div className="score-value">{results.score}/100</div>
      <div className="score-label">Final Score</div>
    </div>

    <div className="results-details">
      <div className="detail-item">
        <span className="detail-label">Status:</span>
        <span className={`detail-value status-${results.status}`}>
          {results.status.toUpperCase()}
        </span>
      </div>
      <div className="detail-item">
        <span className="detail-label">Duration:</span>
        <span className="detail-value">{results.duration} min</span>
      </div>
    </div>

    {results.flagged && (
      <div className="flagged-notice">
        🚩 Job flagged for review
      </div>
    )}
  </div>
);


/**
 * Interview Setup Component
 */
export const InterviewSetup = ({
  streams,
  difficulties,
  stream,
  setStream,
  difficulty,
  setDifficulty,
  onStart,
  onStats,
  loading,
  isFromAccepted
}) => (
  <div className="setup-section">
    <h2>Start Your Assessment</h2>

    {isFromAccepted && (
      <div style={{
        padding: '15px',
        background: '#d4edda',
        color: '#155724',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <strong>✅ Accepted Job</strong>
        <p>Settings locked by recruiter</p>
      </div>
    )}

    <div className="form-group">
      <label>Stream:</label>
      <select
        value={stream}
        onChange={(e) => setStream(e.target.value)}
        disabled={isFromAccepted}
      >
        {streams.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>

    <div className="form-group">
      <label>Difficulty:</label>
      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        disabled={isFromAccepted}
      >
        {difficulties.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>

    <button className="btn btn-primary" onClick={onStart} disabled={loading}>
      {loading ? '⏳ Starting...' : '🚀 Start Assessment'}
    </button>

    {!isFromAccepted && (
      <button className="btn btn-secondary" onClick={onStats} disabled={loading}>
        📊 Statistics
      </button>
    )}
  </div>
);
