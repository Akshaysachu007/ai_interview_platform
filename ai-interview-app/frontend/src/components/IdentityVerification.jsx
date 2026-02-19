import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import './IdentityVerification.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const IdentityVerification = ({ interviewId, onVerificationComplete }) => {
  const [verificationStep, setVerificationStep] = useState('check'); // check, capture, verify, complete
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [hasReferencePhoto, setHasReferencePhoto] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceModelRef = useRef(null);

  const token = localStorage.getItem('candidateToken');
  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // Check verification status on mount
  useEffect(() => {
    checkVerificationStatus();
    loadFaceDetectionModel();
    
    return () => {
      stopWebcam();
    };
  }, [interviewId]);

  const loadFaceDetectionModel = async () => {
    try {
      await tf.ready();
      const model = await blazeface.load();
      faceModelRef.current = model;
      console.log('✅ Face detection model loaded for verification');
    } catch (err) {
      console.error('Model loading error:', err);
    }
  };

  const checkVerificationStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/identity-verification/status/${interviewId}`);
      const data = response.data;
      
      setVerificationStatus(data);
      setHasReferencePhoto(data.hasReferencePhoto);

      if (data.verificationCompleted) {
        setVerificationStep('complete');
        setMessage('✅ Identity already verified!');
        setTimeout(() => {
          if (onVerificationComplete) onVerificationComplete();
        }, 2000);
      } else if (!data.verificationRequired) {
        setMessage('This interview does not require identity verification');
        setTimeout(() => {
          if (onVerificationComplete) onVerificationComplete();
        }, 2000);
      } else {
        setVerificationStep(data.hasReferencePhoto ? 'capture' : 'reference');
      }
    } catch (err) {
      setError('Failed to check verification status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setWebcamActive(true);
        
        // Start face detection
        setTimeout(() => detectFace(), 500);
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setError('Could not access camera. Please allow camera permissions.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  const detectFace = async () => {
    if (!faceModelRef.current || !videoRef.current || !canvasRef.current) {
      setTimeout(() => detectFace(), 500);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === 4) {
      const predictions = await faceModelRef.current.estimateFaces(video, false);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (predictions.length === 1) {
        setFaceDetected(true);
        
        // Draw face box
        const face = predictions[0];
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(
          face.topLeft[0],
          face.topLeft[1],
          face.bottomRight[0] - face.topLeft[0],
          face.bottomRight[1] - face.topLeft[1]
        );
        
        // Draw text
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Arial';
        ctx.fillText('Face Detected ✓', 10, 30);
      } else if (predictions.length === 0) {
        setFaceDetected(false);
        ctx.fillStyle = '#ff0000';
        ctx.font = '16px Arial';
        ctx.fillText('No Face Detected', 10, 30);
      } else {
        setFaceDetected(false);
        ctx.fillStyle = '#ff9900';
        ctx.font = '16px Arial';
        ctx.fillText('Multiple Faces - Only 1 Allowed', 10, 30);
      }
    }

    // Continue detection
    if (webcamActive && verificationStep !== 'complete') {
      setTimeout(() => detectFace(), 500);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Draw current video frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleCaptureReference = async () => {
    if (!faceDetected) {
      setError('Please ensure your face is clearly visible');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const photoData = capturePhoto();
      
      const response = await api.post('/identity-verification/upload-photo', {
        photoData
      });

      setMessage('✅ Reference photo captured!');
      setHasReferencePhoto(true);
      setVerificationStep('capture');
      stopWebcam();
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = () => {
    setVerificationStep('capture');
    setError('');
    setMessage('Position your face in the frame and click "Verify Identity"');
    startWebcam();
  };

  const handleVerifyIdentity = async () => {
    if (!faceDetected) {
      setError('Please ensure your face is clearly visible before verifying');
      return;
    }

    // Countdown before capture
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          performVerification();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const performVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const currentPhoto = capturePhoto();
      
      const response = await api.post('/identity-verification/verify-face', {
        interviewId,
        currentPhoto
      });

      const data = response.data;
      
      if (data.verified) {
        setMessage('✅ ' + data.message);
        setMatchScore(data.matchScore);
        setVerificationStep('complete');
        stopWebcam();
        
        // Notify parent component
        setTimeout(() => {
          if (onVerificationComplete) onVerificationComplete();
        }, 3000);
      } else {
        setError(data.message);
        setMatchScore(data.matchScore);
      }
      
    } catch (err) {
      const errorData = err.response?.data;
      setError(errorData?.message || 'Verification failed');
      if (errorData?.matchScore !== undefined) {
        setMatchScore(errorData.matchScore);
      }
    } finally {
      setLoading(false);
      setCountdown(null);
    }
  };

  // Render different steps
  const renderContent = () => {
    if (loading && verificationStep === 'check') {
      return (
        <div className="verification-loading">
          <div className="spinner"></div>
          <p>Checking verification status...</p>
        </div>
      );
    }

    if (verificationStep === 'reference') {
      return (
        <div className="verification-reference">
          <div className="verification-icon">📸</div>
          <h2>Capture Reference Photo</h2>
          <p>First, we need to capture a reference photo of you.</p>
          <p>This will be used to verify your identity before the interview.</p>
          
          {!webcamActive ? (
            <button 
              className="btn-primary"
              onClick={startWebcam}
            >
              Start Camera
            </button>
          ) : (
            <div className="camera-preview">
              <div className="video-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  width="640"
                  height="480"
                />
                <canvas
                  ref={canvasRef}
                  width="640"
                  height="480"
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />
              </div>
              
              <div className="camera-controls">
                <button
                  className="btn-primary"
                  onClick={handleCaptureReference}
                  disabled={!faceDetected || loading}
                >
                  {loading ? 'Uploading...' : 'Capture Photo'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={stopWebcam}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
              
              {!faceDetected && (
                <p className="warning-text">⚠️ Please position your face clearly in the frame</p>
              )}
            </div>
          )}
        </div>
      );
    }

    if (verificationStep === 'capture') {
      return (
        <div className="verification-capture">
          <div className="verification-icon">🔐</div>
          <h2>Verify Your Identity</h2>
          <p>To ensure interview integrity, please verify your identity.</p>
          <p>We will match your face with your reference photo.</p>
          
          {!webcamActive ? (
            <button 
              className="btn-primary"
              onClick={handleStartVerification}
            >
              Start Verification
            </button>
          ) : (
            <div className="camera-preview">
              <div className="video-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  width="640"
                  height="480"
                />
                <canvas
                  ref={canvasRef}
                  width="640"
                  height="480"
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />
                
                {countdown !== null && (
                  <div className="countdown-overlay">
                    <div className="countdown-number">{countdown}</div>
                  </div>
                )}
              </div>
              
              <div className="camera-controls">
                <button
                  className="btn-primary"
                  onClick={handleVerifyIdentity}
                  disabled={!faceDetected || loading || countdown !== null}
                >
                  {loading ? 'Verifying...' : countdown !== null ? 'Capturing...' : 'Verify Identity'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    stopWebcam();
                    setVerificationStep('check');
                  }}
                  disabled={loading || countdown !== null}
                >
                  Cancel
                </button>
              </div>
              
              {!faceDetected && !countdown && (
                <p className="warning-text">⚠️ Please position your face clearly in the frame</p>
              )}
              
              {matchScore !== null && (
                <div className={`match-score ${matchScore >= 70 ? 'good' : 'poor'}`}>
                  Match Score: {matchScore}%
                  {matchScore < 70 && <span> (Minimum 70% required)</span>}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (verificationStep === 'complete') {
      return (
        <div className="verification-complete">
          <div className="success-icon">✅</div>
          <h2>Identity Verified!</h2>
          <p>{message}</p>
          {matchScore && (
            <div className="final-score">
              <p>Match Score: <strong>{matchScore}%</strong></p>
            </div>
          )}
          <p className="redirect-message">Redirecting to interview...</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="identity-verification-container">
      <div className="verification-card">
        {error && (
          <div className="error-banner">
            <span>⚠️</span> {error}
          </div>
        )}
        
        {message && !error && verificationStep !== 'complete' && (
          <div className="info-banner">
            <span>ℹ️</span> {message}
          </div>
        )}
        
        {renderContent()}
      </div>
    </div>
  );
};

export default IdentityVerification;
