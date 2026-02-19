import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import './AIInterview.css';

const AIInterview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get interview ID from URL query parameter
  const urlParams = new URLSearchParams(location.search);
  const acceptedInterviewId = urlParams.get('id') || null;
  
  const [stream, setStream] = useState('Computer Science');
  const [difficulty, setDifficulty] = useState('Medium');
  const [interviewId, setInterviewId] = useState(null);
  const [loadingInterview, setLoadingInterview] = useState(false);
  const [isFromAcceptedApplication, setIsFromAcceptedApplication] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [timeLimit, setTimeLimit] = useState(30); // in minutes
  const [remainingTime, setRemainingTime] = useState(null); // in seconds
  const [timerWarningShown, setTimerWarningShown] = useState({ fiveMin: false, oneMin: false });
  const [malpractices, setMalpractices] = useState({
    tabSwitches: 0,
    aiDetections: 0,
    warnings: []
  });
  const [loading, setLoading] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceAvailable, setVoiceAvailable] = useState(null); // null = untested, true = available, false = unavailable
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [faceDetectionModel, setFaceDetectionModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [noFaceCount, setNoFaceCount] = useState(0);
  const [multipleFaceCount, setMultipleFaceCount] = useState(0);
  const [lastViolationType, setLastViolationType] = useState(null);
  const noFaceCountRef = useRef(0);
  const multipleFaceCountRef = useRef(0);
  const detectionInFlightRef = useRef(false);
  const lastSnapshotAtRef = useRef(0);
  const detectionCanvasRef = useRef(null);
  const recentFaceCountsRef = useRef([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const streams = [
    'Computer Science',
    'Information Technology',
    'Data Science',
    'AI/ML',
    'Mechanical Engineering',
    'Business Management'
  ];

  const difficulties = ['Easy', 'Medium', 'Hard'];

  // Face detection model loading function (can be called multiple times)
  const loadFaceDetectionModel = async () => {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        console.log(`📦 Loading face detection model... (Attempt ${attempt + 1}/${maxRetries})`);
        setModelLoading(true);
        
        if (tf.getBackend() !== 'webgl') {
          await tf.setBackend('webgl');
        }

        // Wait for TensorFlow.js to be ready
        await tf.ready();
        console.log('✅ TensorFlow.js backend ready:', tf.getBackend());
        
        // Load BlazeFace model with explicit configuration
        const model = await blazeface.load({
          maxFaces: 3, // Keep this small for speed while still catching multiple faces
          iouThreshold: 0.5, // Reduce duplicate boxes for the same face
          scoreThreshold: 0.6 // Improve sensitivity for partial/low-light faces
        });
        
        setFaceDetectionModel(model);
        console.log('✅ Face detection model loaded successfully!');
        console.log('   - Max faces:', 3);
        console.log('   - Score threshold:', 0.6);
        setModelLoading(false);
        return; // Success, exit retry loop
      } catch (error) {
        attempt++;
        console.error(`❌ Error loading face detection model (Attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt >= maxRetries) {
          console.error('⚠️ Could not load face detection model after ' + maxRetries + ' attempts.');
          setModelLoading(false);
          setFaceDetectionModel(null);
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  };

  // Load face detection model on component mount with retry logic
  useEffect(() => {
    loadFaceDetectionModel();
    
    // Check if there's an active interview in localStorage (page refresh)
    const activeInterviewId = localStorage.getItem('activeInterviewId');
    if (activeInterviewId && !acceptedInterviewId) {
      console.log('🔄 Detected active interview from localStorage:', activeInterviewId);
      // Load the interview data
      loadAcceptedInterview(activeInterviewId);
    }
  }, []);

  // Load interview details if coming from accepted application
  useEffect(() => {
    if (acceptedInterviewId && !interviewStarted && !loadingInterview) {
      loadAcceptedInterview(acceptedInterviewId);
    }
  }, [acceptedInterviewId]);

  // Start webcam if interview is already in progress (page refresh case)
  useEffect(() => {
    if (interviewStarted && !interviewCompleted && !webcamActive) {
      console.log('🔄 Interview already started, waiting for model and initializing webcam...');
      
      const initWebcam = async () => {
        // Wait for face detection model to load
        if (!faceDetectionModel) {
          console.log('⏳ Waiting for face detection model to load...');
          await new Promise((resolve) => {
            const checkInterval = setInterval(() => {
              if (faceDetectionModel) {
                console.log('✅ Model loaded during refresh');
                clearInterval(checkInterval);
                resolve();
              }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
              console.warn('⚠️ Model loading timeout during refresh');
              clearInterval(checkInterval);
              resolve();
            }, 10000);
          });
        } else {
          console.log('✅ Model already loaded during refresh');
        }
        
        // Now start webcam
        try {
          await startWebcam();
          console.log('✅ Webcam started successfully after refresh');
        } catch (err) {
          console.error('❌ Webcam initialization error after refresh:', err);
        }
      };
      
      const timer = setTimeout(() => {
        initWebcam();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [interviewStarted, interviewCompleted, webcamActive, faceDetectionModel]);

  // Detect tab switching
  useEffect(() => {
    if (!interviewStarted || interviewCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden && interviewId) {
        reportTabSwitch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interviewStarted, interviewCompleted, interviewId]);

  // Interview timer countdown
  useEffect(() => {
    if (!interviewStarted || interviewCompleted || remainingTime === null) return;

    const timerInterval = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime <= 1) {
          // Time's up - auto-submit interview
          clearInterval(timerInterval);
          alert('⏰ Time\'s up! Your interview will be submitted automatically.');
          completeInterview();
          return 0;
        }

        const newTime = prevTime - 1;
        const minutesLeft = Math.floor(newTime / 60);

        // Show 5-minute warning
        if (minutesLeft === 5 && !timerWarningShown.fiveMin) {
          setTimerWarningShown(prev => ({ ...prev, fiveMin: true }));
          alert('⚠️ 5 minutes remaining! Please wrap up your answers.');
        }

        // Show 1-minute warning
        if (minutesLeft === 1 && !timerWarningShown.oneMin) {
          setTimerWarningShown(prev => ({ ...prev, oneMin: true }));
          alert('⚠️ Only 1 minute left!');
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [interviewStarted, interviewCompleted, remainingTime, timerWarningShown]);

  // Webcam functionality with improved reliability
  const startWebcam = async () => {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        console.log(`🎥 Requesting webcam access... (Attempt ${attempt + 1}/${maxRetries})`);
        
        // Stop any existing stream first
        if (streamRef.current) {
          console.log('🛑 Stopping existing stream...');
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Clear video element
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject = null;
        }
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia is not supported in this browser');
        }
        
        // Request camera access with enhanced constraints
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { min: 320, ideal: 640, max: 1280 },
            height: { min: 240, ideal: 480, max: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30 }
          },
          audio: false // Explicitly disable audio
        });
        
        console.log('✅ Webcam access granted');
        console.log('   - Stream tracks:', mediaStream.getTracks().length);
        console.log('   - Stream active:', mediaStream.active);
        console.log('   - Stream ID:', mediaStream.id);
        
        // Validate video tracks
        const videoTracks = mediaStream.getVideoTracks();
        if (videoTracks.length === 0) {
          throw new Error('No video tracks available in stream');
        }
        
        const videoTrack = videoTracks[0];
        console.log('   - Video track label:', videoTrack.label);
        console.log('   - Video track enabled:', videoTrack.enabled);
        console.log('   - Video track ready state:', videoTrack.readyState);
        
        // Wait for video element to be available (with timeout)
        if (!videoRef.current) {
          console.log('⏳ Waiting for video element to be available...');
          await new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
              if (videoRef.current) {
                clearInterval(checkInterval);
                console.log('✅ Video element is now available');
                resolve();
              }
            }, 100); // Check every 100ms
            
            // Timeout after 5 seconds
            setTimeout(() => {
              clearInterval(checkInterval);
              if (!videoRef.current) {
                console.error('❌ Video element not available after 5 seconds');
                reject(new Error('Video element not available - please ensure the interview UI is loaded'));
              }
            }, 5000);
          });
        }
        
        console.log('📹 Attaching stream to video element...');
        
        // Set the new stream
        videoRef.current.srcObject = mediaStream;
        streamRef.current = mediaStream;
      
      // Explicitly set video attributes
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.autoplay = true;
      videoRef.current.controls = false;
      
      // Wait for video to load metadata and be ready with improved timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('⚠️ Video loading timeout (10s), but continuing...');
          resolve(); // Don't reject, just continue
        }, 10000); // Increased to 10 seconds for slower devices
        
        const onLoadedMetadata = () => {
          console.log('✅ Video metadata loaded');
          console.log('   - Dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          checkVideoReady();
        };
        
        const onCanPlay = () => {
          console.log('✅ Video can play');
          checkVideoReady();
        };
        
        const checkVideoReady = () => {
          if (videoRef.current && 
              videoRef.current.readyState >= 2 && 
              videoRef.current.videoWidth > 0 && 
              videoRef.current.videoHeight > 0) {
            clearTimeout(timeout);
            videoRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoRef.current.removeEventListener('canplay', onCanPlay);
            console.log('✅ Video fully ready!');
            console.log('   - Ready state:', videoRef.current.readyState);
            console.log('   - Dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
            resolve();
          }
        };
        
        // Listen to multiple events for better reliability
        videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
        videoRef.current.addEventListener('canplay', onCanPlay);
        
        // Check immediately in case video is already ready
        checkVideoReady();
      });
      
      // Explicitly play the video with validation
      try {
        console.log('▶️ Starting video playback...');
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('✅ Video play() successful');
        }
        
        // Validate video is actually playing
        if (videoRef.current.paused) {
          throw new Error('Video is paused after play() call');
        }
        
        console.log('   - Playing:', !videoRef.current.paused);
        console.log('   - Current time:', videoRef.current.currentTime);
        console.log('   - Duration:', videoRef.current.duration);
        
        setWebcamActive(true);
        
        // Start face detection only after confirming video is playing
        console.log('🎯 Starting continuous real-time face detection...');
        startFaceDetection();
        
        // Exit retry loop on success
        return;
      } catch (playError) {
        console.error('❌ Video play error:', playError);
        throw playError; // Trigger retry
      }
      
    } catch (error) {
      attempt++;
      console.error(`❌ Webcam access error (Attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt >= maxRetries) {
        // Final failure - show appropriate error message
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          alert('⚠️ Camera Permission Denied\n\nPlease:\n1. Click the camera icon in your browser address bar\n2. Allow camera access\n3. Refresh the page and start the interview again\n\nNote: The interview cannot proceed without camera access for proctoring.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          alert('⚠️ No Camera Found\n\nPlease connect a camera to your device and try again.\n\nThe interview requires a camera for proctoring.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          alert('⚠️ Camera In Use\n\nYour camera is being used by another application.\n\nPlease:\n1. Close all other applications using your camera\n2. Refresh this page\n3. Try starting the interview again');
        } else {
          alert('⚠️ Camera Error\n\n' + error.message + '\n\nPlease refresh the page and try again.\nIf the problem persists, try restarting your browser.');
        }
        
        // Don't set webcamActive on failure - interview should not proceed
        setWebcamActive(false);
        throw error; // Propagate error to calling function
      } else {
        // Wait before retry with exponential backoff
        console.log(`⏳ Retrying in ${1000 * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  // If we reached here, all retries failed
  throw new Error('Failed to start webcam after ' + maxRetries + ' attempts');
  };

  const stopWebcam = () => {
    console.log('🛑 Stopping webcam and real-time face detection...');
    
    // Stop face detection first
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
      console.log('✅ Face detection monitoring stopped');
    }
    
    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('   - Track stopped:', track.label);
      });
      streamRef.current = null;
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setWebcamActive(false);
    setFaceCount(0);
    console.log('✅ Webcam stopped completely');
  };

  // Helper function to play warning sound for violations
  const playWarningSound = () => {
    try {
      // Create audio context and play a warning beep
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Warning tone frequency
      oscillator.type = 'sine';
      
      gainNode.gain.value = 0.3; // Volume
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2); // Short beep
    } catch (error) {
      console.log('Warning sound not available:', error.message);
    }
  };

  // Helper function to show visual violation alert
  const showViolationAlert = (title, message) => {
    try {
      // Only show alert if interview is active
      if (!interviewCompleted) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'violation-alert';
        alertDiv.innerHTML = `
          <div class="violation-alert-content">
            <div class="violation-alert-icon">🚨</div>
            <div class="violation-alert-title">${title}</div>
            <div class="violation-alert-message">${message}</div>
          </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
          alertDiv.classList.add('fade-out');
          setTimeout(() => {
            if (alertDiv.parentNode) {
              document.body.removeChild(alertDiv);
            }
          }, 500);
        }, 4000);
      }
    } catch (error) {
      console.log('Alert display error:', error.message);
    }
  };

  // Real-time face detection using TensorFlow.js with improved accuracy
  const startFaceDetection = () => {
    // Clear any existing interval first
    if (detectionIntervalRef.current) {
      console.log('🧹 Clearing existing detection interval');
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    // CHECK IF MODEL IS LOADED
    if (!faceDetectionModel) {
      console.error('❌ Cannot start face detection: Model not loaded yet!');
      console.error('This should not happen - model should be loaded before calling this function');
      return;
    }
    
    // CHECK IF VIDEO IS READY
    if (!videoRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      console.error('❌ Cannot start face detection: Video not ready yet!');
      console.error('   - Video element:', !!videoRef.current);
      console.error('   - Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
      return;
    }
    
    console.log('✅ Starting face detection with loaded model');
    console.log('   - Model loaded:', !!faceDetectionModel);
    console.log('   - Video ready:', videoRef.current.readyState);
    console.log('   - Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
    console.log('   - Interview started:', interviewStarted, 'completed:', interviewCompleted);
    
    const DETECTION_INTERVAL_MS = 350;

    const detectionLoop = async () => {
      const shouldDetect = interviewStarted && !interviewCompleted && faceDetectionModel &&
        videoRef.current && !videoRef.current.paused;

      if (!shouldDetect) {
        detectionIntervalRef.current = setTimeout(detectionLoop, 1000);
        return;
      }

      if (detectionInFlightRef.current) {
        detectionIntervalRef.current = setTimeout(detectionLoop, DETECTION_INTERVAL_MS);
        return;
      }

      detectionInFlightRef.current = true;
      try {
        await detectFacesWithML();
      } finally {
        detectionInFlightRef.current = false;
        detectionIntervalRef.current = setTimeout(detectionLoop, DETECTION_INTERVAL_MS);
      }
    };

    detectionLoop();
    console.log('✅ Real-time ML face detection started');
  };

  const detectFacesWithML = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('⚠️ Video or canvas ref not available');
      return;
    }

    if (!faceDetectionModel) {
      console.log('⚠️ Face detection model not loaded yet');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video has valid dimensions
    if (!video.videoWidth || !video.videoHeight || video.videoWidth < 10 || video.videoHeight < 10) {
      console.log('⚠️ Video dimensions not ready or invalid:', video.videoWidth, 'x', video.videoHeight);
      setFaceCount(0);
      return;
    }
    
    // Check if video is actually playing
    if (video.paused || video.ended || video.readyState < 2) {
      console.warn('⚠️ Video is not playing properly');
      console.warn('   - Paused:', video.paused);
      console.warn('   - Ended:', video.ended);
      console.warn('   - Ready state:', video.readyState);
      
      try {
        await video.play();
        console.log('✅ Video restarted');
      } catch (e) {
        console.error('❌ Cannot restart video:', e.message);
        return;
      }
    }

    try {
      if (!detectionCanvasRef.current) {
        detectionCanvasRef.current = document.createElement('canvas');
      }

      const detectionCanvas = detectionCanvasRef.current;
      const detectionWidth = 256;
      const detectionHeight = Math.round(video.videoHeight * (detectionWidth / video.videoWidth));
      detectionCanvas.width = detectionWidth;
      detectionCanvas.height = detectionHeight;
      const detectionContext = detectionCanvas.getContext('2d');
      detectionContext.drawImage(video, 0, 0, detectionWidth, detectionHeight);

      // Detect faces using TensorFlow BlazeFace model
      const predictions = await faceDetectionModel.estimateFaces(detectionCanvas, false, false, false);
      
      // Filter predictions by confidence threshold
      const CONFIDENCE_THRESHOLD = 0.6;
      const highConfidencePredictions = predictions.filter(pred => {
        const confidence = pred.probability ? pred.probability[0] : 1;
        return confidence >= CONFIDENCE_THRESHOLD;
      });

      const detectedFaces = highConfidencePredictions.length;
      const recentCounts = recentFaceCountsRef.current;
      recentCounts.push(detectedFaces);
      if (recentCounts.length > 5) {
        recentCounts.shift();
      }

      const countFrequency = recentCounts.reduce((acc, count) => {
        acc[count] = (acc[count] || 0) + 1;
        return acc;
      }, {});
      const stableFaceCount = Number(Object.keys(countFrequency).reduce((a, b) =>
        countFrequency[a] >= countFrequency[b] ? a : b
      ));

      setFaceCount(stableFaceCount);
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      
      // Always clear and redraw to ensure fresh frame
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw bounding boxes for high-confidence detections
      if (highConfidencePredictions.length > 0) {
        highConfidencePredictions.forEach((prediction) => {
          const start = prediction.topLeft;
          const end = prediction.bottomRight;
          const scaleX = video.videoWidth / detectionWidth;
          const scaleY = video.videoHeight / detectionHeight;
          const scaledStart = [start[0] * scaleX, start[1] * scaleY];
          const size = [(end[0] - start[0]) * scaleX, (end[1] - start[1]) * scaleY];
          const confidence = prediction.probability ? prediction.probability[0] : 1;
          
          // Color based on face count: green for 1 face, red for multiple
          const color = stableFaceCount === 1 ? '#00ff00' : '#ff0000';
          
          // Draw rectangle around detected face
          context.strokeStyle = color;
          context.lineWidth = 3;
          context.strokeRect(scaledStart[0], scaledStart[1], size[0], size[1]);
          
          // Draw confidence score with background for better readability
          context.fillStyle = 'rgba(0, 0, 0, 0.7)';
          context.fillRect(scaledStart[0], scaledStart[1] - 25, 100, 20);
          context.fillStyle = color;
          context.font = 'bold 14px Arial';
          context.fillText(
            `${Math.round(confidence * 100)}% Face`, 
            scaledStart[0] + 5, 
            scaledStart[1] - 10
          );
        });
      }

      // Real-time violation detection and reporting
      if (interviewId && interviewStarted && !interviewCompleted) {
        try {
          // Send webcam snapshot to backend (throttled)
          const now = Date.now();
          if (now - lastSnapshotAtRef.current > 3000) {
            lastSnapshotAtRef.current = now;
            const snapshotData = canvas.toDataURL('image/jpeg', 0.7);

            api.post('/interview/update-webcam-snapshot', {
              interviewId,
              snapshot: snapshotData,
              faceCount: stableFaceCount
            }).catch(err => {
              console.log('Snapshot upload queued or rate-limited');
            });
          }

          // Report face detection to backend
          api.post('/interview/report-face-detection', {
            interviewId,
            facesDetected: stableFaceCount
          }).then(response => {
            if (response.data?.analysis) {
              console.log('📊 Backend Analysis:', response.data.analysis);
            }
            
            if (response.data?.warning) {
              console.warn('⚠️ Backend Warning:', response.data.warning);
              
              if (response.data.flagged) {
                // Only alert once per violation type to avoid spam
                if (lastViolationType !== (stableFaceCount === 0 ? 'NO_FACE' : 'MULTIPLE_FACES')) {
                  alert('🚨 ' + response.data.warning);
                }
              }
            }
          }).catch(err => {
            console.error('Face detection report failed:', err.message);
          });

          // Client-side warnings with enhanced violation tracking
          if (stableFaceCount !== 1) {
            let warningMessage = '';
            let violationType = null;
            
            if (stableFaceCount === 0) {
              violationType = 'NO_FACE';
              warningMessage = `🚨 [${new Date().toLocaleTimeString()}] NO FACE DETECTED! Please ensure you are visible on camera.`;
              console.warn('🚨 VIOLATION: No face detected!');
              
              // Track consecutive no-face violations - CUMULATIVE (never decreases)
              noFaceCountRef.current += 1;
              setNoFaceCount(prev => Math.max(prev + 1, noFaceCountRef.current));
              console.log(`📊 No Face Count INCREMENTED to: ${noFaceCountRef.current} (Total Violations)`);
              
              // Play warning sound
              try {
                playWarningSound();
              } catch (err) {
                console.log('Warning sound error:', err.message);
              }
              
              // Show visual alert for severe violations (every 3rd violation to avoid spam)
              if (noFaceCountRef.current % 3 === 0) {
                try {
                  showViolationAlert('NO FACE DETECTED', 'Please ensure your face is visible to the camera immediately!');
                } catch (err) {
                  console.log('Alert error:', err.message);
                }
              }
            } else if (stableFaceCount > 1) {
              violationType = 'MULTIPLE_FACES';
              warningMessage = `🚨 [${new Date().toLocaleTimeString()}] MULTIPLE FACES DETECTED (${stableFaceCount})! Only the candidate should be visible.`;
              console.warn('🚨 VIOLATION: Multiple faces detected!');
              
              // Track multiple face violations - CUMULATIVE (never decreases)
              multipleFaceCountRef.current += 1;
              setMultipleFaceCount(prev => Math.max(prev + 1, multipleFaceCountRef.current));
              console.log(`📊 Multiple Face Count INCREMENTED to: ${multipleFaceCountRef.current} (Total Violations)`);
              
              // Play warning sound
              try {
                playWarningSound();
              } catch (err) {
                console.log('Warning sound error:', err.message);
              }
              
              // Show visual alert for severe violations (every 3rd violation to avoid spam)
              if (multipleFaceCountRef.current % 3 === 0) {
                try {
                  showViolationAlert('MULTIPLE FACES DETECTED', `${stableFaceCount} faces detected. Only you should be visible!`);
                } catch (err) {
                  console.log('Alert error:', err.message);
                }
              }
            }

            if (warningMessage && violationType !== lastViolationType) {
              setMalpractices(prev => ({
                ...prev,
                warnings: [...prev.warnings, warningMessage]
              }));
              setLastViolationType(violationType);
            }
          } else {
            // ✅ Face detected properly - ONLY clear violation type flag
            // 🔒 IMPORTANT: Cumulative counters (noFaceCountRef, multipleFaceCountRef) are NEVER reset
            // They track TOTAL violations throughout the ENTIRE interview
            if (lastViolationType !== null) {
              console.log('✅ Face properly detected again - violation cleared');
              console.log(`🔒 COUNTERS PRESERVED (NEVER RESET) - No Face Total: ${noFaceCountRef.current}, Multiple Face Total: ${multipleFaceCountRef.current}`);
              setLastViolationType(null);
            }
          }
        } catch (err) {
          console.error('❌ Face detection report error:', err);
          // Don't stop detection loop on backend error - keep monitoring locally
        }
      }
    } catch (err) {
      console.error('❌ Face detection error:', err);
      console.error('   - Error name:', err.name);
      console.error('   - Error message:', err.message);
      setFaceCount(0);
      // Don't stop the detection loop - error might be temporary
      console.log('🔄 Face detection will retry on next interval');
    }
  };

  // Cleanup webcam on unmount or when interview completes
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting - cleaning up resources...');
      stopWebcam();
      stopListening();
      stopSpeaking();
    };
  }, []);
  
  // Stop monitoring when interview is completed
  useEffect(() => {
    if (interviewCompleted) {
      console.log('✅ Interview completed - stopping all monitoring');
      stopWebcam();
      stopListening();
      stopSpeaking();
    }
  }, [interviewCompleted]);

  // Reset voice and recording states when interview starts (handles page refresh)
  useEffect(() => {
    if (interviewStarted && !interviewCompleted) {
      console.log('🔄 Interview active - ensuring voice states are reset');
      
      // Reset all voice/recording states to clean state
      setIsListening(false);
      setIsRecording(false);
      setIsSpeaking(false);
      setInterimTranscript('');
      
      // Clear any existing refs
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (e) {
          console.log('Recognition ref cleanup:', e.message);
        }
      }
      
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          mediaRecorderRef.current = null;
        } catch (e) {
          console.log('MediaRecorder ref cleanup:', e.message);
        }
      }
      
      // Stop any ongoing speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      console.log('✅ Voice states reset - ready for user input');
    }
  }, [interviewStarted, interviewCompleted]);

  // Text-to-Speech: AI reads question aloud
  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech not supported in your browser');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Check internet connectivity
  const checkInternetConnection = async () => {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', { 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Test voice availability on component mount
  useEffect(() => {
    const testVoiceAvailability = async () => {
      // Detect if running in Brave browser
      const isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function';
      
      // Check if browser supports Web Speech API
      const hasWebSpeech = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
      
      // Check if browser supports MediaRecorder (for fallback)
      const hasMediaRecorder = ('MediaRecorder' in window);
      
      if (isBrave) {
        // Brave browser detected - check if speech API is available
        try {
          const braveStatus = await navigator.brave.isBrave();
          if (braveStatus) {
            console.log('🦁 Brave browser detected');
            if (hasWebSpeech) {
              console.log('✅ Web Speech API available in Brave (shields may need adjustment)');
              setVoiceAvailable(true);
            } else {
              console.log('⚠️ Web Speech API blocked by Brave shields. Using fallback mode.');
              setVoiceAvailable(hasMediaRecorder);
            }
            return;
          }
        } catch (e) {
          console.log('Browser detection check completed');
        }
      }
      
      if (hasWebSpeech) {
        console.log('✅ Web Speech API available (Chrome/Edge)');
        setVoiceAvailable(true);
        return;
      }
      
      if (hasMediaRecorder) {
        console.log('✅ MediaRecorder available (Firefox/Safari) - will use recording + transcription');
        setVoiceAvailable(true);
        return;
      }
      
      console.log('❌ No voice input support available');
      setVoiceAvailable(false);
    };

    testVoiceAvailability();
  }, []);

  // Speech-to-Text: Convert candidate's voice to text
  const startListening = async () => {
    // Stop any existing recognition first (cleanup from previous session or refresh)
    if (recognitionRef.current) {
      try {
        console.log('🧹 Cleaning up existing recognition before starting new one');
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (e) {
        console.log('Recognition cleanup:', e.message);
      }
    }
    
    // Stop any existing media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        console.log('🧹 Cleaning up existing media recorder before starting new one');
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      } catch (e) {
        console.log('MediaRecorder cleanup:', e.message);
      }
    }
    
    // Reset states
    setIsListening(false);
    setIsRecording(false);
    setInterimTranscript('');
    
    // Check if browser supports Web Speech API (Chrome/Edge)
    const hasWebSpeech = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    
    console.log('🎤 Starting voice input - Web Speech API:', hasWebSpeech);
    
    if (hasWebSpeech) {
      // Use Web Speech API for Chrome/Edge
      await startWebSpeechRecognition();
    } else {
      // Use MediaRecorder API for Firefox/Safari/Others
      await startAudioRecording();
    }
  };

  // Web Speech API (Chrome/Edge)
  const startWebSpeechRecognition = async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Request microphone permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Release immediately
        console.log('✅ Microphone permission granted');
      } catch (permError) {
        console.error('❌ Microphone permission denied:', permError);
        alert('❌ Microphone Access Required!\n\nPlease allow microphone access:\n1. Click the camera/mic icon in your browser address bar\n2. Allow microphone access\n3. Try again');
        return;
      }
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimText = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            console.log('✅ Final transcript:', transcript);
          } else {
            interimText += transcript;
          }
        }

        // Show interim results in real-time (non-blocking)
        if (interimText) {
          console.log('📝 Interim transcript:', interimText);
          setInterimTranscript(interimText);
        }

        // Update answer with transcribed text (non-blocking)
        if (finalTranscript) {
          console.log('💬 Adding to answer:', finalTranscript);
          setAnswer(prev => prev + finalTranscript);
          setInterimTranscript('');
        }
      };

      recognition.onerror = async (event) => {
        console.error('❌ Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          console.log('⚠️ No speech detected, continuing to listen...');
          // Don't stop on no-speech, just keep listening
          return;
        }
        
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          // Check if this is Brave browser
          const isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function';
          let braveDetected = false;
          
          if (isBrave) {
            try {
              braveDetected = await navigator.brave.isBrave();
            } catch (e) {
              // Ignore error
            }
          }
          
          if (braveDetected) {
            alert('❌ Microphone Access Blocked!\n\n🦁 Brave Browser Detected\n\nTo enable voice input in Brave:\n1. Click the 🦁 Brave Shields icon (top-right)\n2. Turn OFF "Block fingerprinting"\n3. Allow microphone access\n4. Refresh the page and try again\n\nAlternatively:\n✅ Type your answer in the text box below');
          } else {
            alert('❌ Microphone Access Denied!\n\nTo fix this:\n1. Click the 🔒 lock icon in the address bar\n2. Allow microphone access\n3. Refresh the page and try again');
          }
          setIsListening(false);
          setVoiceAvailable(false);
          return;
        }
        
        if (event.error === 'network') {
          console.error('Network error - speech service unavailable');
          
          // Check if this is Brave browser
          const isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function';
          let braveDetected = false;
          
          if (isBrave) {
            try {
              braveDetected = await navigator.brave.isBrave();
            } catch (e) {
              // Ignore error
            }
          }
          
          if (braveDetected) {
            alert('❌ Voice Recognition Blocked!\n\n🦁 Brave Browser Privacy Settings\n\nBrave blocks Google speech services by default.\n\nTo enable voice input:\n1. Click the 🦁 Brave Shields icon\n2. Turn OFF "Block fingerprinting"\n3. Reload the page\n\n✅ Or type your answer in the text box below');
          } else {
            alert('❌ Voice Recognition Unavailable\n\n⚠️ Internet connection required for voice input.\n\n✅ Please check your internet connection\n✅ Or type your answer in the text box below');
          }
          setIsListening(false);
          setVoiceAvailable(false);
          return;
        }
        
        if (event.error === 'aborted') {
          // Recognition was intentionally stopped, don't show error
          console.log('🛑 Recognition stopped by user');
          setIsListening(false);
          return;
        }

        if (event.error === 'audio-capture') {
          alert('❌ Microphone Error!\n\n⚠️ Cannot access your microphone.\n\nPlease check:\n✅ Microphone is connected\n✅ Microphone is not being used by another app\n✅ Browser has microphone permission');
          setIsListening(false);
          setVoiceAvailable(false);
          return;
        }
        
        // For other errors, log and try to continue
        console.warn('Speech recognition error (continuing):', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        
        // If still supposed to be listening, restart it (non-blocking)
        if (isListening && recognitionRef.current) {
          setTimeout(() => {
            try {
              if (isListening) {
                recognitionRef.current.start();
              }
            } catch (error) {
              console.error('Failed to restart:', error);
              setIsListening(false);
            }
          }, 100); // Small delay to prevent rapid restart issues
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('❌ Error initializing speech recognition:', error);
      alert('❌ Failed to start speech recognition. Please check your microphone permissions.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    console.log('🛑 Stopping speech recognition');
    
    // Stop Web Speech API if active
    if (recognitionRef.current) {
      try {
        setIsListening(false);
        setInterimTranscript('');
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    // Stop MediaRecorder if active
    if (mediaRecorderRef.current && isRecording) {
      stopAudioRecording();
    }
  };

  // MediaRecorder API (Firefox/Safari/Others)
  const startAudioRecording = async () => {
    try {
      console.log('🎙️ Starting audio recording (MediaRecorder)...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing audio...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Show processing message
        setInterimTranscript('Processing audio...');
        
        // Send to backend for transcription
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          const response = await api.post('/interview/transcribe-audio', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.data.text) {
            console.log('✅ Transcription:', response.data.text);
            setAnswer(prev => prev + response.data.text + ' ');
            setInterimTranscript('');
          } else {
            throw new Error('No transcription received');
          }
        } catch (error) {
          console.error('❌ Transcription error:', error);
          alert('❌ Voice transcription failed.\n\n💡 Fallback: Please type your answer in the text box below.');
          setInterimTranscript('');
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsListening(false);
      };
      
      recorder.start();
      setIsRecording(true);
      setIsListening(true);
      console.log('✅ Recording started (speak now)');
      
      // Show visual feedback
      alert('🎤 Recording Started!\n\n✅ Speak your answer now\n🛑 Click the microphone button again to stop\n\nYour speech will be transcribed when you stop recording.');
      
    } catch (error) {
      console.error('❌ Error starting audio recording:', error);
      if (error.name === 'NotAllowedError') {
        alert('❌ Microphone Access Denied!\n\nPlease allow microphone access in your browser settings.');
      } else {
        alert('❌ Failed to start audio recording.\n\n💡 Please type your answer in the text box below.');
      }
      setIsRecording(false);
      setIsListening(false);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('🛑 Stopping audio recording...');
      mediaRecorderRef.current.stop();
    }
  };

  // API calls
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('candidateToken')}`
    }
  });

  const loadAcceptedInterview = async (id) => {
    try {
      setLoadingInterview(true);
      const response = await api.get(`/interview/${id}`);
      const interview = response.data;
      
      if (interview.applicationStatus !== 'accepted') {
        alert('This interview has not been accepted by the recruiter yet.');
        navigate('/candidate/dashboard');
        return;
      }
      
      // Check if interview was auto-completed due to time expiration
      if (interview.status === 'completed') {
        if (interview.autoSubmitted) {
          alert('⏰ This interview was automatically submitted due to time limit expiration.');
        } else {
          alert('This interview has already been completed.');
        }
        localStorage.removeItem('activeInterviewId');
        navigate('/candidate/dashboard');
        return;
      }

      // If interview is already in-progress, resume it
      if (interview.status === 'in-progress') {
        setStream(interview.stream);
        setDifficulty(interview.difficulty);
        setInterviewId(id);
        setIsFromAcceptedApplication(true);
        setQuestions(interview.questions || []);
        setInterviewStarted(true);
        setCurrentQuestionIndex(interview.currentQuestionIndex || 0);
        
        // Set time limit from interview data
        const timeLimitMinutes = interview.timeLimit || 30;
        setTimeLimit(timeLimitMinutes);
        // Calculate remaining time (if interview has a start time, calculate elapsed time)
        if (interview.startTime || interview.startedAt) {
          const startTime = new Date(interview.startTime || interview.startedAt);
          const elapsedMinutes = Math.floor((new Date() - startTime) / 1000 / 60);
          const remainingMinutes = Math.max(0, timeLimitMinutes - elapsedMinutes);
          setRemainingTime(remainingMinutes * 60); // Convert to seconds
          console.log(`⏱️ Resume: ${timeLimitMinutes}min total, ${elapsedMinutes}min elapsed, ${remainingMinutes}min remaining`);
        } else {
          // No start time recorded, use full time limit
          setRemainingTime(timeLimitMinutes * 60);
          console.log(`⏱️ Resume: ${timeLimitMinutes}min time limit (full time)`);
        }
        
        // 🆕 WAIT FOR MODEL TO LOAD BEFORE STARTING WEBCAM
        console.log('🔄 Resuming interview, waiting for model to load...');
        
        // Create a promise that resolves when model is loaded
        const waitForModel = new Promise((resolve) => {
          // Check if model is already loaded
          if (faceDetectionModel) {
            console.log('✅ Model already loaded');
            resolve();
            return;
          }
          
          // Otherwise, wait for it to load (check every 100ms)
          const checkInterval = setInterval(() => {
            if (faceDetectionModel) {
              console.log('✅ Model loaded, clearing interval');
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
          
          // Safety timeout: if model doesn't load in 10 seconds, continue anyway
          setTimeout(() => {
            console.warn('⚠️ Model loading timeout, continuing without full detection');
            clearInterval(checkInterval);
            resolve();
          }, 10000);
        });
        
        // Wait for model to be ready
        await waitForModel;
        
        // Now start webcam and face detection
        setTimeout(async () => {
          try {
            await startWebcam();
            console.log('✅ Webcam started successfully on resume');
            console.log('✅ Face detection will start automatically');
          } catch (err) {
            console.error('❌ Webcam start error on resume:', err);
          }
        }, 500);
        
        alert(`✅ Resuming interview! Stream: ${interview.stream}, Difficulty: ${interview.difficulty}.`);
        return;
      }
      
      // Pre-set stream and difficulty from the recruiter's interview
      setStream(interview.stream);
      setDifficulty(interview.difficulty);
      setInterviewId(id);
      setIsFromAcceptedApplication(true);
      
      alert(`✅ Interview loaded! Stream: ${interview.stream}, Difficulty: ${interview.difficulty}. Click "Start Interview" to begin.`);
    } catch (error) {
      console.error('Error loading interview:', error);
      alert('Failed to load interview. Please try again.');
      navigate('/candidate/dashboard');
    } finally {
      setLoadingInterview(false);
    }
  };

  const startInterview = async () => {
    try {
      setLoading(true);
      
      // WAIT FOR MODEL TO LOAD (with automatic retry and fallback)
      console.log('⏳ Ensuring face detection model is loaded...');
      
      if (!faceDetectionModel) {
        console.log('⏳ Model not loaded yet, attempting to reload...');
        setModelLoading(true);
        
        // Try loading the model with more attempts
        let modelLoaded = false;
        const maxAttempts = 5;
        
        for (let i = 0; i < maxAttempts && !modelLoaded; i++) {
          try {
            console.log(`🔄 Loading attempt ${i + 1}/${maxAttempts}...`);
            await tf.ready();
            const model = await blazeface.load({
              maxFaces: 10,
              iouThreshold: 0.3,
              scoreThreshold: 0.75
            });
            setFaceDetectionModel(model);
            modelLoaded = true;
            console.log('✅ Model loaded successfully!');
            setModelLoading(false);
          } catch (loadError) {
            console.warn(`⚠️ Load attempt ${i + 1} failed:`, loadError);
            if (i < maxAttempts - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between attempts
            }
          }
        }
        
        if (!modelLoaded) {
          setModelLoading(false);
          console.warn('⚠️ Face detection model could not be loaded after multiple attempts');
          
          // Ask user if they want to proceed without face detection
          const proceed = window.confirm(
            '⚠️ Face detection model failed to load.\n\n' +
            'This may be due to:\n' +
            '• Slow internet connection\n' +
            '• Browser compatibility issues\n' +
            '• Firewall/network restrictions\n\n' +
            'Do you want to proceed WITHOUT face detection?\n' +
            '(Interview will continue but face monitoring may be limited)'
          );
          
          if (!proceed) {
            setLoading(false);
            return;
          }
          
          console.log('⚠️ Proceeding without face detection model');
        }
      } else {
        console.log('✅ Model already loaded');
      }
      
      console.log('✅ Model ready, preparing interview UI...');
      
      // Pre-fetch interview data FIRST (before starting webcam)
      const requestBody = isFromAcceptedApplication 
        ? { interviewId }  // Use the state variable, not URL param
        : { stream, difficulty };
      
      const response = await api.post('/interview/start', requestBody);

      setInterviewId(response.data.interviewId);
      setQuestions(response.data.questions);
      
      // Set time limit from response (in minutes) and convert to seconds for countdown
      const timeLimitMinutes = response.data.timeLimit || 30;
      const questionCount = response.data.questionCount || 5;
      setTimeLimit(timeLimitMinutes);
      setRemainingTime(timeLimitMinutes * 60); // Convert to seconds
      
      console.log(`⏱️ Interview timer set: ${timeLimitMinutes} minutes (${questionCount} questions)`);
      
      // Save interview ID to localStorage for page refresh recovery
      localStorage.setItem('activeInterviewId', response.data.interviewId);
      
      // Set interview started to TRUE first, so video element gets rendered
      setInterviewStarted(true);
      setCurrentQuestionIndex(0);
      
      // Wait a bit for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // NOW start webcam with retry logic (after video element exists)
      console.log('🎥 Starting webcam now that video element is rendered...');
      try {
        await startWebcam();
        console.log('✅ Webcam started successfully'); 
      } catch (webcamError) {
        console.error('❌ Failed to start webcam:', webcamError);
        setLoading(false);
        // Don't proceed with interview if camera fails
        alert('⚠️ Camera is required for proctoring.\n\nThe interview cannot start without working camera access.\n\nPlease:\n1. Grant camera permissions\n2. Ensure no other app is using your camera\n3. Try refreshing the page\n\nIf issues persist, contact support.');
        // Reset interview state if webcam fails
        setInterviewStarted(false);
        return;
      }
      
      // Verify webcam is actually active before proceeding
      if (!webcamActive || !videoRef.current || !videoRef.current.srcObject) {
        throw new Error('Webcam failed to activate properly');
      }
      
      // Automatically read the first question
      if (response.data.questions.length > 0) {
        setTimeout(() => {
          speakQuestion(response.data.questions[0].question);
        }, 500); // Small delay to ensure UI is ready
      }
      
      alert('✅ Interview started! Questions have been generated based on your stream.');
    } catch (error) {
      console.error('Start interview error:', error.response || error);
      alert('❌ Error starting interview: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert('Please provide an answer');
      return;
    }

    // Stop listening before submitting to prevent interference
    if (isListening) {
      stopListening();
    }

    try {
      setLoading(true);
      const response = await api.post('/interview/submit-answer', {
        interviewId,
        questionIndex: currentQuestionIndex,
        answer
      });

      const aiDetection = response.data.aiDetection;
      
      if (aiDetection.isAiGenerated) {
        const warning = `⚠️ AI-Generated Content Detected! Confidence: ${aiDetection.confidence}%`;
        setMalpractices(prev => ({
          ...prev,
          aiDetections: prev.aiDetections + 1,
          warnings: [...prev.warnings, warning]
        }));
        alert(warning);
      } else {
        alert(`✅ Answer submitted successfully! AI Detection: ${aiDetection.confidence}% (Natural)`);
      }

      setAnswer('');
      setInterimTranscript(''); // Clear interim transcript
      
      // Move to next question
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        
        // Automatically read the next question
        setTimeout(() => {
          speakQuestion(questions[nextIndex].question);
        }, 500);
      } else {
        alert('All questions answered! Click "Complete Interview" to finish.');
      }

    } catch (error) {
      // Check if time expired
      if (error.response?.data?.timeExpired) {
        alert('⏰ Time limit exceeded! Your interview will be auto-submitted now.');
        completeInterview();
        return;
      }
      
      alert('❌ Error submitting answer: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const reportTabSwitch = async () => {
    try {
      const response = await api.post('/interview/report-tab-switch', {
        interviewId
      });

      const warning = `⚠️ Tab Switch Detected! Total: ${response.data.totalSwitches}`;
      setMalpractices(prev => ({
        ...prev,
        tabSwitches: response.data.totalSwitches,
        warnings: [...prev.warnings, warning]
      }));

      console.log(warning);
      if (response.data.warning) {
        alert(response.data.warning);
      }
    } catch (error) {
      console.error('Tab switch report error:', error);
    }
  };

  const simulateVoiceAnalysis = async () => {
    try {
      setLoading(true);
      const response = await api.post('/interview/report-voice-analysis', {
        interviewId,
        audioFeatures: {
          pitch: Math.random() * 200,
          frequency: Math.random() * 1000,
          duration: Math.random() * 60
        }
      });

      const analysis = response.data.analysis;
      let message = `🎤 Voice Analysis Complete:\n`;
      message += `Multiple Voices: ${analysis.multipleVoicesDetected ? 'YES ⚠️' : 'NO ✓'}\n`;
      message += `Speakers: ${analysis.numberOfSpeakers}\n`;
      message += `Confidence: ${analysis.confidence}%`;

      if (analysis.multipleVoicesDetected) {
        setMalpractices(prev => ({
          ...prev,
          warnings: [...prev.warnings, '⚠️ Multiple voices detected!']
        }));
      }

      alert(message);
    } catch (error) {
      alert('❌ Voice analysis error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const simulateFaceDetection = async (facesCount) => {
    try {
      setLoading(true);
      const response = await api.post('/interview/report-face-detection', {
        interviewId,
        facesDetected: facesCount
      });

      const analysis = response.data.analysis;
      let message = `📸 Face Detection:\n`;
      message += `Faces Detected: ${analysis.facesCount}\n`;
      message += `Issue: ${analysis.hasIssue ? 'YES ⚠️' : 'NO ✓'}`;

      if (analysis.hasIssue) {
        setMalpractices(prev => ({
          ...prev,
          warnings: [...prev.warnings, `⚠️ Face detection issue: ${analysis.type}`]
        }));
      }

      alert(message);
    } catch (error) {
      alert('❌ Face detection error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };


  //Skip question
  const skipQuestion = async () => {
  // Stop listening if active
  if (isListening) {
    stopListening();
  }
  
  // Stop speaking if active
  if (isSpeaking) {
    stopSpeaking();
  }

  try {
    setLoading(true);
    
    // Submit empty answer to backend (marks as skipped)
    await api.post('/interview/submit-answer', {
      interviewId,
      questionIndex: currentQuestionIndex,
      answer: '[SKIPPED]', // Mark as skipped
      skipped: true // Flag to indicate this was skipped
    });

    // Clear current answer
    setAnswer('');
    setInterimTranscript('');
    
    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      // Automatically read the next question
      setTimeout(() => {
        speakQuestion(questions[nextIndex].question);
      }, 500);
      
      alert('⏭️ Question skipped. Moving to next question.');
    } else {
      alert('⏭️ Last question skipped. Click "Complete Interview" to finish.');
    }

  } catch (error) {
    console.error('Skip question error:', error);
    alert('❌ Error skipping question: ' + (error.response?.data?.message || error.message));
  } finally {
    setLoading(false);
  }
};



{/*previous Question*/}

const previousQuestion = () => {
  // Stop all audio activities
  if (isListening) {
    stopListening();
  }
  
  if (isSpeaking) {
    stopSpeaking();
  }

  // Check if there's a previous question
  if (currentQuestionIndex > 0) {
    // Save current answer before going back (optional)
    const currentAnswer = answer;
    
    // Move to previous question
    const prevIndex = currentQuestionIndex - 1;
    setCurrentQuestionIndex(prevIndex);
    
    // Clear current answer (or you can keep it if you want)
    setAnswer('');
    setInterimTranscript('');
    
    // Automatically read the previous question
    setTimeout(() => {
      speakQuestion(questions[prevIndex].question);
    }, 500);
    
    alert(`⬅️ Moved to question ${prevIndex + 1} of ${questions.length}`);
  } else {
    alert('⚠️ This is the first question. Cannot go back further.');
  }
};








  const completeInterview = async () => {
    try {
      setLoading(true);
      
      // Stop all monitoring
      console.log('🏁 Interview completing - stopping all monitoring...');
      stopWebcam();
      stopListening();
      stopSpeaking();
      
      // Clear active interview from localStorage
      localStorage.removeItem('activeInterviewId');
      
      const response = await api.post('/interview/complete', {
        interviewId
      });

      setResults(response.data);
      setInterviewCompleted(true);
      
      alert(`🏁 Interview Completed!\nScore: ${response.data.score}/100\nStatus: ${response.data.status}\n\n📊 Viewing your detailed report...`);
      
      // Navigate to report page after a short delay
      setTimeout(() => {
        navigate(`/interview/${interviewId}/report`);
      }, 1500);
    } catch (error) {
      alert('❌ Error completing interview: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getInterviewStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/interview/stats/summary');
      
      const stats = response.data;
      let message = `📊 Your Interview Statistics:\n\n`;
      message += `Total Interviews: ${stats.totalInterviews}\n`;
      message += `Completed: ${stats.completedInterviews}\n`;
      message += `Flagged: ${stats.flaggedInterviews}\n`;
      message += `Average Score: ${stats.averageScore}/100\n\n`;
      message += `Malpractices:\n`;
      message += `- Tab Switches: ${stats.malpracticeBreakdown.tabSwitches}\n`;
      message += `- Voice Changes: ${stats.malpracticeBreakdown.voiceChanges}\n`;
      message += `- AI Answers: ${stats.malpracticeBreakdown.aiAnswers}`;

      alert(message);
    } catch (error) {
      alert('❌ Error fetching stats: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!localStorage.getItem('candidateToken')) {
    return (
      <div className="ai-interview-container">
        <h2>⚠️ Please login first</h2>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/candidate" style={{ color: '#3498db', fontSize: '1.2em' }}>Go to Login</a>
        </p>
      </div>
    );
  }

  return (
    <div className="ai-interview-container">
      <h1>🎯 AI-Powered Interview System</h1>
      <p className="subtitle">With Advanced Malpractice Detection</p>

      {!interviewStarted && !interviewCompleted && (
        <div className="setup-section">
          <h2>Start Your Interview</h2>

          {loadingInterview && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              background: '#e3f2fd', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p>⏳ Loading interview details...</p>
            </div>
          )}

          {isFromAcceptedApplication && (
            <div style={{ 
              textAlign: 'center', 
              padding: '15px', 
              background: '#d4edda', 
              color: '#155724',
              border: '2px solid #c3e6cb',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <strong>✅ Accepted Interview</strong>
              <p>Stream and difficulty have been set by your recruiter</p>
            </div>
          )}
          
          <div className="form-group">
            <label>Select Stream:</label>
            <select 
              value={stream} 
              onChange={(e) => setStream(e.target.value)}
              disabled={isFromAcceptedApplication || loadingInterview}
              style={isFromAcceptedApplication ? { background: '#f5f5f5', cursor: 'not-allowed' } : {}}
            >
              {streams.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Difficulty:</label>
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={isFromAcceptedApplication || loadingInterview}
              style={isFromAcceptedApplication ? { background: '#f5f5f5', cursor: 'not-allowed' } : {}}
            >
              {difficulties.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <button 
            className="btn btn-primary"
            onClick={startInterview}
            disabled={loading || loadingInterview}
          >
            {loading ? '⏳ Starting...' : '🚀 Start Interview'}
          </button>

          {!isFromAcceptedApplication && (
            <button 
              className="btn btn-secondary"
              onClick={getInterviewStats}
              disabled={loading || loadingInterview}
            >
              📊 View My Statistics
            </button>
          )}
        </div>
      )}

      {interviewStarted && !interviewCompleted && (
        <div className="interview-section">
          <div className="interview-header">
            <h2>📝 Interview in Progress</h2>
            <div className="interview-info">
              <span className="badge">Stream: {stream}</span>
              <span className="badge">Difficulty: {difficulty}</span>
              <span className="badge">Question {currentQuestionIndex + 1}/{questions.length}</span>
              
              {/* 🆕 TIMER DISPLAY */}
              {remainingTime !== null && (
                <span className={`badge ${
                  remainingTime < 60 ? 'badge-danger' : 
                  remainingTime < 300 ? 'badge-warning' : 
                  'badge-info'
                }`}>
                  ⏱️ Time: {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
                </span>
              )}
              
              {/* 🆕 MODEL STATUS BADGE */}
              <span className={`badge ${faceDetectionModel ? 'badge-success' : 'badge-warning'}`}>
                {faceDetectionModel ? '✅ AI Model Ready' : '⏳ Loading AI Model...'}
              </span>
              
              {/* 🆕 WEBCAM STATUS BADGE */}
              <span className={`badge ${webcamActive ? 'badge-success' : 'badge-warning'}`}>
                {webcamActive ? '✅ Camera Active' : '⏳ Starting Camera...'}
              </span>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="interview-layout">
            {/* Left Column - Webcam & Monitoring */}
            <div className="left-column">
              {/* Webcam Monitor */}
              <div className="webcam-section">
                <div className="webcam-container">
                  <h3>📹 Live Monitoring</h3>
                  <div className="webcam-display">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline
                      muted
                      onPlay={() => console.log('✅ Video onPlay event fired')}
                      onLoadedData={() => console.log('✅ Video onLoadedData event fired')}
                      onCanPlay={() => console.log('✅ Video onCanPlay event fired')}
                      className="video-feed"
                    >
                      Your browser does not support video playback.
                    </video>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    
                    {/* Webcam Status Overlay */}
                    <div className={`webcam-status ${faceCount === 1 ? 'good' : 'warning'}`}>
                      {webcamActive ? (
                        <>
                          <span className="live-indicator">🔴 LIVE</span>
                          {faceCount === 1 ? (
                            <><span className="status-icon">✓</span> Face Detected</>
                          ) : faceCount === 0 ? (
                            <><span className="status-icon">⚠️</span> No Face Detected</>
                          ) : (
                            <><span className="status-icon">⚠️</span> Multiple Faces ({faceCount})</>
                          )}
                        </>
                      ) : (
                        <><span className="status-icon">📷</span> Initializing...</>
                      )}
                    </div>
                    
                    {/* Large Violation Warning Banner */}
                    {faceCount !== 1 && webcamActive && (
                      <div className="violation-banner">
                        <div className="violation-banner-content">
                          {faceCount === 0 ? (
                            <>
                              <div className="violation-banner-icon">🚨</div>
                              <div className="violation-banner-text">
                                <strong>NO FACE DETECTED</strong>
                                <div>Position yourself in front of the camera</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="violation-banner-icon">🚨</div>
                              <div className="violation-banner-text">
                                <strong>MULTIPLE FACES DETECTED</strong>
                                <div>Only you should be visible ({faceCount} faces found)</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Malpractice Monitor */}
              <div className="malpractice-monitor">
                <h3>🚨 Proctoring System</h3>
                
                {/* Real-time Monitoring Status */}
                <div className="monitoring-status">
                  {webcamActive ? (
                    <div className="status-active">
                      <span className="pulse-dot"></span>
                      <span>🔴 LIVE MONITORING - Real-time face detection active</span>
                    </div>
                  ) : (
                    <div className="status-inactive">
                      <span>⏸️ Monitoring Paused</span>
                    </div>
                  )}
                </div>
                
                <div className="monitor-stats">
                  <div className="stat-item">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-content">
                      <span className="stat-label">Tab Switches</span>
                      <span className={`stat-value ${malpractices.tabSwitches > 2 ? 'warning' : ''}`}>
                        {malpractices.tabSwitches}
                      </span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">🤖</div>
                    <div className="stat-content">
                      <span className="stat-label">AI Detections</span>
                      <span className={`stat-value ${malpractices.aiDetections > 0 ? 'warning' : ''}`}>
                        {malpractices.aiDetections}
                      </span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">👤</div>
                    <div className="stat-content">
                      <span className="stat-label">Face Status</span>
                      <span className={`stat-value ${faceCount !== 1 ? 'warning' : ''}`}>
                        {faceCount === 1 ? 'OK' : faceCount === 0 ? 'None' : 'Multiple'}
                      </span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">�</div>
                    <div className="stat-content">
                      <span className="stat-label">Total Face Violations</span>
                      <span className={`stat-value ${(noFaceCount + multipleFaceCount) > 0 ? 'warning' : ''}`}>
                        {noFaceCount + multipleFaceCount}
                      </span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">�🚫</div>
                    <div className="stat-content">
                      <span className="stat-label">No Face Violations</span>
                      <span className={`stat-value ${noFaceCount > 0 ? 'warning' : ''}`}>
                        {noFaceCount} {noFaceCount === 1 ? 'time' : 'times'}
                      </span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <span className="stat-label">Multiple Face Violations</span>
                      <span className={`stat-value ${multipleFaceCount > 0 ? 'warning' : ''}`}>
                        {multipleFaceCount} {multipleFaceCount === 1 ? 'time' : 'times'}
                      </span>
                    </div>
                  </div>
                </div>
                {malpractices.warnings.length > 0 && (
                  <div className="warnings-list">
                    <h4>⚠️ Recent Warnings</h4>
                    {malpractices.warnings.slice(-3).map((w, i) => (
                      <div key={i} className="warning-item">
                        <span className="warning-dot"></span>
                        {w}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Questions & Answers */}
            <div className="right-column">
              {/* Question Card */}
              <div className="question-card">
                <div className="question-header">
                  <span className="question-number">Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span className="question-category">
                    {questions[currentQuestionIndex]?.category || 'General'}
                  </span>
                </div>
                <div className="question-text">
                  {questions[currentQuestionIndex]?.question}
                </div>
                
                {/* Voice Controls for Question */}
                <div className="voice-controls">
                  <button
                    className="btn-voice"
                    onClick={() => speakQuestion(questions[currentQuestionIndex]?.question)}
                    disabled={isSpeaking}
                  >
                    {isSpeaking ? '🔊 Speaking...' : '🔊 Read Aloud'}
                  </button>
                  {isSpeaking && (
                    <button className="btn-voice-stop" onClick={stopSpeaking}>
                      🛑 Stop
                    </button>
                  )}
                </div>
              </div>

              {/* Answer Section */}
              <div className="answer-section">
                <div className="answer-header">
                  <h3>Your Answer</h3>
                  
                  {/* Voice availability status */}
                  {voiceAvailable === false && (
                    <div className="voice-unavailable-notice">
                      <strong>⚠️ Voice Input Unavailable</strong>
                      <p>Please type your answer below.</p>
                    </div>
                  )}
                  
                  {/* Voice Input Controls */}
                  {voiceAvailable !== false && (
                    <div className="voice-input-controls">
                      {!isListening ? (
                        <button className="btn-microphone" onClick={startListening}>
                          🎤 Start Voice Answer
                        </button>
                      ) : (
                        <>
                          <button className="btn-microphone-stop" onClick={stopListening}>
                            🔴 Stop Recording
                          </button>
                          <span className="listening-indicator">
                            <span className="pulse-dot"></span>
                            Listening...
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

            {/* Answer Textarea */}
            <textarea
              className="answer-textarea"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={voiceAvailable === false 
                ? "✍️ Type your answer here..." 
                : "Type or speak your answer..."}
              rows="10"
              disabled={loading}
            />
            
            {/* Show interim transcript in real-time */}
            {isListening && interimTranscript && (
              <div className="interim-transcript">
                <strong>🎙️ Hearing:</strong> {interimTranscript}
                <span className="cursor-blink"></span>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="answer-actions">
              <button 
                className="btn btn-submit"
                onClick={submitAnswer}
                disabled={loading || !answer.trim()}
              >
                {loading ? '⏳ Submitting...' : '✅ Submit Answer'}
              </button>
            
              {/* Skip Question Button */}
              <button
                 className = "btn btn-skip"
                  onClick={skipQuestion}
                  disabled={loading}
              >
                {loading ? '⏳ Skipping...' : '⏭️ Skip Question'}
              </button>

              {/* Previous Question Button */}
              <button
                 className = "btn btn-previous"
                  onClick={previousQuestion}
                  disabled={loading}
              >
                {loading ? '⏳ Going Back...' : '⬅️ Previous Question'}
              </button>

              <button 
                className="btn btn-complete"
                onClick={completeInterview}
                disabled={loading}
              >
                {loading ? '⏳ Processing...' : '🏁 Complete Interview'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

      {interviewCompleted && results && (
        <div className="results-section">
          <h2>🎉 Interview Completed!</h2>
          
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
                  {results.flagged && ' 🚩'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{results.duration} minutes</span>
              </div>
            </div>

            <div className="malpractices-summary">
              <h3>🚨 Malpractices Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-number">{results.malpracticesSummary.total}</span>
                  <span className="summary-label">Total Violations</span>
                </div>
                <div className="summary-item">
                  <span className="summary-number">{results.malpracticesSummary.tabSwitches}</span>
                  <span className="summary-label">Tab Switches</span>
                </div>
                <div className="summary-item">
                  <span className="summary-number">{results.malpracticesSummary.voiceChanges}</span>
                  <span className="summary-label">Voice Changes</span>
                </div>
                <div className="summary-item">
                  <span className="summary-number">{results.malpracticesSummary.aiAnswers}</span>
                  <span className="summary-label">AI Answers</span>
                </div>
              </div>
            </div>

            {results.flagged && (
              <div className="flagged-notice">
                🚩 This interview has been flagged due to multiple high-severity malpractices.
                A recruiter will review it.
              </div>
            )}
          </div>

          <div className="button-group">
            <button 
              className="btn btn-primary"
              onClick={() => {
                setInterviewStarted(false);
                setInterviewCompleted(false);
                setInterviewId(null);
                setQuestions([]);
                setAnswer('');
                setMalpractices({ tabSwitches: 0, aiDetections: 0, warnings: [] });
                setResults(null);
                // Reset face violation counters for new interview
                noFaceCountRef.current = 0;
                multipleFaceCountRef.current = 0;
                setNoFaceCount(0);
                setMultipleFaceCount(0);
                setFaceCount(0);
                console.log('🔄 Face violation counters reset for new interview');
              }}
            >
              🔄 Start New Interview
            </button>
            <button 
              className="btn btn-secondary"
              onClick={getInterviewStats}
            >
              📊 View All Statistics
            </button>
          </div>
        </div>
      )}

      <div className="features-info">
        <h3>🎓 AI Features Demonstrated:</h3>
        <ul>
          <li>✅ AI question generation based on stream and difficulty</li>
          <li>✅ Real-time AI-generated answer detection</li>
          <li>✅ Automatic tab switching detection</li>
          <li>✅ Voice analysis for multiple speakers</li>
          <li>✅ Face detection monitoring</li>
          <li>✅ Automated scoring with penalty system</li>
          <li>✅ Interview flagging for suspicious behavior</li>
        </ul>
      </div>
    </div>
  );
};

export default AIInterview;
