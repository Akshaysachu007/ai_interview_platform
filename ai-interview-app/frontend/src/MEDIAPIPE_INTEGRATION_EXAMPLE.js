/**
 * Example: How to Integrate MediaPipe JS Face Detection into AIInterview.jsx
 * 
 * This file shows how to wire up the new useMediaPipeJS hook
 * into your existing interview component
 */

import { useMediaPipeJS } from '../hooks/useMediaPipeJS';

// ============================================
// IN YOUR AIInterview.jsx COMPONENT
// ============================================

export const ExampleAIInterview = () => {
  // Initialize face detection hook
  const {
    videoRef,
    canvasRef,
    faceMetrics,
    error: faceError,
    loading: faceLoading,
    isAnalyzing,
    stopWebcam,
    resetMetrics
  } = useMediaPipeJS();

  // --------------------------------
  // Track violations during interview
  // --------------------------------
  const handleViolation = (violationType) => {
    console.log(`⚠️ Violation detected: ${violationType}`);
    // Update your malpractices state
    // setMalpractices(prev => ({
    //   ...prev,
    //   faceViolations: prev.faceViolations + 1,
    //   warnings: [...prev.warnings, `${violationType} at ${new Date().toLocaleTimeString()}`]
    // }));
  };

  // --------------------------------
  // Log metrics to backend
  // --------------------------------
  const logMetricsToBackend = async (interviewId) => {
    if (!faceMetrics) return;

    try {
      await fetch('http://localhost:8000/log/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_id: interviewId,
          metrics: faceMetrics,
          session_start: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Failed to log metrics:', err);
    }
  };

  // --------------------------------
  // Monitor violations
  // --------------------------------
  useEffect(() => {
    if (faceMetrics?.violations && faceMetrics.violations.length > 0) {
      faceMetrics.violations.forEach(violation => {
        if (violation === 'Looking Away') {
          handleViolation(violation);
        } else if (violation === 'Frequent Blinking') {
          handleViolation(violation);
        }
      });
    }
  }, [faceMetrics?.violations]);

  // --------------------------------
  // Render video and metrics
  // --------------------------------
  return (
    <div className="interview-container">
      {/* Left: Video + Metrics */}
      <div className="interview-left">
        {faceLoading ? (
          <div>Loading face detection...</div>
        ) : faceError ? (
          <div style={{ color: 'red' }}>❌ {faceError}</div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                borderRadius: '8px',
                border: faceMetrics?.face_detected ? '3px solid green' : '3px solid gray'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Face Metrics Display */}
            {faceMetrics && (
              <div className="metrics-panel">
                <h3>📊 Face Analysis</h3>
                
                {!faceMetrics.face_detected ? (
                  <p style={{ color: 'orange', fontWeight: 'bold' }}>
                    ⚠️ No face detected - Please adjust camera
                  </p>
                ) : (
                  <>
                    <p>✅ Face Detected (Confidence: {faceMetrics.emotion?.confidence?.toFixed(1)}%)</p>
                    
                    <details>
                      <summary>Head Position</summary>
                      <p>Yaw: {faceMetrics.head_pose?.yaw?.toFixed(2)}°</p>
                      <p>Pitch: {faceMetrics.head_pose?.pitch?.toFixed(2)}°</p>
                    </details>

                    <details>
                      <summary>Eye Metrics</summary>
                      <p>Blink Rate: {faceMetrics.eye_metrics?.blink_rate?.toFixed(1)} bpm</p>
                      <p>Eye Aspect Ratio: {faceMetrics.eye_metrics?.eye_aspect_ratio?.toFixed(3)}</p>
                    </details>

                    {faceMetrics.violations?.length > 0 && (
                      <div style={{ 
                        padding: '10px', 
                        backgroundColor: '#fff3cd', 
                        borderRadius: '4px',
                        marginTop: '10px'
                      }}>
                        <strong>⚠️ Active Violations:</strong>
                        <ul>
                          {faceMetrics.violations.map((v, i) => (
                            <li key={i}>{v}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right: Interview Questions/Answers */}
      <div className="interview-right">
        {/* Your existing interview UI */}
        {/* Questions, answers, timer, etc. */}
      </div>
    </div>
  );
};

// ============================================
// COMPLETE IMPLEMENTATION EXAMPLE
// ============================================

export const CompleteAIInterviewExample = () => {
  const [interviewId, setInterviewId] = useState(null);
  const [violations, setViolations] = useState([]);
  const [interviewActive, setInterviewActive] = useState(true);

  // Initialize face detection
  const {
    videoRef,
    faceMetrics,
    error: faceError,
    loading: faceLoading,
    stopWebcam
  } = useMediaPipeJS();

  // --------------------------------
  // Track violations
  // --------------------------------
  useEffect(() => {
    if (!faceMetrics?.violations) return;

    const newViolations = faceMetrics.violations.filter(
      v => !violations.some(existing => existing.type === v)
    );

    if (newViolations.length > 0) {
      newViolations.forEach(violation => {
        setViolations(prev => [...prev, {
          type: violation,
          timestamp: new Date(),
          count: 1
        }]);

        // Log to backend
        logViolation(interviewId, violation);
      });
    }
  }, [faceMetrics?.violations]);

  // --------------------------------
  // Log functions
  // --------------------------------
  const logViolation = async (interviewId, violationType) => {
    try {
      await fetch('http://localhost:8000/log/violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_id: interviewId,
          violation: violationType
        })
      });
    } catch (err) {
      console.error('Failed to log violation:', err);
    }
  };

  const getAnalyticsSummary = async (interviewId) => {
    try {
      const response = await fetch(`http://localhost:8000/analyze/summary?interview_id=${interviewId}`, {
        method: 'POST'
      });
      const data = await response.json();
      console.log('📊 Analytics:', data);
      return data;
    } catch (err) {
      console.error('Failed to get analytics:', err);
    }
  };

  // --------------------------------
  // Cleanup on unmount
  // --------------------------------
  useEffect(() => {
    return () => {
      if (!interviewActive) {
        stopWebcam();
      }
    };
  }, [interviewActive, stopWebcam]);

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      {/* Left: Face Detection */}
      <div style={{ flex: 1 }}>
        <h2>Face Detection</h2>
        
        {faceLoading && <div>Loading models...</div>}
        {faceError && <div style={{ color: 'red' }}>Error: {faceError}</div>}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            borderRadius: '8px',
            background: '#000'
          }}
        />

        {faceMetrics && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px',
            background: faceMetrics.face_detected ? '#e8f5e9' : '#ffebee',
            borderRadius: '4px'
          }}>
            <p>
              {faceMetrics.face_detected ? '✅' : '❌'} 
              {' Face: ' + (faceMetrics.face_detected ? 'Detected' : 'Not Detected')}
            </p>
            {faceMetrics.face_detected && (
              <>
                <p>Confidence: {faceMetrics.emotion?.confidence?.toFixed(1)}%</p>
                <p>Yaw: {faceMetrics.head_pose?.yaw?.toFixed(2)}° | Pitch: {faceMetrics.head_pose?.pitch?.toFixed(2)}°</p>
                {faceMetrics.violations.length > 0 && (
                  <p style={{ color: 'red' }}>Violations: {faceMetrics.violations.join(', ')}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Interview Content */}
      <div style={{ flex: 1 }}>
        <h2>Interview Questions</h2>
        {/* Your question UI here */}
        
        <h3>Violations Tracked ({violations.length})</h3>
        <ul>
          {violations.map((v, i) => (
            <li key={i}>{v.type} - {v.timestamp.toLocaleTimeString()}</li>
          ))}
        </ul>

        <button onClick={() => getAnalyticsSummary(interviewId)}>
          Get Analytics Summary
        </button>
      </div>
    </div>
  );
};

// ============================================
// HOW TO ADD TO EXISTING AIInterview
// ============================================

/**
 * In your AIInterview.jsx:
 * 
 * 1. Import the hook:
 *    import { useMediaPipeJS } from '../hooks/useMediaPipeJS';
 * 
 * 2. Initialize in component:
 *    const { videoRef, faceMetrics, error, loading } = useMediaPipeJS();
 * 
 * 3. Add video element:
 *    <video ref={videoRef} autoPlay playsInline muted />
 * 
 * 4. Monitor violations:
 *    useEffect(() => {
 *      if (faceMetrics?.violations?.length > 0) {
 *        // Handle violations
 *        setMalpractices(prev => ({
 *          ...prev,
 *          faceViolations: prev.faceViolations + faceMetrics.violations.length
 *        }));
 *      }
 *    }, [faceMetrics?.violations]);
 * 
 * 5. Cleanup on unmount:
 *    useEffect(() => {
 *      return () => {
 *        stopWebcam();
 *      };
 *    }, [stopWebcam]);
 */
