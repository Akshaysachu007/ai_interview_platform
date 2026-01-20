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

  // Load face detection model on component mount
  useEffect(() => {
    const loadFaceDetectionModel = async () => {
      try {
        console.log('📦 Loading face detection model...');
        setModelLoading(true);
        
        // Load BlazeFace model
        const model = await blazeface.load();
        setFaceDetectionModel(model);
        
        console.log('✅ Face detection model loaded successfully!');
        setModelLoading(false);
      } catch (error) {
        console.error('❌ Error loading face detection model:', error);
        alert('⚠️ Could not load face detection model. Using basic detection.');
        setModelLoading(false);
      }
    };

    loadFaceDetectionModel();
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

  // Webcam functionality
  const startWebcam = async () => {
    try {
      console.log('🎥 Requesting webcam access...');
      
      // Stop any existing stream first
      if (streamRef.current) {
        console.log('🛑 Stopping existing stream...');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      console.log('✅ Webcam access granted, stream tracks:', mediaStream.getTracks().length);
      console.log('Stream active:', mediaStream.active);
      console.log('Stream ID:', mediaStream.id);
      
      if (!videoRef.current) {
        console.error('❌ Video ref is null');
        setWebcamActive(true);
        return;
      }
      
      console.log('📹 Setting video srcObject...');
      
      // Clear any existing srcObject
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject = null;
      }
      
      // Set the new stream
      videoRef.current.srcObject = mediaStream;
      streamRef.current = mediaStream;
      
      // Explicitly set video attributes
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.autoplay = true;
      videoRef.current.controls = false;
      
      // Wait for video to load and be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('⚠️ Video loading timeout, but continuing...');
          resolve();
        }, 5000);
        
        const checkVideo = () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            clearTimeout(timeout);
            console.log('✅ Video ready!');
            console.log('  - Dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
            console.log('  - Ready state:', videoRef.current.readyState);
            console.log('  - Paused:', videoRef.current.paused);
            resolve();
          } else {
            setTimeout(checkVideo, 100);
          }
        };
        checkVideo();
      });
      
      // Explicitly play the video
      try {
        await videoRef.current.play();
        console.log('✅ Video play() successful');
        console.log('  - Playing:', !videoRef.current.paused);
        console.log('  - Current time:', videoRef.current.currentTime);
        
        setWebcamActive(true);
        
        // Start real-time face detection immediately after video is playing
        console.log('🎯 Starting continuous real-time face detection...');
        startFaceDetection();
      } catch (playError) {
        console.error('❌ Video play error:', playError);
        console.log('Attempting to set webcam active anyway...');
        setWebcamActive(true);
      }
      
    } catch (error) {
      console.error('❌ Webcam access error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('⚠️ Camera Permission Denied\n\nPlease:\n1. Click the camera icon in your browser address bar\n2. Allow camera access\n3. Refresh the page and start the interview again');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert('⚠️ No Camera Found\n\nPlease connect a camera and try again.');
      } else {
        alert('⚠️ Could not access webcam: ' + error.message + '\n\nThe interview will continue without video monitoring.');
      }
      // Set webcamActive to true anyway so interview can proceed
      setWebcamActive(true);
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
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setWebcamActive(false);
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

  // Real-time face detection using TensorFlow.js
  const startFaceDetection = () => {
    // Clear any existing interval first
    if (detectionIntervalRef.current) {
      console.log('🧹 Clearing existing detection interval');
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    // 🆕 CHECK IF MODEL IS LOADED
    if (!faceDetectionModel) {
      console.error('❌ Cannot start face detection: Model not loaded yet!');
      console.error('This should not happen - model should be loaded before calling this function');
      return;
    }
    
    console.log('✅ Starting face detection with loaded model:', faceDetectionModel);
    console.log('✅ Interview state - started:', interviewStarted, 'completed:', interviewCompleted);
    
    // Start new detection interval - check every 2 seconds
    detectionIntervalRef.current = setInterval(() => {
      const shouldDetect = interviewStarted && !interviewCompleted && faceDetectionModel;
      
      if (shouldDetect) {
        detectFacesWithML();
      } else {
        console.log('⏸️ Detection paused - started:', interviewStarted, 'completed:', interviewCompleted, 'model:', !!faceDetectionModel);
        
        if (!faceDetectionModel) {
          console.warn('⚠️ Model became null during detection!');
        }
      }
    }, 2000);
    
    console.log('✅ Real-time ML face detection started (checking every 2 seconds)');
    console.log('✅ Detection interval ID:', detectionIntervalRef.current);
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
    if (!video.videoWidth || !video.videoHeight) {
      console.log('⚠️ Video dimensions not ready:', video.videoWidth, 'x', video.videoHeight);
      setFaceCount(0);
      return;
    }
    
    // Check if video is actually playing
    if (video.paused || video.ended) {
      console.warn('⚠️ Video is not playing - paused:', video.paused, 'ended:', video.ended);
      try {
        await video.play();
        console.log('✅ Video restarted');
      } catch (e) {
        console.error('❌ Cannot restart video:', e.message);
        return;
      }
    }

    try {
      // Detect faces using TensorFlow BlazeFace model
      const predictions = await faceDetectionModel.estimateFaces(video, false);
      
      const detectedFaces = predictions.length;
      setFaceCount(detectedFaces);
      
      console.log(`📊 [ML] Face Detection - Faces: ${detectedFaces} at ${new Date().toLocaleTimeString()}`);
      
      // Optional: Draw bounding boxes on canvas for visualization
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Always clear and redraw to ensure fresh frame
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      if (predictions.length > 0) {
        predictions.forEach((prediction) => {
          const start = prediction.topLeft;
          const end = prediction.bottomRight;
          const size = [end[0] - start[0], end[1] - start[1]];
          
          // Draw rectangle around detected face
          context.strokeStyle = detectedFaces === 1 ? '#00ff00' : '#ff0000';
          context.lineWidth = 3;
          context.strokeRect(start[0], start[1], size[0], size[1]);
          
          // Draw confidence score
          context.fillStyle = detectedFaces === 1 ? '#00ff00' : '#ff0000';
          context.font = '16px Arial';
          context.fillText(
            `${Math.round(prediction.probability[0] * 100)}%`, 
            start[0], 
            start[1] - 5
          );
        });
      }

      // Real-time violation detection and reporting
      if (interviewId && interviewStarted && !interviewCompleted) {
        try {
          // Send webcam snapshot to backend
          const snapshotData = canvas.toDataURL('image/jpeg', 0.6);
          
          api.post('/interview/update-webcam-snapshot', {
            interviewId,
            snapshot: snapshotData,
            faceCount: detectedFaces
          }).catch(err => {
            console.log('Snapshot upload in progress or queued');
          });

          // Report face detection to backend
          api.post('/interview/report-face-detection', {
            interviewId,
            facesDetected: detectedFaces
          }).then(response => {
            if (response.data?.analysis) {
              console.log('📊 Backend Analysis:', response.data.analysis);
            }
            
            if (response.data?.warning) {
              console.warn('⚠️ Backend Warning:', response.data.warning);
              
              if (response.data.flagged) {
                alert('🚨 ' + response.data.warning);
              }
            }
          }).catch(err => {
            console.error('Face detection report failed:', err.message);
          });

          // Client-side warnings with enhanced violation tracking
          if (detectedFaces !== 1) {
            let warningMessage = '';
            let violationType = null;
            
            if (detectedFaces === 0) {
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
              
              // Show visual alert for severe violations
              if (noFaceCountRef.current >= 2) {
                try {
                  showViolationAlert('NO FACE DETECTED', 'Please ensure your face is visible to the camera immediately!');
                } catch (err) {
                  console.log('Alert error:', err.message);
                }
              }
            } else if (detectedFaces > 1) {
              violationType = 'MULTIPLE_FACES';
              warningMessage = `🚨 [${new Date().toLocaleTimeString()}] MULTIPLE FACES DETECTED (${detectedFaces})! Only the candidate should be visible.`;
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
              
              // Show visual alert for severe violations
              if (multipleFaceCountRef.current >= 2) {
                try {
                  showViolationAlert('MULTIPLE FACES DETECTED', `${detectedFaces} faces detected. Only you should be visible!`);
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
            console.log('✅ Face properly detected - monitoring continues - Counts remain: No Face=' + noFaceCountRef.current + ', Multiple=' + multipleFaceCountRef.current);
          }
        } catch (err) {
          console.error('❌ Face detection report error:', err);
          // Don't stop detection loop on backend error - keep monitoring locally
        }
      }
    } catch (err) {
      console.error('❌ Face detection error:', err);
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
      
      if (interview.status === 'completed') {
        alert('This interview has already been completed.');
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
      
      // 🆕 WAIT FOR MODEL TO LOAD
      console.log('⏳ Ensuring face detection model is loaded...');
      
      if (!faceDetectionModel) {
        // Wait for model to load
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (faceDetectionModel) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('⚠️ Model loading timeout');
            resolve();
          }, 10000);
        });
      }
      
      console.log('✅ Model ready, starting webcam...');
      
      // Start webcam first
      await startWebcam();
      
      const requestBody = isFromAcceptedApplication 
        ? { interviewId }  // Use the state variable, not URL param
        : { stream, difficulty };
      
      const response = await api.post('/interview/start', requestBody);

      setInterviewId(response.data.interviewId);
      setQuestions(response.data.questions);
      setInterviewStarted(true);
      setCurrentQuestionIndex(0);
      
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
