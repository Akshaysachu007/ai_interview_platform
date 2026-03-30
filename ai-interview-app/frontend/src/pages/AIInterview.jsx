import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import FaceMetricsMonitor from '../components/FaceMetricsMonitor';
import IdentityVerification from '../components/IdentityVerification';
import { useMediaPipeJS } from '../hooks/useInterviewHooks';
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
  const [needsIdentityVerification, setNeedsIdentityVerification] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [questionStartedAt, setQuestionStartedAt] = useState(null); // per-question timing
  const [violationThresholds, setViolationThresholds] = useState(null); // recruiter-set limits
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
  const [faceMetrics, setFaceMetrics] = useState(null); // Face detection metrics from MediaPipe
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
  const [lookingAwayCount, setLookingAwayCount] = useState(0);
  const [lastViolationType, setLastViolationType] = useState(null);
  const noFaceCountRef = useRef(0);
  const multipleFaceCountRef = useRef(0);
  const lookingAwayCountRef = useRef(0);
  const lastMalpracticeWarningRef = useRef({ type: null, time: 0 });
  const detectionInFlightRef = useRef(false);
  const lastSnapshotAtRef = useRef(0);
  const detectionCanvasRef = useRef(null);
  const recentFaceCountsRef = useRef([]);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const pythonFrameIntervalRef = useRef(null);

  // Initialize useMediaPipeJS hook for browser-based face detection
  const {
    videoRef: mediapiperVideoRef,
    faceMetrics: mediapipeFaceMetrics,
    error: mediapipeError,
    loading: mediapipeLoading,
    isAnalyzing: metricsAnalyzing,
    pauseRef: mediapipePauseRef,
    startWebcam: startMediaPipeWebcam,
    stopWebcam: stopMediaPipeWebcam,
    analyzeFrame,
    detectFaces
  } = useMediaPipeJS();

  // Violation alert modal state
  const [violationAlertVisible, setViolationAlertVisible] = useState(false);
  const [violationAlertTitle, setViolationAlertTitle] = useState('');
  const [violationAlertMsg, setViolationAlertMsg] = useState('');
  const violationAlertActiveRef = useRef(false);

  // Use MediaPipe's videoRef so it's connected to the actual DOM element
  // This ensures the hook can access the video stream for face detection
  const videoRef = mediapiperVideoRef;

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

        // Wait for TensorFlow.js to be ready with timeout
        const readyPromise = tf.ready();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('TensorFlow ready timeout')), 5000)
        );
        
        await Promise.race([readyPromise, timeoutPromise]);
        console.log('✅ TensorFlow.js backend ready:', tf.getBackend());
        
        // Load BlazeFace model with explicit configuration
        const model = await blazeface.load({
          maxFaces: 3,
          iouThreshold: 0.5,
          scoreThreshold: 0.6
        });
        
        setFaceDetectionModel(model);
        console.log('✅ Face detection model loaded successfully!');
        console.log('   - Max faces: 3');
        console.log('   - Score threshold: 0.6');
        setModelLoading(false);
        return; // Success, exit retry loop
      } catch (error) {
        attempt++;
        console.error(`❌ Error loading face detection model (Attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt >= maxRetries) {
          console.warn('⚠️ Could not load face detection model after ' + maxRetries + ' attempts.');
          console.warn('   Continuing without face detection...');
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
  // NOTE: BlazeFace is NO LONGER loaded on mount. Assessment face detection uses MediaPipe
  // (loaded by useMediaPipeJS hook). Loading BlazeFace + TensorFlow.js was competing with
  // MediaPipe for WebGL GPU resources, causing both to fail or stall.
  useEffect(() => {
    // loadFaceDetectionModel(); // DISABLED — MediaPipe handles face detection now
    
    // Check if there's an active interview in localStorage (page refresh)
    const activeInterviewId = localStorage.getItem('activeInterviewId');
    if (activeInterviewId && !acceptedInterviewId) {
      console.log('🔄 Detected active interview from localStorage:', activeInterviewId);
      // Load the interview data
      loadAcceptedInterview(activeInterviewId);
    }

    // Load malpractices from localStorage (page refresh recovery)
    const savedMalpractices = localStorage.getItem('currentMalpractices');
    if (savedMalpractices) {
      try {
        const parsed = JSON.parse(savedMalpractices);
        console.log('✅ Loaded malpractices from localStorage:', parsed);
        setMalpractices(parsed);
      } catch (e) {
        console.log('Could not parse saved malpractices');
      }
    }

    // Restore violation counts from localStorage (page refresh recovery)
    const savedViolations = localStorage.getItem('currentViolationCounts');
    if (savedViolations) {
      try {
        const v = JSON.parse(savedViolations);
        console.log('✅ Loaded violation counts from localStorage:', v);
        if (typeof v.noFace === 'number') {
          noFaceCountRef.current = v.noFace;
          setNoFaceCount(v.noFace);
        }
        if (typeof v.multipleFace === 'number') {
          multipleFaceCountRef.current = v.multipleFace;
          setMultipleFaceCount(v.multipleFace);
        }
        if (typeof v.lookingAway === 'number') {
          lookingAwayCountRef.current = v.lookingAway;
          setLookingAwayCount(v.lookingAway);
        }
      } catch (e) {
        console.log('Could not parse saved violation counts');
      }
    }

    // Restore violation thresholds from localStorage (page refresh recovery)
    const savedThresholds = localStorage.getItem('violationThresholds');
    if (savedThresholds) {
      try {
        const t = JSON.parse(savedThresholds);
        setViolationThresholds(t);
        console.log('✅ Loaded violation thresholds from localStorage:', t);
      } catch (e) {
        console.log('Could not parse saved violation thresholds');
      }
    }
  }, []);

  // Load interview details if coming from accepted application
  useEffect(() => {
    if (acceptedInterviewId && !interviewStarted && !loadingInterview) {
      loadAcceptedInterview(acceptedInterviewId);
    }
  }, [acceptedInterviewId]);

  // NOTE: Webcam startup for both fresh-start and page-refresh is handled by
  // the single "Ensure MediaPipe detection" useEffect below (line ~294).
  // We intentionally removed the duplicate "refresh" webcam effect to avoid
  // race conditions (multiple getUserMedia calls, stale closures on faceDetectionModel).

  // Persist malpractices to localStorage whenever they change
  useEffect(() => {
    if (interviewStarted && !interviewCompleted) {
      localStorage.setItem('currentMalpractices', JSON.stringify(malpractices));
      console.log('💾 Saved malpractices to localStorage:', malpractices);
    }
  }, [malpractices, interviewStarted, interviewCompleted]);

  // Persist violation counts to localStorage whenever they change
  useEffect(() => {
    if (interviewStarted && !interviewCompleted) {
      const counts = {
        noFace: noFaceCount,
        multipleFace: multipleFaceCount,
        lookingAway: lookingAwayCount
      };
      localStorage.setItem('currentViolationCounts', JSON.stringify(counts));
      console.log('💾 Saved violation counts to localStorage:', counts);
    }
  }, [noFaceCount, multipleFaceCount, lookingAwayCount, interviewStarted, interviewCompleted]);

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
          alert('⏰ Time\'s up! Your assessment will be submitted automatically.');
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

  // ═══════════════════════════════════════════════════════════════════════════
  // SINGLE consolidated webcam effect — handles BOTH start and stop.
  // Having separate effects caused race conditions where one stopped what the
  // other just started.
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // STOP path: interview not started or completed
    if (!interviewStarted || interviewCompleted) {
      console.log('📹 Webcam effect: interview not active, ensuring cleanup.', 
        { interviewStarted, interviewCompleted });
      if (pythonFrameIntervalRef.current) {
        clearInterval(pythonFrameIntervalRef.current);
        pythonFrameIntervalRef.current = null;
      }
      stopMediaPipeWebcam();
      setWebcamActive(false);
      return;
    }

    // START path: interview is active
    console.log('📱 Webcam effect: interview is active, starting webcam + detection...');
    let cancelled = false;

    const startDetection = async () => {
      try {
        // Give React time to render the <video> element
        await new Promise(resolve => setTimeout(resolve, 800));
        if (cancelled) return;

        console.log('🎥 Calling startMediaPipeWebcam()...');
        await startMediaPipeWebcam();
        if (cancelled) return;

        console.log('✅ MediaPipe webcam started successfully');
        setWebcamActive(true);
      } catch (err) {
        console.error('❌ Error starting webcam detection:', err);
        if (!cancelled) setWebcamActive(false);
      }
    };

    startDetection();

    // Cleanup: stop everything when effect re-runs or component unmounts
    return () => {
      cancelled = true;
      if (pythonFrameIntervalRef.current) {
        clearInterval(pythonFrameIntervalRef.current);
        pythonFrameIntervalRef.current = null;
      }
    };
  }, [interviewStarted, interviewCompleted, startMediaPipeWebcam, stopMediaPipeWebcam]);

  // Helper: show violation alert modal, beep, and pause detection until user clicks OK
  const showViolationModal = (title, msg, violationType) => {
    if (violationAlertActiveRef.current) return; // already showing an alert
    violationAlertActiveRef.current = true;

    // Pause the MediaPipe detection loop
    if (mediapipePauseRef) mediapipePauseRef.current = true;

    // Play beep
    try { playWarningSound(); } catch (e) { /* ignore */ }

    // Set modal content
    setViolationAlertTitle(title);
    setViolationAlertMsg(msg);
    setViolationAlertVisible(true);

    // Log warning to malpractices
    setMalpractices(prev => ({
      ...prev,
      warnings: [...prev.warnings, `🚨 [${new Date().toLocaleTimeString()}] ${title}: ${msg}`]
    }));
  };

  // User clicks OK on violation alert — resume detection
  const handleViolationAlertOk = () => {
    setViolationAlertVisible(false);
    violationAlertActiveRef.current = false;

    // Resume detection
    if (mediapipePauseRef) mediapipePauseRef.current = false;
  };

  // Update faceMetrics from MediaPipe - this syncs hook metrics to component state
  // and tracks malpractice violations (no face, multiple faces, looking away)
  // Also checks violation thresholds for auto-termination
  const terminatingRef = useRef(false); // prevent double-termination
  
  const checkViolationThreshold = (type, currentCount) => {
    if (!violationThresholds || terminatingRef.current) return;
    const limit = violationThresholds[type] || 0;
    if (limit > 0 && currentCount >= limit) {
      terminatingRef.current = true;
      const typeLabels = {
        noFace: 'No Face Detected',
        multipleFace: 'Multiple Faces',
        lookingAway: 'Looking Away',
        tabSwitch: 'Tab Switches',
        voiceChange: 'Voice Changes',
        aiAnswer: 'AI-Generated Answers'
      };
      const reason = `${typeLabels[type] || type} limit exceeded (${currentCount}/${limit})`;
      console.log(`🚫 AUTO-TERMINATE: ${reason}`);
      
      // Close any open violation modal first
      setViolationAlertVisible(false);
      violationAlertActiveRef.current = false;
      
      // Show termination alert and complete
      setTimeout(() => {
        alert(`🚫 INTERVIEW TERMINATED\n\nReason: ${reason}\n\nYour interview has been automatically terminated due to exceeding the allowed violation limit set by the recruiter.`);
        completeInterviewWithTermination(reason);
      }, 300);
    }
  };

  useEffect(() => {
    if (mediapipeFaceMetrics) {
      setFaceMetrics(mediapipeFaceMetrics);

      // Sync faceCount from MediaPipe metrics so the UI status overlay updates
      const detectedCount = mediapipeFaceMetrics.face_count ?? (mediapipeFaceMetrics.face_detected ? 1 : 0);
      setFaceCount(detectedCount);

      // Skip violation tracking while an alert is already showing
      if (violationAlertActiveRef.current) return;

      // 1) No face detected
      if (!mediapipeFaceMetrics.face_detected || detectedCount === 0) {
        noFaceCountRef.current += 1;
        setNoFaceCount(noFaceCountRef.current);
        console.log(`📊 No Face Count INCREMENTED to: ${noFaceCountRef.current}`);

        // Check threshold for auto-termination
        checkViolationThreshold('noFace', noFaceCountRef.current);

        showViolationModal(
          'NO FACE DETECTED',
          'Please position yourself in front of the camera. Detection is paused until you click OK.',
          'NO_FACE'
        );
      }
      // 2) Multiple faces detected
      else if (detectedCount > 1) {
        multipleFaceCountRef.current += 1;
        setMultipleFaceCount(multipleFaceCountRef.current);
        console.log(`📊 Multiple Face Count INCREMENTED to: ${multipleFaceCountRef.current}`);

        // Check threshold for auto-termination
        checkViolationThreshold('multipleFace', multipleFaceCountRef.current);

        showViolationModal(
          'MULTIPLE FACES DETECTED',
          `${detectedCount} faces found! Only you should be visible on camera. Detection is paused until you click OK.`,
          'MULTIPLE_FACES'
        );
      }
      // 3) Looking away — only when exactly one face is detected
      // Uses BOTH iris gaze direction AND head pose yaw/pitch for robust detection
      else if (detectedCount === 1) {
        const gazeDir = mediapipeFaceMetrics.eye_metrics?.gaze_direction;
        const headYaw = mediapipeFaceMetrics.head_pose?.yaw ?? 0;
        const headPitch = mediapipeFaceMetrics.head_pose?.pitch ?? 0;
        const hookViolations = mediapipeFaceMetrics.violations || [];

        // Detect looking away via:
        //  a) iris gaze is off-center
        //  b) head is turned significantly (yaw > 20° or pitch > 15°)
        //  c) the hook itself flagged a "Looking Away" violation
        const gazeAway = gazeDir && gazeDir !== 'center';
        const headAway = Math.abs(headYaw) > 20 || Math.abs(headPitch) > 15;
        const hookAway = hookViolations.some(v => typeof v === 'string' && v.toLowerCase().includes('looking away'));

        if (gazeAway || headAway || hookAway) {
          const reason = gazeAway
            ? `eyes looking ${gazeDir}`
            : headAway
              ? `head turned (yaw: ${Math.round(headYaw)}°, pitch: ${Math.round(headPitch)}°)`
              : 'looking away from screen';

          lookingAwayCountRef.current += 1;
          setLookingAwayCount(lookingAwayCountRef.current);
          console.log(`📊 Looking Away Count INCREMENTED to: ${lookingAwayCountRef.current} (${reason})`);

          // Check threshold for auto-termination
          checkViolationThreshold('lookingAway', lookingAwayCountRef.current);

          showViolationModal(
            'LOOKING AWAY DETECTED',
            `Detected: ${reason}. Please keep your eyes on the screen. Detection is paused until you click OK.`,
            'LOOKING_AWAY'
          );
        }
      }
    }
  }, [mediapipeFaceMetrics]);

  // Use hook's webcam function (already handles stream attachment to videoRef)
  const startWebcam = async () => {
    try {
      console.log('🎥 Starting webcam via MediaPipe hook...');
      await startMediaPipeWebcam();
      console.log('✅ Webcam started successfully');
      setWebcamActive(true);
    } catch (err) {
      console.error('❌ Webcam initialization error:', err);
      setWebcamActive(false);
      throw err;
    }
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

          // Client-side violation tracking (skip if a violation modal is already showing)
          if (!violationAlertActiveRef.current && stableFaceCount !== 1) {
            if (stableFaceCount === 0) {
              console.warn('🚨 VIOLATION (BlazeFace): No face detected!');
              showViolationModal(
                'NO FACE DETECTED',
                'Please position yourself in front of the camera. Detection is paused until you click OK.',
                'NO_FACE'
              );
              // Increment counter once per alert
              noFaceCountRef.current += 1;
              setNoFaceCount(noFaceCountRef.current);
              setLastViolationType('NO_FACE');
            } else if (stableFaceCount > 1) {
              console.warn('🚨 VIOLATION (BlazeFace): Multiple faces detected!');
              showViolationModal(
                'MULTIPLE FACES DETECTED',
                `${stableFaceCount} faces found! Only you should be visible on camera. Detection is paused until you click OK.`,
                'MULTIPLE_FACES'
              );
              multipleFaceCountRef.current += 1;
              setMultipleFaceCount(multipleFaceCountRef.current);
              setLastViolationType('MULTIPLE_FACES');
            }
          } else if (stableFaceCount === 1) {
            if (lastViolationType !== null) {
              console.log('✅ Face properly detected again - violation cleared');
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

  // NOTE: Metrics are now fetched directly from MediaPipe JS hook (useMediaPipeJS)
  // No backend calls needed - all analysis happens in the browser

  // NOTE: Frame streaming removed - using MediaPipe JS hook for in-browser analysis

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
        alert('This job has not been accepted by the recruiter yet.');
        navigate('/candidate/dashboard');
        return;
      }
      
      // Check if interview was auto-completed due to time expiration
      if (interview.status === 'completed') {
        if (interview.autoSubmitted) {
          alert('⏰ This assessment was automatically submitted due to time limit expiration.');
        } else {
          alert('This assessment has already been completed.');
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
        setQuestionStartedAt(new Date().toISOString()); // start timing current question on resume
        
        // Set time limit from interview data
        const timeLimitMinutes = interview.timeLimit || 30;
        setTimeLimit(timeLimitMinutes);

        // Restore violation thresholds from localStorage or interview data
        const savedThresholds = localStorage.getItem('violationThresholds');
        if (savedThresholds) {
          try {
            setViolationThresholds(JSON.parse(savedThresholds));
            console.log('🛡️ Restored violation thresholds from localStorage');
          } catch (e) { /* ignore */ }
        }
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
        
        console.log('✅ Interview resumed - MediaPipe hook will handle webcam');
        
        // NOTE: No alert() here — alert blocks the JS event loop and prevents React
        // from rendering the video element, which prevents the webcam from starting.
        console.log(`✅ Resuming assessment! Stream: ${interview.stream}, Difficulty: ${interview.difficulty}.`);
        return;
      }
      
      // Check if identity verification is required
      if (interview.identityVerificationRequired && !interview.identityVerificationCompleted) {
        setNeedsIdentityVerification(true);
        setIdentityVerified(false);
        console.log('🔐 Identity verification required before starting assessment');
      } else {
        setNeedsIdentityVerification(false);
        setIdentityVerified(true);
      }

      // Pre-set stream and difficulty from the recruiter's interview
      setStream(interview.stream);
      setDifficulty(interview.difficulty);
      setInterviewId(id);
      setIsFromAcceptedApplication(true);
      
      const verificationNote = (interview.identityVerificationRequired && !interview.identityVerificationCompleted) 
        ? ' Please complete identity verification first.' 
        : '';
      alert(`✅ Job loaded! Stream: ${interview.stream}, Difficulty: ${interview.difficulty}.${verificationNote} Click "Start Assessment" to begin.`);
    } catch (error) {
      console.error('Error loading interview:', error);
      alert('Failed to load job. Please try again.');
      navigate('/candidate/dashboard');
    } finally {
      setLoadingInterview(false);
    }
  };

  const startInterview = async () => {
    try {
      setLoading(true);
      
      // NOTE: Face detection during assessment is handled by MediaPipe (useMediaPipeJS hook),
      // NOT by BlazeFace. MediaPipe models load on component mount independently.
      // We no longer block here waiting for BlazeFace — it was causing 30+ second stalls.
      console.log('🚀 Starting assessment (MediaPipe handles face detection)...');
      console.log('   - MediaPipe loading:', mediapipeLoading);
      console.log('   - MediaPipe error:', mediapipeError);
      
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
      
      // Store violation thresholds from recruiter settings
      if (response.data.violationThresholds) {
        setViolationThresholds(response.data.violationThresholds);
        localStorage.setItem('violationThresholds', JSON.stringify(response.data.violationThresholds));
        console.log('🛡️ Violation thresholds set:', response.data.violationThresholds);
      }
      
      console.log(`⏱️ Interview timer set: ${timeLimitMinutes} minutes (${questionCount} questions)`);
      
      // Save interview ID to localStorage for page refresh recovery
      localStorage.setItem('activeInterviewId', response.data.interviewId);
      
      // Set interview started to TRUE first, so video element gets rendered
      setInterviewStarted(true);
      setCurrentQuestionIndex(0);
      setQuestionStartedAt(new Date().toISOString()); // start timing first question
      
      // The useMediaPipeJS hook will start webcam via the useEffect that watches interviewStarted.
      // Don't block here waiting for the webcam — it starts asynchronously after the video
      // element renders. Blocking with a fixed timeout caused race conditions.
      console.log('🎥 Interview started - MediaPipe hook will handle webcam setup asynchronously');
      
      // Automatically read the first question (after a short delay for UI to be ready)
      if (response.data.questions.length > 0) {
        setTimeout(() => {
          speakQuestion(response.data.questions[0].question);
        }, 1500); // Delay to allow webcam + UI to initialize
      }
      
      // NOTE: Using console.log instead of alert() to avoid blocking the event loop.
      // alert() freezes the entire JS thread, preventing React from rendering the video
      // element and webcam effects from firing. This was causing the camera to not start.
      console.log('✅ Assessment started! Questions have been generated.');
    } catch (error) {
      console.error('Start interview error:', error.response || error);
      alert('❌ Error starting assessment: ' + (error.response?.data?.message || error.message));
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
        answer,
        questionStartedAt: questionStartedAt || new Date().toISOString()
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
        setQuestionStartedAt(new Date().toISOString()); // start timing next question
        
        // Automatically read the next question
        setTimeout(() => {
          speakQuestion(questions[nextIndex].question);
        }, 500);
      } else {
        alert('All questions answered! Click "Complete Assessment" to finish.');
      }

    } catch (error) {
      // Check if time expired
      if (error.response?.data?.timeExpired) {
        alert('⏰ Time limit exceeded! Your assessment will be auto-submitted now.');
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

      // Check if backend terminated the interview due to threshold
      if (response.data.terminated) {
        alert(`🚫 INTERVIEW TERMINATED\n\nReason: ${response.data.terminationReason}\n\nYour interview has been automatically terminated due to exceeding the allowed violation limit set by the recruiter.`);
        completeInterviewWithTermination(response.data.terminationReason);
        return;
      }

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
      skipped: true, // Flag to indicate this was skipped
      questionStartedAt: questionStartedAt || new Date().toISOString()
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
      alert('⏭️ Last question skipped. Click "Complete Assessment" to finish.');
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
    setQuestionStartedAt(new Date().toISOString()); // start timing previous question
    
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
      localStorage.removeItem('currentMalpractices');
      localStorage.removeItem('currentViolationCounts');
      localStorage.removeItem('violationThresholds');
      
      const response = await api.post('/interview/complete', {
        interviewId,
        violationCounts: {
          noFaceCount: noFaceCountRef.current,
          multipleFaceCount: multipleFaceCountRef.current,
          lookingAwayCount: lookingAwayCountRef.current
        }
      });

      setResults(response.data);
      setInterviewCompleted(true);
      
      alert(`🏁 Assessment Completed!\nScore: ${response.data.score}/100\nStatus: ${response.data.status}\n\n📊 Viewing your detailed report...`);
      
      // Navigate to report page after a short delay
      setTimeout(() => {
        navigate(`/interview/${interviewId}/report`);
      }, 1500);
    } catch (error) {
      alert('❌ Error completing assessment: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Auto-terminate interview due to violation threshold exceeded
  const completeInterviewWithTermination = async (reason) => {
    try {
      setLoading(true);
      
      console.log(`🚫 Interview TERMINATED — ${reason}`);
      stopWebcam();
      stopListening();
      stopSpeaking();
      
      localStorage.removeItem('activeInterviewId');
      localStorage.removeItem('currentMalpractices');
      localStorage.removeItem('currentViolationCounts');
      localStorage.removeItem('violationThresholds');
      
      const response = await api.post('/interview/complete', {
        interviewId,
        violationCounts: {
          noFaceCount: noFaceCountRef.current,
          multipleFaceCount: multipleFaceCountRef.current,
          lookingAwayCount: lookingAwayCountRef.current
        },
        terminatedByViolation: true,
        terminationReason: reason
      });

      setResults(response.data);
      setInterviewCompleted(true);
      
      setTimeout(() => {
        navigate(`/interview/${interviewId}/report`);
      }, 1500);
    } catch (error) {
      console.error('Error during violation termination:', error);
      // Navigate anyway
      navigate(`/interview/${interviewId}/report`);
    } finally {
      setLoading(false);
    }
  };

  const getInterviewStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/interview/stats/summary');
      
      const stats = response.data;
      let message = `📊 Your Job Statistics:\n\n`;
      message += `Total Assessments: ${stats.totalInterviews}\n`;
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
      {/* Violation Alert Modal — pauses detection until dismissed */}
      {violationAlertVisible && (
        <div className="violation-modal-overlay">
          <div className="violation-modal">
            <div className="violation-modal-icon">🚨</div>
            <h2 className="violation-modal-title">{violationAlertTitle}</h2>
            <p className="violation-modal-msg">{violationAlertMsg}</p>
            <button className="violation-modal-btn" onClick={handleViolationAlertOk}>
              OK — Resume Detection
            </button>
          </div>
        </div>
      )}

      <h1>🎯 AI-Powered Job Assessment</h1>
      <p className="subtitle">With Advanced Malpractice Detection</p>

      {!interviewStarted && !interviewCompleted && (
        <div className="setup-section">
          <h2>Start Your Assessment</h2>

          {loadingInterview && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              background: '#e3f2fd', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p>⏳ Loading job details...</p>
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
              <strong>✅ Accepted Job</strong>
              <p>Stream and difficulty have been set by your recruiter</p>
            </div>
          )}

          {/* Identity Verification Gate */}
          {needsIdentityVerification && !identityVerified && interviewId && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                textAlign: 'center',
                padding: '15px',
                background: '#fff3cd',
                color: '#856404',
                border: '2px solid #ffc107',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <strong>🔐 Identity Verification Required</strong>
                <p>Please verify your identity before starting the assessment. Your webcam will compare your face with the photo you submitted during application.</p>
              </div>
              <IdentityVerification 
                interviewId={interviewId} 
                onVerificationComplete={() => {
                  setIdentityVerified(true);
                  setNeedsIdentityVerification(false);
                  console.log('✅ Identity verified — ready to start assessment');
                }} 
              />
            </div>
          )}

          {identityVerified && needsIdentityVerification === false && isFromAcceptedApplication && (
            <div style={{
              textAlign: 'center',
              padding: '10px',
              background: '#d4edda',
              color: '#155724',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <strong>✅ Identity Verified</strong>
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
            disabled={loading || loadingInterview || (needsIdentityVerification && !identityVerified)}
          >
            {loading ? '⏳ Starting...' : (needsIdentityVerification && !identityVerified) ? '🔐 Verify Identity First' : '🚀 Start Assessment'}
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
            <h2>📝 Assessment in Progress</h2>
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
              
              {/* 🆕 MODEL STATUS BADGE - Shows MediaPipe state (actual detection engine) */}
              <span className={`badge ${!mediapipeLoading ? 'badge-success' : 'badge-warning'}`}>
                {!mediapipeLoading ? '✅ AI Model Ready' : '⏳ Loading AI Model...'}
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

              {/* Face Metrics Monitor with Tabs */}
              <FaceMetricsMonitor 
                faceMetrics={faceMetrics}
                webcamActive={webcamActive}
                videoRef={videoRef}
              />

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
                      <span className={`stat-value ${(noFaceCount + multipleFaceCount + lookingAwayCount) > 0 ? 'warning' : ''}`}>
                        {noFaceCount + multipleFaceCount + lookingAwayCount}
                      </span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">🚫</div>
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
                  <div className="stat-item">
                    <div className="stat-icon">👀</div>
                    <div className="stat-content">
                      <span className="stat-label">Looking Away Violations</span>
                      <span className={`stat-value ${lookingAwayCount > 0 ? 'warning' : ''}`}>
                        {lookingAwayCount} {lookingAwayCount === 1 ? 'time' : 'times'}
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
                {loading ? '⏳ Processing...' : '🏁 Complete Assessment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

      {interviewCompleted && results && (
        <div className="results-section">
          <h2>🎉 Assessment Completed!</h2>
          
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
                🚩 This assessment has been flagged due to multiple high-severity malpractices.
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
                // Clear persisted data
                localStorage.removeItem('activeInterviewId');
                localStorage.removeItem('currentMalpractices');
                // Reset face violation counters for new interview
                noFaceCountRef.current = 0;
                multipleFaceCountRef.current = 0;
                setNoFaceCount(0);
                setMultipleFaceCount(0);
                setFaceCount(0);
                console.log('🔄 Face violation counters reset for new interview');
              }}
            >
              🔄 Start New Assessment
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
          <li>✅ Assessment flagging for suspicious behavior</li>
        </ul>
      </div>
    </div>
  );
};

export default AIInterview;
