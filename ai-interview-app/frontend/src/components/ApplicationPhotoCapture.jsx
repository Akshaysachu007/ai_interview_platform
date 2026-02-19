import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import './ApplicationPhotoCapture.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ApplicationPhotoCapture = ({ interviewId, onApplicationComplete, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [webcamActive, setWebcamActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [photoCapture, setPhotoCaptured] = useState(null);
  const [faceModel, setFaceModel] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const token = localStorage.getItem('candidateToken');
  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // Load face detection model
  useEffect(() => {
    loadFaceModel();
    return () => stopWebcam();
  }, []);

  const loadFaceModel = async () => {
    try {
      console.log('Loading face detection model...');
      await tf.ready();
      const model = await blazeface.load();
      setFaceModel(model);
      console.log('✅ Face detection model loaded');
    } catch (err) {
      console.error('Model loading error:', err);
      setError('Could not load face detection model');
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
        
        // Start face detection after a short delay
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
    if (!faceModel || !videoRef.current || !canvasRef.current || !webcamActive) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === 4) {
      try {
        const predictions = await faceModel.estimateFaces(video, false);
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (predictions.length === 1) {
          setFaceDetected(true);
          
          // Draw green box around face
          const face = predictions[0];
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(
            face.topLeft[0],
            face.topLeft[1],
            face.bottomRight[0] - face.topLeft[0],
            face.bottomRight[1] - face.topLeft[1]
          );
          
          // Draw status text
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

    // Continue detection loop
    if (webcamActive && !photoCapture) {
      setTimeout(() => detectFace(), 500);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleCapturePhoto = () => {
    if (!faceDetected) {
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
          To ensure interview integrity, please capture a clear photo of yourself. 
          This photo will be used for identity verification before the interview starts.
        </p>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        {!photoCapture ? (
          // Photo Capture Mode
          <div className="capture-section">
            {!webcamActive ? (
              <div className="start-camera">
                <div className="camera-icon">📷</div>
                <p>Click the button below to start your camera</p>
                <button 
                  className="btn-primary"
                  onClick={startWebcam}
                  disabled={!faceModel}
                >
                  {!faceModel ? 'Loading...' : 'Start Camera'}
                </button>
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
                    disabled={!faceDetected}
                  >
                    📸 Capture Photo
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={onCancel}
                  >
                    Cancel
                  </button>
                </div>

                {!faceDetected && (
                  <p className="warning-text">
                    ⚠️ Please position your face clearly in the frame
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          // Photo Review Mode
          <div className="review-section">
            <h3>Review Your Photo</h3>
            <div className="photo-preview">
              <img src={photoCapture} alt="Captured" />
            </div>
            
            <p className="review-instruction">
              This photo will be stored with your application and used for 
              identity verification before the interview starts.
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
