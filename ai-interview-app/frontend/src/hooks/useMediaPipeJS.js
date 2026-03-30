import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook: MediaPipe JS Face Detection and Analysis
 * Runs face detection locally in the browser
 */
export const useMediaPipeJS = () => {
  const [faceMetrics, setFaceMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // External pause control — when true, detection loop skips analysis
  const pauseRef = useRef(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const videoInitializedRef = useRef(false);
  const faceDetectorRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const webcamRef = useRef(null);
  const animationIdRef = useRef(null);
  const detectFacesRef = useRef(null);
  const loadingRef = useRef(true);
  const initializeMediaPipeRef = useRef(null);
  
  // State tracking for analysis
  const blinkCountRef = useRef(0);
  const prevEARRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const awayCounterRef = useRef(0);

  // Initialize MediaPipe models
  const initializeMediaPipe = useCallback(async () => {
    try {
      loadingRef.current = true;
      setLoading(true);
      console.log('🔄 [INIT] Loading MediaPipe models...');

      // Set a timeout to avoid blocking forever (30 seconds for full model loading)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MediaPipe initialization timeout')), 30000)
      );

      try {
        // Import MediaPipe with timeout
        console.log('🔄 [INIT] Importing @mediapipe/tasks-vision...');
        const vision = await Promise.race([
          import('@mediapipe/tasks-vision'),
          timeoutPromise
        ]);
        
        const { FilesetResolver, FaceDetector, FaceLandmarker } = vision;
        console.log('✅ [INIT] MediaPipe library imported successfully');

        // Create FilesetResolver with timeout
        const wasmFilesetsPath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm';
        console.log('🔄 [INIT] Loading WASM files from:', wasmFilesetsPath);
        
        const filesetResolver = await Promise.race([
          FilesetResolver.forVisionTasks(wasmFilesetsPath),
          timeoutPromise
        ]);
        console.log('✅ [INIT] WASM files loaded');

        // Initialize FaceDetector with timeout
        console.log('🔄 [INIT] Initializing Face Detector...');
        console.log('    Model URL: https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite');
        const detector = await Promise.race([
          FaceDetector.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite'
            },
            runningMode: 'VIDEO',
            minDetectionConfidence: 0.5,
            minSuppressionThreshold: 0.3
          }),
          timeoutPromise
        ]);
        console.log('✅ [INIT] Face Detector initialized successfully');

        // Initialize FaceLandmarker with timeout
        console.log('🔄 [INIT] Initializing Face Landmarker...');
        console.log('    Model URL: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task');
        const landmarker = await Promise.race([
          FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task'
            },
            runningMode: 'VIDEO',
            numFaces: 1
          }),
          timeoutPromise
        ]);
        console.log('✅ [INIT] Face Landmarker initialized successfully');
        console.log('✅ [INIT] Face Landmarker initialized');

        faceDetectorRef.current = detector;
        faceLandmarkerRef.current = landmarker;
        
        console.log('✅✅✅ [INIT] MediaPipe models loaded successfully - Face detection ready!');
        console.log('     - FaceDetectorRef:', !!faceDetectorRef.current);
        console.log('     - FaceLandmarkerRef:', !!faceLandmarkerRef.current);
        setError(null);
        loadingRef.current = false;
        setLoading(false);
      } catch (innerErr) {
        console.error('❌ [INIT] Model initialization error:', innerErr.message);
        throw innerErr;
      }
    } catch (err) {
      console.warn('⚠️ [INIT] MediaPipe initialization failed (will use fallback):', err.message);
      setError(null); // Don't show error to user, use graceful degradation
      loadingRef.current = false;
      setLoading(false); // Mark as done loading (without models)
      // Models failed, but app can continue without face detection
    }
  }, []);

  // Keep ref in sync for use in detection loop (avoids stale closures)
  initializeMediaPipeRef.current = initializeMediaPipe;

  // Guard against concurrent startWebcam calls
  const webcamStartingRef = useRef(false);

  // Start webcam
  const startWebcam = useCallback(async (attemptCount = 0) => {
    // Prevent concurrent calls
    if (webcamStartingRef.current && attemptCount === 0) {
      console.log('⚠️ startWebcam already in progress, skipping duplicate call');
      return;
    }
    if (attemptCount === 0) {
      webcamStartingRef.current = true;
    }

    try {
      if (attemptCount === 0) {
        console.log('🎥 Requesting camera access... (Attempt 1/3)');
      }

      // If we already have an active stream, reuse it
      if (webcamRef.current?.stream?.active && videoRef.current?.srcObject) {
        console.log('✅ Webcam already active, reusing existing stream');
        webcamStartingRef.current = false;
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        }
      });

      // Wait for video ref to be available with timeout
      let waitCount = 0;
      while (!videoRef.current && waitCount < 30) {
        console.log('⏳ Waiting for video element to be available... (Wait', waitCount + 1, '/30)');
        await new Promise(resolve => setTimeout(resolve, 300));
        waitCount++;
      }

      if (videoRef.current) {
        // Attach stream to video element
        videoRef.current.srcObject = stream;
        
        // Explicitly play the video (autoPlay may not be enough in all browsers)
        try {
          await videoRef.current.play();
          console.log('✅ Video play() succeeded');
        } catch (playErr) {
          console.warn('⚠️ Video play() issue (may auto-recover):', playErr.message);
        }
        
        // Wait for video to be ready
        const videoReadyPromise = new Promise((resolve) => {
          const checkReady = () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              console.log('✅ Video element is ready (readyState >= 2)');
              resolve();
            } else {
              requestAnimationFrame(checkReady);
            }
          };
          // Check immediately first
          if (videoRef.current && videoRef.current.readyState >= 2) {
            resolve();
          } else {
            requestAnimationFrame(checkReady);
          }
        });
        
        // Wait max 8 seconds for video to be ready
        await Promise.race([
          videoReadyPromise,
          new Promise((resolve) => setTimeout(resolve, 8000))
        ]);
        
        webcamRef.current = {
          video: videoRef.current,
          stream: stream
        };
        
        console.log('✅ Webcam access granted');
        console.log('   - Stream tracks:', stream.getTracks().length);
        console.log('   - Stream active:', stream.active);
        console.log('   - Stream ID:', stream.id);
        if (stream.getVideoTracks().length > 0) {
          console.log('   - Video track label:', stream.getVideoTracks()[0].label);
          console.log('   - Video track enabled:', stream.getVideoTracks()[0].enabled);
          console.log('   - Video track ready state:', stream.getVideoTracks()[0].readyState);
        }
        console.log('   - Video readyState:', videoRef.current.readyState);
        console.log('   - Video dimensions:', videoRef.current.videoWidth + 'x' + videoRef.current.videoHeight);
        
        setError(null);
        videoInitializedRef.current = true;
        
        // Start detection loop now that webcam is ready
        if (!animationIdRef.current) {
          console.log('🚀 Starting detection loop (timer-based, scroll-safe)...');
          // detectFaces is defined later, so use a delayed call
          animationIdRef.current = setTimeout(() => {
            if (detectFacesRef.current) detectFacesRef.current();
          }, 100);
        }
        
        webcamStartingRef.current = false;
      } else {
        throw new Error('Video element not available - please ensure the interview UI is loaded');
      }
    } catch (err) {
      const errorMsg = err.message || 'Unknown error';
      console.error(`❌ Webcam access error (Attempt ${attemptCount + 1}/3):`, err);
      
      if (attemptCount < 2) {
        console.log('⏳ Retrying in 1000ms...');
        setTimeout(() => startWebcam(attemptCount + 1), 1000);
      } else {
        // All retries failed, but continue without webcam
        console.warn('⚠️ Could not access webcam, continuing without camera');
        setError(null);
        webcamStartingRef.current = false;
      }
    }
  }, []);

  // Calculate Eye Aspect Ratio (EAR)
  // Uses MediaPipe Face Mesh landmark indices:
  //   Left eye:  upper lid [159,160,161], lower lid [144,145,153], corners [33,133]
  //   Right eye: upper lid [386,385,384], lower lid [373,374,380], corners [362,263]
  const calculateEAR = useCallback((landmarks) => {
    const calculateEye = (upperIds, lowerIds, cornerIds) => {
      // vertical distances (upper lid to lower lid at 3 sample points)
      let vertSum = 0;
      for (let i = 0; i < upperIds.length; i++) {
        const u = landmarks[upperIds[i]];
        const l = landmarks[lowerIds[i]];
        vertSum += Math.hypot(u.x - l.x, u.y - l.y);
      }
      // horizontal distance (eye corner to corner)
      const c1 = landmarks[cornerIds[0]];
      const c2 = landmarks[cornerIds[1]];
      const horiz = Math.hypot(c1.x - c2.x, c1.y - c2.y);
      return horiz === 0 ? 0 : vertSum / (upperIds.length * horiz);
    };

    const leftEAR  = calculateEye([159, 160, 161], [144, 145, 153], [33, 133]);
    const rightEAR = calculateEye([386, 385, 384], [373, 374, 380], [362, 263]);
    return (leftEAR + rightEAR) / 2.0;
  }, []);

  // Calculate head pose (pitch, yaw, and sideways movement)
  const calculateHeadPose = useCallback((landmarks) => {
    try {
      const nose = landmarks[1];
      const chin = landmarks[152];
      const forehead = landmarks[10];
      const leftTemple = landmarks[234];   // left side of face
      const rightTemple = landmarks[454];  // right side of face
      const leftEye = landmarks[263];
      const rightEye = landmarks[33];

      // Face width (temple to temple) for normalization
      const faceWidth = Math.hypot(leftTemple.x - rightTemple.x, leftTemple.y - rightTemple.y);

      // --- Yaw (left-right turn) ---
      // Compare distance from nose to each temple; when head turns, one side compresses
      const noseToLeft  = Math.hypot(nose.x - leftTemple.x,  nose.y - leftTemple.y);
      const noseToRight = Math.hypot(nose.x - rightTemple.x, nose.y - rightTemple.y);
      // Ratio-based: 0 when centered, positive when turning right, negative when turning left
      const yawRatio = faceWidth === 0 ? 0 : (noseToLeft - noseToRight) / faceWidth;
      const yaw = yawRatio * 90; // scale to approximate degrees

      // --- Pitch (up-down tilt) ---
      // Ratio of nose-to-forehead vs nose-to-chin; changes with pitch
      const noseToForehead = Math.hypot(nose.x - forehead.x, nose.y - forehead.y);
      const noseToChin     = Math.hypot(nose.x - chin.x,     nose.y - chin.y);
      const vertTotal = noseToForehead + noseToChin;
      const pitchRatio = vertTotal === 0 ? 0 : (noseToChin - noseToForehead) / vertTotal;
      const pitch = pitchRatio * 90; // scale to approximate degrees

      // --- Sideways offset (lateral head shift) ---
      // How far the face center is from the frame center (0.5, 0.5)
      const faceCenterX = (leftTemple.x + rightTemple.x) / 2;
      const faceCenterY = (forehead.y + chin.y) / 2;
      const sidewaysOffset = (faceCenterX - 0.5) * 200; // scale to ~-100..+100
      const verticalOffset = (faceCenterY - 0.5) * 200;

      return { yaw, pitch, sidewaysOffset, verticalOffset };
    } catch (err) {
      return { yaw: 0, pitch: 0, sidewaysOffset: 0, verticalOffset: 0 };
    }
  }, []);

  // Detect emotions from face blendshapes
  const detectEmotion = useCallback((blendShapes) => {
    if (!blendShapes || blendShapes.length === 0) {
      return { emotion: 'neutral', confidence: 0, details: {} };
    }

    // Build lookup map: categoryName -> score
    const s = {};
    blendShapes.forEach(shape => {
      s[shape.categoryName] = shape.score || 0;
    });

    // Helper: average of listed blendshapes
    const avg = (...keys) => {
      let sum = 0;
      keys.forEach(k => { sum += (s[k] || 0); });
      return sum / keys.length;
    };
    const sum2 = (a, b) => (s[a] || 0) + (s[b] || 0);

    // --- Composite emotion scores (0..1 range, weighted blends) ---
    // Happy: smile + cheek raise
    const happy = (
      sum2('mouthSmileLeft', 'mouthSmileRight') * 0.5 +
      sum2('cheekSquintLeft', 'cheekSquintRight') * 0.3 +
      avg('mouthDimpleLeft', 'mouthDimpleRight') * 0.2
    );

    // Surprised: wide eyes + raised brows + open jaw
    const surprised = (
      sum2('eyeWideLeft', 'eyeWideRight') * 0.3 +
      sum2('browOuterUpLeft', 'browOuterUpRight') * 0.25 +
      sum2('browInnerUp', 'browInnerUp') * 0.15 +
      (s['jawOpen'] || 0) * 0.3
    );

    // Sad: frown + inner brow raise + lip depress
    const sad = (
      sum2('mouthFrownLeft', 'mouthFrownRight') * 0.4 +
      (s['browInnerUp'] || 0) * 0.3 +
      sum2('mouthLowerDownLeft', 'mouthLowerDownRight') * 0.15 +
      avg('mouthPucker', 'mouthShrugLower') * 0.15
    );

    // Angry: brow down + lip press + eye squint + nose wrinkle
    const angry = (
      sum2('browDownLeft', 'browDownRight') * 0.35 +
      sum2('eyeSquintLeft', 'eyeSquintRight') * 0.2 +
      sum2('mouthPressLeft', 'mouthPressRight') * 0.2 +
      (s['noseSneerLeft'] || 0) * 0.125 +
      (s['noseSneerRight'] || 0) * 0.125
    );

    // Focused/concentrated: slight squint + pressed lips + moderate brow
    const focused = (
      sum2('eyeSquintLeft', 'eyeSquintRight') * 0.35 +
      sum2('mouthPressLeft', 'mouthPressRight') * 0.3 +
      avg('browDownLeft', 'browDownRight') * 0.2 +
      (1 - (s['jawOpen'] || 0)) * 0.15
    );

    // Confused: asymmetric brow + lip funnel/pucker
    const confused = (
      Math.abs((s['browDownLeft'] || 0) - (s['browDownRight'] || 0)) * 0.4 +
      Math.abs((s['browOuterUpLeft'] || 0) - (s['browOuterUpRight'] || 0)) * 0.3 +
      (s['mouthPucker'] || 0) * 0.15 +
      (s['mouthFunnel'] || 0) * 0.15
    );

    const emotions = { happy, surprised, sad, angry, focused, confused };

    // Find dominant emotion
    const maxEntry = Object.entries(emotions).reduce(
      (max, [emotion, score]) => score > max.score ? { emotion, score } : max,
      { emotion: 'neutral', score: 0 }
    );

    // Require a minimum threshold to register as non-neutral
    const THRESHOLD = 0.15;
    const detectedEmotion = maxEntry.score > THRESHOLD ? maxEntry.emotion : 'neutral';

    // Confidence: how far above threshold, capped at 100
    const rawConf = maxEntry.score > THRESHOLD ? Math.min(maxEntry.score / 0.8, 1) : 0;

    return {
      emotion: detectedEmotion,
      confidence: Math.round(rawConf * 100),
      details: {
        happy:     Math.round(happy * 100),
        surprised: Math.round(surprised * 100),
        sad:       Math.round(sad * 100),
        angry:     Math.round(angry * 100),
        focused:   Math.round(focused * 100),
        confused:  Math.round(confused * 100),
      }
    };
  }, []);

  // Calculate head roll angle
  const calculateHeadRoll = useCallback((landmarks) => {
    try {
      const leftEye = landmarks[33]; // Left eye
      const rightEye = landmarks[263]; // Right eye
      const roll = Math.atan2(
        rightEye.y - leftEye.y,
        rightEye.x - leftEye.x
      ) * (180 / Math.PI);
      return Math.round(roll * 100) / 100;
    } catch {
      return 0;
    }
  }, []);

  // Detect eye gaze direction relative to screen
  // "center" = looking at the computer screen; any sideways glance triggers left/right
  const detectEyeGaze = useCallback((landmarks) => {
    try {
      // Iris landmarks (available when FaceLandmarker reports refine_landmarks)
      const leftIris  = landmarks[468]; // Left iris center
      const rightIris = landmarks[473]; // Right iris center

      // Eye corner landmarks for horizontal bounds
      const leftEyeInner  = landmarks[133]; // Left eye inner corner (near nose)
      const leftEyeOuter  = landmarks[33];  // Left eye outer corner
      const rightEyeInner = landmarks[362]; // Right eye inner corner (near nose)
      const rightEyeOuter = landmarks[263]; // Right eye outer corner

      // Eye vertical landmarks for vertical bounds
      const leftEyeTop    = landmarks[159]; // Left eye upper lid
      const leftEyeBottom = landmarks[145]; // Left eye lower lid
      const rightEyeTop   = landmarks[386]; // Right eye upper lid
      const rightEyeBottom = landmarks[374]; // Right eye lower lid

      // --- Horizontal gaze ---
      // Normalize iris X position within eye width (0 = outer corner, 1 = inner corner)
      const leftEyeWidth  = leftEyeInner.x - leftEyeOuter.x;
      const rightEyeWidth = rightEyeInner.x - rightEyeOuter.x;

      const leftGazeX  = leftEyeWidth  === 0 ? 0.5 : (leftIris.x  - leftEyeOuter.x)  / leftEyeWidth;
      const rightGazeX = rightEyeWidth === 0 ? 0.5 : (rightIris.x - rightEyeOuter.x) / rightEyeWidth;
      const avgGazeX = (leftGazeX + rightGazeX) / 2;

      // --- Vertical gaze ---
      const leftEyeHeight  = leftEyeBottom.y - leftEyeTop.y;
      const rightEyeHeight = rightEyeBottom.y - rightEyeTop.y;

      const leftGazeY  = leftEyeHeight  === 0 ? 0.5 : (leftIris.y  - leftEyeTop.y)  / leftEyeHeight;
      const rightGazeY = rightEyeHeight === 0 ? 0.5 : (rightIris.y - rightEyeTop.y) / rightEyeHeight;
      const avgGazeY = (leftGazeY + rightGazeY) / 2;

      // Screen-focus zone: iris should be roughly centered (0.40–0.60 horizontal)
      // Tighter thresholds so even slight sideways glances are caught
      const SCREEN_H_MIN = 0.40; // iris ratio below this → looking away (left/right depends on mirror)
      const SCREEN_H_MAX = 0.60;
      const SCREEN_V_MIN = 0.30; // looking up beyond this
      const SCREEN_V_MAX = 0.70; // looking down beyond this

      let gazeDirection = 'center'; // default = looking at screen

      if (avgGazeX < SCREEN_H_MIN) {
        gazeDirection = 'left';
      } else if (avgGazeX > SCREEN_H_MAX) {
        gazeDirection = 'right';
      }

      // Vertical takes secondary priority (can combine)
      let verticalGaze = 'center';
      if (avgGazeY < SCREEN_V_MIN) {
        verticalGaze = 'up';
      } else if (avgGazeY > SCREEN_V_MAX) {
        verticalGaze = 'down';
      }

      // Combine: if looking both sideways and up/down, report the sideways first
      if (gazeDirection === 'center' && verticalGaze !== 'center') {
        gazeDirection = verticalGaze;
      } else if (gazeDirection !== 'center' && verticalGaze !== 'center') {
        gazeDirection = gazeDirection + '-' + verticalGaze; // e.g. "left-up"
      }

      return gazeDirection;
    } catch {
      return 'center';
    }
  }, []);

  // Analyze frame
  const analyzeFrame = useCallback(async () => {
    // Skip if models not loaded (will try again on next frame)
    if (!videoRef.current || !faceLandmarkerRef.current || !faceDetectorRef.current) {
      return;
    }
    
    // Ensure video is playing
    if (videoRef.current.readyState < 2) {
      return;
    }

    try {
      setIsAnalyzing(true);

      // Log video state for debugging
      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight) {
        return;
      }

      const timestamp = performance.now();

      // Detect faces - this gives us face COUNT
      let detections;
      try {
        console.log('🔍 Calling FaceDetector.detectForVideo()...');
        detections = faceDetectorRef.current.detectForVideo(video, timestamp);
        console.log('✅ FaceDetector returned:', detections);
      } catch (err) {
        console.error('❌ FaceDetector.detectForVideo() error:', err.message);
        throw err;
      }

      const faceCount = detections?.detections?.length || 0;
      console.log(`📊 Face Count: ${faceCount} (detections:`, detections, ')');

      // Check for multiple faces violation
      const violations = [];
      if (faceCount > 1) {
        violations.push(`Multiple Faces Detected (${faceCount})`);
      } else if (faceCount === 0) {
        // No face detected
        console.log('❌ No faces detected');
        setFaceMetrics({
          face_detected: false,
          face_count: 0,
          head_pose: { yaw: 0, pitch: 0, roll: 0 },
          eye_metrics: { blink_rate: 0, eye_aspect_ratio: 0, gaze_direction: 'center' },
          emotion: { emotion: 'neutral', confidence: 0 },
          violations: ['No Face Detected'],
          confidence: 0,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Get face landmarks only for first face
      let landmarks;
      try {
        console.log('🔍 Calling FaceLandmarker.detectForVideo()...');
        landmarks = faceLandmarkerRef.current.detectForVideo(video, timestamp);
        console.log('✅ FaceLandmarker returned:', landmarks);
      } catch (err) {
        console.error('❌ FaceLandmarker.detectForVideo() error:', err.message);
        throw err;
      }

      if (!landmarks?.faceLandmarks || landmarks.faceLandmarks.length === 0) {
        console.log('❌ No face landmarks detected');
        setFaceMetrics({
          face_detected: false,
          face_count: 0,
          head_pose: { yaw: 0, pitch: 0, roll: 0 },
          eye_metrics: { blink_rate: 0, eye_aspect_ratio: 0, gaze_direction: 'center' },
          emotion: { emotion: 'neutral', confidence: 0 },
          violations: ['Unable to analyze face'],
          confidence: 0,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const faceLandmarks = landmarks.faceLandmarks[0];
      const { yaw, pitch, sidewaysOffset, verticalOffset } = calculateHeadPose(faceLandmarks);
      const roll = calculateHeadRoll(faceLandmarks);
      const ear = calculateEAR(faceLandmarks);
      const gazeDirection = detectEyeGaze(faceLandmarks);

      // Blink detection: use adaptive threshold based on running average
      const EAR_BLINK_THRESHOLD = 0.18;
      if (ear < EAR_BLINK_THRESHOLD && prevEARRef.current >= EAR_BLINK_THRESHOLD) {
        blinkCountRef.current++;
      }
      prevEARRef.current = ear;

      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
      const blinkRate = (blinkCountRef.current / Math.max(elapsedSeconds, 1)) * 60;

      // Eye open/closed status with better thresholds for MediaPipe normalized coords
      // Open: EAR > 0.22, Squinting: 0.15-0.22, Closed: < 0.15
      let eyeStatus = 'open';
      if (ear < 0.15) {
        eyeStatus = 'closed';
      } else if (ear < 0.22) {
        eyeStatus = 'squinting';
      }

      // Mouth openness (distance between lips)
      const mouthTop = faceLandmarks[13];
      const mouthBottom = faceLandmarks[14];
      const mouthDist = Math.hypot(
        mouthTop.x - mouthBottom.x,
        mouthTop.y - mouthBottom.y
      );
      const mouthOpen = mouthDist > 0.02;

      // Head pose violations (turning/tilting away)
      if (Math.abs(yaw) > 25 || Math.abs(pitch) > 20) {
        awayCounterRef.current++;
        if (awayCounterRef.current > 8) {
          violations.push('❌ Looking Away');
        }
      } else {
        awayCounterRef.current = Math.max(0, awayCounterRef.current - 1);
      }

      // Sideways movement violation (head too far from center)
      if (Math.abs(sidewaysOffset) > 40) {
        violations.push(sidewaysOffset > 0 ? '➡️ Head Shifted Right' : '⬅️ Head Shifted Left');
      }

      // Eye metric violations
      if (blinkRate > 25) {
        violations.push('👀 Frequent Blinking');
      }

      // Emotion detection using blend shapes
      const emotionData = detectEmotion(landmarks.faceBlendshapes?.[0]?.categories || []);

      // Calculate confidence
      const detection = detections.detections[0];
      const confidence = detection.categories?.[0]?.score || 0.9;

      const metricsData = {
        face_detected: true,
        face_count: faceCount,
        head_pose: {
          yaw: Math.round(yaw * 100) / 100,
          pitch: Math.round(pitch * 100) / 100,
          roll: roll,
          sidewaysOffset: Math.round(sidewaysOffset * 100) / 100,
          verticalOffset: Math.round(verticalOffset * 100) / 100
        },
        eye_metrics: {
          blink_rate: Math.round(blinkRate * 100) / 100,
          eye_aspect_ratio: Math.round(ear * 1000) / 1000,
          eye_status: eyeStatus,
          gaze_direction: gazeDirection
        },
        emotion: {
          emotion: emotionData.emotion,
          confidence: emotionData.confidence,
          mouth_open: mouthOpen,
          details: emotionData.details
        },
        violations: violations,
        confidence: Math.round(confidence * 10000) / 100,
        timestamp: new Date().toISOString()
      };

      console.log('✅ FACE DETECTED - Metrics Computed:', metricsData);
      setFaceMetrics(metricsData);
      setError(null);
    } catch (err) {
      console.error('❌ Frame analysis error:', err);
      setError(`Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [calculateHeadPose, calculateEAR, calculateHeadRoll, detectEyeGaze, detectEmotion]);

  // Track model retry attempts in detection loop
  const modelRetryCountRef = useRef(0);
  const MODEL_RETRY_MAX = 3;

  // Main detection loop — uses setTimeout instead of requestAnimationFrame
  // so that detection keeps running even when the video element is scrolled off-screen.
  const DETECTION_INTERVAL = 150; // ms between frames (~6-7 fps, plenty for face metrics)

  const detectFaces = useCallback(async () => {
    try {
      // Check if video ref exists
      if (!videoRef.current) {
        animationIdRef.current = setTimeout(detectFaces, 500);
        return;
      }

      const video = videoRef.current;

      // Video readiness checks
      if (video.readyState < 2) {
        animationIdRef.current = setTimeout(detectFaces, 500);
        return;
      }

      // Additional video checks
      if (!video.videoWidth || !video.videoHeight) {
        animationIdRef.current = setTimeout(detectFaces, 500);
        return;
      }

      // MODELS NOT READY — retry loading if not already retrying
      if (!faceLandmarkerRef.current || !faceDetectorRef.current) {
        if (modelRetryCountRef.current < MODEL_RETRY_MAX && !loadingRef.current) {
          modelRetryCountRef.current++;
          console.log(`🔄 Models not loaded, retrying initialization (attempt ${modelRetryCountRef.current}/${MODEL_RETRY_MAX})...`);
          // Re-trigger model loading via ref (doesn't change detectFaces identity)
          if (initializeMediaPipeRef.current) initializeMediaPipeRef.current();
        }
        setFaceMetrics({
          face_detected: false,
          face_count: 0,
          head_pose: { yaw: 0, pitch: 0, roll: 0 },
          eye_metrics: { blink_rate: 0, eye_aspect_ratio: 0, gaze_direction: 'center' },
          emotion: { emotion: 'neutral', confidence: 0 },
          violations: ['⏳ Loading face detection models... (FaceDetector: ' + (!!faceDetectorRef.current ? '✅' : '⏳') + ', FaceLandmarker: ' + (!!faceLandmarkerRef.current ? '✅' : '⏳') + ')'],
          confidence: 0,
          timestamp: new Date().toISOString()
        });
        animationIdRef.current = setTimeout(detectFaces, 2000);
        return;
      }

      // Models are ready — reset retry counter
      modelRetryCountRef.current = 0;

      // If paused (e.g. violation alert showing), skip analysis this frame
      if (pauseRef.current) {
        animationIdRef.current = setTimeout(detectFaces, 500);
        return;
      }

      // Models ARE ready - call analyzeFrame
      await analyzeFrame();
    } catch (err) {
      console.warn('⚠️ Detection frame error (non-blocking):', err.message);
    }
    // Always schedule next iteration
    animationIdRef.current = setTimeout(detectFaces, DETECTION_INTERVAL);
  }, [analyzeFrame]);

  // Keep detectFacesRef in sync
  detectFacesRef.current = detectFaces;

  // Initialize on mount
  useEffect(() => {
    initializeMediaPipe();
    
    return () => {
      if (animationIdRef.current) {
        clearTimeout(animationIdRef.current);
      }
    };
  }, [initializeMediaPipe]);

  // Start detection when ready (with or without models)
  useEffect(() => {
    if (!loading) {
      console.log('🎬 Detection system initialized');
      console.log('   - Face Detector ready:', !!faceDetectorRef.current);
      console.log('   - Face Landmarker ready:', !!faceLandmarkerRef.current);
      console.log('   - Video Ref available:', !!videoRef.current);
      
      if (videoRef.current) {
        console.log('   - Video readyState:', videoRef.current.readyState);
        console.log('   - Video paused:', videoRef.current.paused);
        console.log('   - Video dimensions:', videoRef.current.videoWidth + 'x' + videoRef.current.videoHeight);
      }
      
      // Only start detection loop when video element is actually available
      // The component (AIInterview) will call startWebcam() when the interview starts
      // and the video element is rendered
      console.log('✅ MediaPipe models ready. Waiting for startWebcam() to be called by component.');
    }

    return () => {
      if (animationIdRef.current) {
        console.log('🛑 Cleaning up: stopping detection loop');
        clearTimeout(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [loading, startWebcam, detectFaces]);

  const stopWebcam = useCallback(() => {
    if (webcamRef.current?.stream) {
      webcamRef.current.stream.getTracks().forEach(track => {
        track.stop();
        console.log(`   - Stopped ${track.kind} track`);
      });
      webcamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationIdRef.current) {
      clearTimeout(animationIdRef.current);
    }
  }, []);

  const resetMetrics = useCallback(() => {
    blinkCountRef.current = 0;
    prevEARRef.current = 0;
    startTimeRef.current = Date.now();
    awayCounterRef.current = 0;
  }, []);

  return {
    videoRef,
    canvasRef,
    faceMetrics,
    error,
    loading,
    isAnalyzing,
    pauseRef,
    startWebcam,
    stopWebcam,
    resetMetrics,
    detectFaces,
    analyzeFrame
  };
};
