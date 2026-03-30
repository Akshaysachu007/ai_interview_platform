import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import './IdentityVerification.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const IdentityVerification = ({ interviewId, onVerificationComplete }) => {
  // Steps: 'loading' -> 'verify' -> 'matching' -> 'result' (or 'no-photo' if no application photo)
  const [step, setStep] = useState('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [referencePhoto, setReferencePhoto] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [failCount, setFailCount] = useState(0);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceModelRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const webcamActiveRef = useRef(false);

  const token = localStorage.getItem('candidateToken');
  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // Keep ref in sync
  useEffect(() => { webcamActiveRef.current = webcamActive; }, [webcamActive]);

  // Initialize on mount
  useEffect(() => {
    let cancelled = false;
    
    const init = async () => {
      // Load BlazeFace in background — don't block on it (CDN can timeout for 30+ seconds)
      loadFaceModel();
      
      const statusData = await checkStatus();
      
      if (cancelled) return;
      if (!statusData) return;
      
      if (statusData.verificationCompleted) {
        setStep('result');
        setMatchResult('pass');
        setMessage('Identity already verified!');
        setTimeout(() => onVerificationComplete?.(), 1000);
        return;
      }
      
      if (!statusData.verificationRequired) {
        setMessage('Verification not required');
        setTimeout(() => onVerificationComplete?.(), 500);
        return;
      }
      
      if (statusData.hasReferencePhoto && statusData.referencePhoto) {
        setReferencePhoto(statusData.referencePhoto);
        setStep('verify');
      } else {
        // No application photo — skip verification and proceed
        setStep('no-photo');
        setTimeout(() => onVerificationComplete?.(), 1500);
      }
    };
    
    init();
    
    return () => {
      cancelled = true;
      stopWebcam();
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    };
  }, [interviewId]);

  // Auto-start webcam when step changes to 'verify'
  useEffect(() => {
    if (step === 'verify' && !webcamActiveRef.current) {
      startWebcam();
    }
  }, [step]);

  // Assign stream to video element once webcamActive state causes <video> to render
  useEffect(() => {
    if (webcamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadeddata = () => {
        console.log('✅ IV: Video data loaded, starting face detection');
        startFaceDetection();
      };
    }
  }, [webcamActive]);

  const loadFaceModel = async () => {
    try {
      await tf.ready();
      const model = await blazeface.load();
      faceModelRef.current = model;
      console.log('Face detection model loaded for verification');
    } catch (err) {
      console.warn('⚠️ BlazeFace model failed to load (CDN unreachable). Face detection disabled, capture still allowed.', err.message);
      // Model failed to load — allow capture without client-side face detection
      // Backend will do real face matching validation anyway
      faceModelRef.current = null;
      setFaceDetected(true);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await api.get(`/identity-verification/status/${interviewId}`);
      return response.data;
    } catch (err) {
      setError('Failed to check verification status');
      console.error(err);
      return null;
    }
  };

  const startWebcam = async () => {
    if (webcamActiveRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      // Save stream to ref first, then set state — useEffect will assign srcObject
      streamRef.current = stream;
      setWebcamActive(true);
      webcamActiveRef.current = true;
    } catch (err) {
      console.error('Webcam error:', err);
      setError('Could not access camera. Please allow camera permissions.');
    }
  };

  const stopWebcam = () => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
    webcamActiveRef.current = false;
  };

  const startFaceDetection = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    
    // If model didn't load, skip detection — allow capture anyway
    if (!faceModelRef.current) {
      setFaceDetected(true);
      return;
    }
    
    detectIntervalRef.current = setInterval(async () => {
      if (!faceModelRef.current || !videoRef.current) return;
      
      const video = videoRef.current;
      if (video.readyState !== 4) return;
      
      try {
        const predictions = await faceModelRef.current.estimateFaces(video, false);
        
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          if (predictions.length === 1) {
            const face = predictions[0];
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(
              face.topLeft[0], face.topLeft[1],
              face.bottomRight[0] - face.topLeft[0],
              face.bottomRight[1] - face.topLeft[1]
            );
            ctx.fillStyle = '#00ff00';
            ctx.font = '14px Arial';
            ctx.fillText('Face Detected', 10, 25);
          }
        }
        
        setFaceDetected(predictions.length === 1);
      } catch (err) {
        // Silently continue
      }
    }, 400);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // ---- Verification Flow ----
  const handleVerifyNow = async () => {
    if (!faceDetected && faceModelRef.current) {
      setError('Please position your face clearly in the frame');
      return;
    }
    setError('');
    
    const livePhoto = capturePhoto();
    if (!livePhoto) {
      setError('Failed to capture photo');
      return;
    }
    
    setCapturedPhoto(livePhoto);
    setStep('matching');
    stopWebcam();
    
    // Animate progress bar
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 90) { progress = 90; clearInterval(progressInterval); }
      setVerifyProgress(progress);
    }, 200);
    
    try {
      const response = await api.post('/identity-verification/verify-face', {
        interviewId,
        currentPhoto: livePhoto
      });
      
      clearInterval(progressInterval);
      setVerifyProgress(100);
      
      const data = response.data;
      setMatchScore(data.matchScore);
      
      if (data.verified) {
        setMatchResult('pass');
        setMessage(data.message || 'Identity verified successfully!');
        setStep('result');
        setTimeout(() => onVerificationComplete?.(), 1500);
      } else {
        setFailCount(prev => prev + 1);
        setMatchResult('fail');
        setMessage(data.message || 'Verification failed');
        setStep('result');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setFailCount(prev => prev + 1);
      const errorData = err.response?.data;
      
      if (errorData?.matchScore !== undefined) {
        setMatchScore(errorData.matchScore);
        setMatchResult('fail');
        setMessage(errorData.message || 'Verification failed');
        setStep('result');
      } else {
        setError(errorData?.message || 'Verification failed. Please try again.');
        setStep('verify');
        setCapturedPhoto(null);
      }
    }
  };

  const handleRetryVerification = () => {
    setMatchScore(null);
    setMatchResult(null);
    setCapturedPhoto(null);
    setError('');
    setVerifyProgress(0);
    setStep('verify');
  };

  const handleSkipVerification = async () => {
    try {
      setLoading(true);
      await api.post('/identity-verification/skip', {
        interviewId,
        reason: failCount > 0 
          ? `Face matching failed ${failCount} time(s) — candidate chose to skip` 
          : 'Face matching service unavailable — candidate chose to skip'
      });
      console.log('⚠️ Identity verification skipped by candidate');
      onVerificationComplete?.();
    } catch (err) {
      console.error('Skip verification error:', err);
      // Even if the skip endpoint fails, allow proceeding
      onVerificationComplete?.();
    } finally {
      setLoading(false);
    }
  };

  // ---- Render ----

  if (step === 'loading') {
    return (
      <div className="iv-container">
        <div className="iv-card">
          <div className="iv-loading">
            {!error ? (
              <>
                <div className="iv-spinner"></div>
                <p>Preparing identity verification...</p>
              </>
            ) : (
              <>
                <p style={{ color: '#dc3545', marginBottom: '15px' }}>⚠️ {error}</p>
                <button 
                  className="iv-btn-secondary" 
                  onClick={handleSkipVerification}
                  disabled={loading}
                  style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {loading ? 'Skipping...' : 'Skip Verification & Proceed →'}
                </button>
                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  Recruiter will be notified that verification was skipped.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'no-photo') {
    return (
      <div className="iv-container">
        <div className="iv-card">
          <div className="iv-result pass">
            <div className="iv-result-icon">✅</div>
            <h2>Verification Skipped</h2>
            <p style={{ marginTop: '12px', color: '#666' }}>
              No application photo on file. Proceeding to assessment.
            </p>
            <p className="iv-redirect">Starting assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="iv-container">
        <div className="iv-card iv-card-wide">
          {error && <div className="iv-error"><span>Warning:</span> {error}</div>}
          <div className="iv-header">
            <h2>Verify Your Identity</h2>
            <p>Position your face in the camera, then click <strong>Verify Now</strong></p>
          </div>
          <div className="iv-comparison-layout">
            <div className="iv-photo-panel">
              <div className="iv-panel-label">Application Photo</div>
              <div className="iv-photo-frame reference">
                {referencePhoto ? <img src={referencePhoto} alt="Reference" /> : <div className="iv-photo-placeholder">No photo</div>}
              </div>
            </div>
            <div className="iv-vs-indicator">
              <div className="iv-vs-circle">VS</div>
            </div>
            <div className="iv-photo-panel">
              <div className="iv-panel-label">Live Camera</div>
              <div className="iv-photo-frame live">
                {webcamActive ? (
                  <div className="iv-video-wrap compact">
                    <video ref={videoRef} autoPlay playsInline muted />
                    <canvas ref={canvasRef} width="320" height="240" />
                  </div>
                ) : (
                  <div className="iv-photo-placeholder"><div className="iv-spinner"></div></div>
                )}
              </div>
              {webcamActive && faceModelRef.current && (
                <div className={`iv-face-status ${faceDetected ? 'detected' : ''}`}>
                  {faceDetected ? 'Face Detected' : 'No Face Detected'}
                </div>
              )}
            </div>
          </div>
          <div className="iv-actions center">
            <button className="iv-btn-verify" onClick={handleVerifyNow} disabled={(!faceDetected && !!faceModelRef.current) || !webcamActive}>
              Verify Now
            </button>
            {failCount > 0 && (
              <button 
                className="iv-btn-secondary" 
                onClick={handleSkipVerification}
                disabled={loading}
                style={{ marginLeft: '10px', background: '#6c757d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
              >
                {loading ? 'Skipping...' : 'Skip Verification →'}
              </button>
            )}
          </div>
          {failCount > 0 && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '8px' }}>
              Verification failed {failCount} time(s). You may skip, but the recruiter will be notified.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step === 'matching') {
    return (
      <div className="iv-container">
        <div className="iv-card iv-card-wide">
          <div className="iv-header"><h2>Verifying Identity...</h2></div>
          <div className="iv-comparison-layout matching">
            <div className="iv-photo-panel">
              <div className="iv-panel-label">Application Photo</div>
              <div className="iv-photo-frame reference scanning">
                {referencePhoto && <img src={referencePhoto} alt="Reference" />}
                <div className="iv-scan-line"></div>
              </div>
            </div>
            <div className="iv-vs-indicator">
              <div className="iv-vs-circle pulse">⚡</div>
            </div>
            <div className="iv-photo-panel">
              <div className="iv-panel-label">Your Photo</div>
              <div className="iv-photo-frame captured scanning">
                {capturedPhoto && <img src={capturedPhoto} alt="Captured" />}
                <div className="iv-scan-line"></div>
              </div>
            </div>
          </div>
          <div className="iv-progress-section">
            <div className="iv-progress-bar">
              <div className="iv-progress-fill" style={{ width: `${verifyProgress}%` }}></div>
            </div>
            <p className="iv-progress-text">
              {verifyProgress < 30 ? 'Analyzing facial features...' :
               verifyProgress < 60 ? 'Comparing face geometry...' :
               verifyProgress < 90 ? 'Computing match score...' :
               'Finalizing results...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    const isPassed = matchResult === 'pass';
    return (
      <div className="iv-container">
        <div className="iv-card iv-card-wide">
          <div className={`iv-result ${isPassed ? 'pass' : 'fail'}`}>
            <div className="iv-result-icon">{isPassed ? '✅' : '❌'}</div>
            <h2>{isPassed ? 'Identity Verified!' : 'Verification Failed'}</h2>
            {matchScore !== null && (
              <div className="iv-score-display">
                <div className={`iv-score-circle ${isPassed ? 'pass' : 'fail'}`}>
                  <span className="iv-score-num">{matchScore}%</span>
                  <span className="iv-score-label">Match</span>
                </div>
              </div>
            )}
            {(referencePhoto || capturedPhoto) && (
              <div className="iv-result-photos">
                {referencePhoto && <div className="iv-result-photo"><img src={referencePhoto} alt="Reference" /><span>Application</span></div>}
                {capturedPhoto && <div className="iv-result-photo"><img src={capturedPhoto} alt="Live" /><span>Live Capture</span></div>}
              </div>
            )}
            {isPassed ? (
              <p className="iv-result-message">
                {message || 'Identity verified successfully!'}
                <br /><span className="iv-redirect">Starting assessment...</span>
              </p>
            ) : (
              <div className="iv-fail-actions">
                <p>{message || 'Face did not match the reference photo.'}</p>
                <button className="iv-btn-primary" onClick={handleRetryVerification}>Try Again</button>
                <button 
                  className="iv-btn-secondary" 
                  onClick={handleSkipVerification}
                  disabled={loading}
                  style={{ marginLeft: '10px', background: '#6c757d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {loading ? 'Skipping...' : 'Skip & Proceed →'}
                </button>
                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  Skipping will be noted in the recruiter's report.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default IdentityVerification;
