import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import './ApplicationPhotoCapture.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ApplicationPhotoCapture = ({ interviewId, onApplicationComplete, onCancel, onPhotoCapture }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [webcamActive, setWebcamActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [photoCapture, setPhotoCaptured] = useState(null);
  const [faceModel, setFaceModel] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const webcamActiveRef = useRef(false);
  const photoCapturedRef = useRef(null);
  const faceModelRef = useRef(null);
  
  const token = localStorage.getItem('candidateToken');
  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // Keep refs in sync with state
  useEffect(() => { webcamActiveRef.current = webcamActive; }, [webcamActive]);
  useEffect(() => { photoCapturedRef.current = photoCapture; }, [photoCapture]);
  useEffect(() => { faceModelRef.current = faceModel; }, [faceModel]);

  // Load face detection model and auto-start webcam
  useEffect(() => {
    const init = async () => {
      await loadFaceModel();
      startWebcam();
    };
    init();
    return () => stopWebcam();
  }, []);

  // Assign stream to video element once it renders
  useEffect(() => {
    if (webcamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadeddata = () => {
        console.log('✅ Video data loaded, starting face detection');
        detectFace();
      };
    }
  }, [webcamActive]);

  const loadFaceModel = async () => {
    try {
      console.log('Loading face detection model...');
      await tf.ready();
      const model = await blazeface.load();
      setFaceModel(model);
      faceModelRef.current = model;
      console.log('✅ Face detection model loaded');
    } catch (err) {
      console.warn('⚠️ BlazeFace model failed to load (CDN unreachable). Capture still allowed.', err.message);
      // Allow capture without client-side face detection
      faceModelRef.current = null;
      setFaceDetected(true);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      // Save stream to ref first, then set state to render <video>
      streamRef.current = stream;
      setWebcamActive(true);
      // Stream will be assigned to video in the useEffect above
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
    if (!faceModelRef.current || !videoRef.current || !canvasRef.current || !webcamActiveRef.current) {
      // If model didn't load, just allow capture
      if (!faceModelRef.current && webcamActiveRef.current) {
        setFaceDetected(true);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === 4) {
      try {
        const predictions = await faceModelRef.current.estimateFaces(video, false);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (predictions.length === 1) {
          setFaceDetected(true);
          const face = predictions[0];
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(
            face.topLeft[0],
            face.topLeft[1],
            face.bottomRight[0] - face.topLeft[0],
            face.bottomRight[1] - face.topLeft[1]
          );
          ctx.fillStyle = '#00ff00';
          ctx.font = 'bold 18px Arial';
          ctx.fillText('✓ Face Detected - Ready to Capture', 10, 30);
        } else if (predictions.length === 0) {
          setFaceDetected(false);
          ctx.fillStyle = '#ff0000';
          ctx.font = 'bold 18px Arial';
          ctx.fillText('✗ No Face Detected', 10, 30);
        } else {
          setFaceDetected(false);
          ctx.fillStyle = '#ff9900';
          ctx.font = 'bold 18px Arial';
          ctx.fillText(`✗ Multiple Faces (${predictions.length}) - Only 1 Allowed`, 10, 30);
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }
    }

    if (webcamActiveRef.current && !photoCapturedRef.current) {
      setTimeout(() => detectFace(), 500);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleCapturePhoto = () => {
    if (!faceDetected && faceModelRef.current) {
      setError('Please ensure your face is clearly visible in the frame');
      return;
    }

    const photo = capturePhoto();
    setPhotoCaptured(photo);
    stopWebcam();
    setError('');
  };

  const handleRetake = () => {
    setPhotoCaptured(null);
    setError('');
    startWebcam();
  };

  const handleSubmitApplication = async () => {
    if (!photoCapture) {
      setError('Please capture your photo first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (onPhotoCapture) {
        onPhotoCapture(photoCapture);
        return;
      }

      const response = await api.post(`/interview/apply/${interviewId}`, {
        candidatePhoto: photoCapture
      });

      if (onApplicationComplete) {
        onApplicationComplete(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="application-photo-capture">
      <div className="capture-card">
        <h2>📸 Complete Your Application</h2>
        <p className="instruction">
          Please take a clear photo of yourself using your camera. 
          This photo will be used for identity verification before the assessment starts.
        </p>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        {!photoCapture ? (
          <div className="capture-section">
            {!webcamActive && !faceModel ? (
              <div className="start-camera">
                <div className="camera-icon">📷</div>
                <p>Loading camera...</p>
                <div className="spinner"></div>
              </div>
            ) : !webcamActive ? (
              <div className="start-camera">
                <div className="camera-icon">📷</div>
                <p>Starting camera...</p>
              </div>
            ) : (
              <div className="camera-view">
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
                  />
                </div>

                <div className="capture-tips">
                  <h4>Tips for best results:</h4>
                  <ul>
                    <li>✓ Look directly at the camera</li>
                    <li>✓ Ensure good lighting on your face</li>
                    <li>✓ Remove glasses or hats if possible</li>
                    <li>✓ Only your face should be visible</li>
                  </ul>
                </div>

                <div className="capture-controls">
                  <button
                    className="btn-capture"
                    onClick={handleCapturePhoto}
                    disabled={!faceDetected && !!faceModelRef.current}
                  >
                    📸 Capture Photo
                  </button>
                  {onCancel && (
                    <button className="btn-secondary" onClick={onCancel}>
                      Cancel
                    </button>
                  )}
                </div>

                {!faceDetected && faceModelRef.current && (
                  <p className="warning-text">
                    ⚠️ Please position your face clearly in the frame
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="review-section">
            <h3>Review Your Photo</h3>
            <div className="photo-preview">
              <img src={photoCapture} alt="Captured" />
            </div>
            
            <p className="upload-badge webcam-badge">🎥 Captured from camera</p>

            <p className="review-instruction">
              This photo will be stored with your application and used for 
              identity verification before the assessment starts.
            </p>

            <div className="review-controls">
              <button
                className="btn-primary"
                onClick={handleSubmitApplication}
                disabled={loading}
              >
                {loading ? 'Submitting...' : '✓ Submit Application'}
              </button>
              <button
                className="btn-secondary"
                onClick={handleRetake}
                disabled={loading}
              >
                🔄 Retake Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationPhotoCapture;
