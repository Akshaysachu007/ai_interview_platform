import React from "react";
import "./FaceMetricsMonitor.css";

const FaceAnalyzerContainer = ({ faceMetrics, webcamActive, videoRef }) => {
  if (!faceMetrics) {
    return (
      <div className="face-metrics-container">
        <div className="status-loading">
          <div style={{ padding: '20px' }}>
            <h3>📹 Face Detection System</h3>
            <p><strong>Status:</strong> ⏳ Initializing...</p>
            <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
              <p>🔄 Loading MediaPipe models...</p>
              <p>🎬 Webcam: {webcamActive ? '✅ Active' : '⏳ Starting'}</p>
              <p>📹 Video Element: {videoRef?.current ? '✅ Connected' : '⏳ Waiting'}</p>
              {videoRef?.current && (
                <p>🔊 Video Ready: {videoRef.current.readyState >= 2 ? '✅ Yes' : '⏳ No (readyState=' + videoRef.current.readyState + ')'}</p>
              )}
              <p style={{ marginTop: '10px', fontStyle: 'italic' }}>Please wait while models load. This may take 10-20 seconds on first load.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to determine head position text
  const getHeadPositionText = (yaw, pitch, sidewaysOffset) => {
    const positions = [];
    if (Math.abs(yaw) > 15) positions.push(yaw > 0 ? '➡️ Turned Right' : '⬅️ Turned Left');
    if (Math.abs(pitch) > 10) positions.push(pitch > 0 ? '⬇️ Down' : '⬆️ Up');
    if (sidewaysOffset !== undefined && Math.abs(sidewaysOffset) > 25) {
      positions.push(sidewaysOffset > 0 ? '↗️ Shifted Right' : '↖️ Shifted Left');
    }
    return positions.length > 0 ? positions.join(', ') : '✅ Centered';
  };

  // Emotion emoji mapping
  const emotionEmoji = {
    happy: '😊',
    surprised: '😮',
    sad: '😢',
    angry: '😠',
    focused: '🧐',
    confused: '🤔',
    neutral: '😐'
  };

  return (
    <div className="face-metrics-container">
      {/* Face Detection Status */}
      <div className={`face-status ${faceMetrics.face_detected ? 'detected' : 'not-detected'}`}>
        <div className="status-header">
          {faceMetrics.face_detected ? (
            <>
              <span className="status-icon">✅</span>
              <span className="status-text">Face Detected</span>
            </>
          ) : (
            <>
              <span className="status-icon">❌</span>
              <span className="status-text">No Face Detected</span>
            </>
          )}
        </div>
        {faceMetrics.face_count > 0 && (
          <div className="face-count">
            {faceMetrics.face_count === 1 ? (
              <span className="badge badge-success">1 Face ✓</span>
            ) : (
              <span className="badge badge-error">{faceMetrics.face_count} Faces - VIOLATION!</span>
            )}
          </div>
        )}
      </div>

      {faceMetrics.face_detected && (
        <>
          {/* Head Position & Movement */}
          <div className="metric-section">
            <h4>🧭 Head Position & Movement</h4>
            <div className="metric-grid">
              <div className="metric-item">
                <span className="label">Turn (Yaw):</span>
                <span className={`value ${Math.abs(faceMetrics.head_pose.yaw) > 25 ? 'warning' : 'normal'}`}>
                  {faceMetrics.head_pose.yaw}°
                </span>
              </div>
              <div className="metric-item">
                <span className="label">Tilt (Pitch):</span>
                <span className={`value ${Math.abs(faceMetrics.head_pose.pitch) > 20 ? 'warning' : 'normal'}`}>
                  {faceMetrics.head_pose.pitch}°
                </span>
              </div>
              <div className="metric-item">
                <span className="label">Roll:</span>
                <span className="value">{faceMetrics.head_pose.roll}°</span>
              </div>
              {faceMetrics.head_pose.sidewaysOffset !== undefined && (
                <div className="metric-item">
                  <span className="label">Sideways:</span>
                  <span className={`value ${Math.abs(faceMetrics.head_pose.sidewaysOffset) > 40 ? 'warning' : 'normal'}`}>
                    {faceMetrics.head_pose.sidewaysOffset > 25 ? '→ Right' :
                     faceMetrics.head_pose.sidewaysOffset < -25 ? '← Left' : '✓ Center'}
                    <span style={{ fontSize: '11px', opacity: 0.7 }}> ({faceMetrics.head_pose.sidewaysOffset})</span>
                  </span>
                </div>
              )}
              <div className="metric-item">
                <span className="label">Position:</span>
                <span className="value position-indicator">
                  {getHeadPositionText(faceMetrics.head_pose.yaw, faceMetrics.head_pose.pitch, faceMetrics.head_pose.sidewaysOffset)}
                </span>
              </div>
            </div>
          </div>

          {/* Eye Metrics */}
          <div className="metric-section">
            <h4>👁️ Eye Activity & Focus</h4>
            <div className="metric-grid">
              <div className="metric-item">
                <span className="label">Blink Rate:</span>
                <span className={`value ${faceMetrics.eye_metrics.blink_rate > 25 ? 'warning' : 'normal'}`}>
                  {faceMetrics.eye_metrics.blink_rate.toFixed(1)} /min
                </span>
              </div>
              <div className="metric-item">
                <span className="label">Eye Status:</span>
                <span className="value">
                  {(faceMetrics.eye_metrics.eye_status === 'open' || (!faceMetrics.eye_metrics.eye_status && faceMetrics.eye_metrics.eye_aspect_ratio > 0.22))
                    ? "👀 Open"
                    : faceMetrics.eye_metrics.eye_status === 'squinting'
                      ? "😑 Squinting"
                      : "😴 Closed"}
                </span>
              </div>
              <div className="metric-item">
                <span className="label">Gaze:</span>
                <span className={`value gaze-indicator ${faceMetrics.eye_metrics.gaze_direction !== 'center' ? 'warning' : ''}`}>
                  {(() => {
                    const gaze = faceMetrics.eye_metrics.gaze_direction;
                    if (gaze === 'center') return '✅ On Screen';
                    if (gaze === 'left') return '⬅️ Looking Left';
                    if (gaze === 'right') return '➡️ Looking Right';
                    if (gaze === 'up') return '⬆️ Looking Up';
                    if (gaze === 'down') return '⬇️ Looking Down';
                    if (gaze === 'left-up') return '↖️ Left & Up';
                    if (gaze === 'left-down') return '↙️ Left & Down';
                    if (gaze === 'right-up') return '↗️ Right & Up';
                    if (gaze === 'right-down') return '↘️ Right & Down';
                    return '❓ ' + gaze;
                  })()}
                </span>
              </div>
              <div className="metric-item">
                <span className="label">EAR Score:</span>
                <span className="value">{(faceMetrics.eye_metrics.eye_aspect_ratio * 100).toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Emotion & Expression */}
          <div className="metric-section">
            <h4>😊 Emotion & Expression</h4>
            <div className="metric-grid">
              <div className="metric-item emotion-item">
                <span className="label">Emotion:</span>
                <span className="value emotion">
                  <span className="emotion-emoji">
                    {emotionEmoji[faceMetrics.emotion.emotion] || '😐'}
                  </span>
                  <span className="emotion-name">
                    {faceMetrics.emotion.emotion.charAt(0).toUpperCase() + faceMetrics.emotion.emotion.slice(1)}
                  </span>
                  <span className="confidence-badge">{faceMetrics.emotion.confidence}%</span>
                </span>
              </div>
              <div className="metric-item">
                <span className="label">Mouth:</span>
                <span className="value">
                  {faceMetrics.emotion.mouth_open ? "😮 Open" : "😐 Closed"}
                </span>
              </div>
              <div className="metric-item">
                <span className="label">Confidence:</span>
                <span className="value">{Math.round(faceMetrics.confidence)}%</span>
              </div>
            </div>
            {/* Emotion detail bars */}
            {faceMetrics.emotion.details && (
              <div className="emotion-details" style={{ marginTop: '8px' }}>
                {Object.entries(faceMetrics.emotion.details).map(([name, value]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', fontSize: '12px' }}>
                    <span style={{ width: '65px', textTransform: 'capitalize', color: '#aaa' }}>
                      {emotionEmoji[name] || '•'} {name}
                    </span>
                    <div style={{ flex: 1, height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(value, 100)}%`,
                        height: '100%',
                        background: faceMetrics.emotion.emotion === name ? '#4ade80' : '#6b7280',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{ width: '30px', textAlign: 'right', color: '#aaa' }}>{value}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Violations Alert */}
          {faceMetrics.violations && faceMetrics.violations.length > 0 && (
            <div className="violations-section alert alert-danger">
              <h4>⚠️ Alert - Violations Detected</h4>
              <div className="violations-list">
                {faceMetrics.violations.map((violation, i) => (
                  <div key={`violation-${i}`} className="violation-item">
                    <span className="violation-icon">⚠️</span>
                    <span className="violation-text">{violation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="status-indicator">
            <span className="live-dot"></span> 
            <span>Live Monitoring Active</span>
            <span className="timestamp">{new Date(faceMetrics.timestamp).toLocaleTimeString()}</span>
          </div>
        </>
      )}

      {!faceMetrics.face_detected && (
        <div className="no-face-message">
          <div className="message-icon">📷</div>
          <div className="message-text">
            Please position your face in front of the camera
          </div>
          {faceMetrics.violations && faceMetrics.violations.map((v, i) => (
            <div key={i} className="violation-badge error">{v}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FaceAnalyzerContainer;

