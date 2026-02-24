# MediaPipe JS Migration Guide

## Architecture Change: Python Backend → MediaPipe JS Frontend

### 🔄 What Changed?

**Before (Python Backend):**
```
Frontend (Video Stream)
    ↓ (WebSocket)
Python Backend (MediaPipe processing)
    ↓ (JSON response)
Frontend (Display metrics)
```

**After (MediaPipe JS):**
```
Frontend (Video Stream)
    ↓ (Camera access)
JavaScript (MediaPipe Face Detection & Analysis)
    ↓ (Direct processing in browser)
Frontend (Display metrics)
    ↓ (Optional logging)
Backend (FastAPI - logging only)
```

### ✅ Benefits

- **Faster**: No network latency - analysis happens locally
- **Lower bandwidth**: No video streaming to backend
- **Better privacy**: Video never leaves user's device
- **Works offline**: Can function without backend
- **Scalable**: No server-side processing bottleneck

### 📁 New File Structure

```
frontend/
├── src/
│   ├── hooks/
│   │   ├── useMediaPipeJS.js          ← NEW: Face detection hook
│   │   └── useInterviewHooks.js       ← Updated: exports useMediaPipeJS
│   └── components/
│       └── FaceMetricsMonitor.jsx     ← Updated: uses useMediaPipeJS

backend/
├── app_mediapipe_js.py                ← NEW: Logging-only backend
└── python/
    └── vision_mediapipe.py            ← DEPRECATED: Old Python backend
```

### 🚀 Getting Started

#### 1. **Frontend Setup**

Install MediaPipe JS dependency:
```bash
cd frontend
npm install @mediapipe/tasks-vision
```

#### 2. **Backend Setup (Optional for Logging)**

```bash
cd backend
python app_mediapipe_js.py
```

The backend runs on `http://localhost:8000` and provides:
- `/` - Health check
- `/log/metrics` - Log face metrics
- `/logs/{interview_id}` - Retrieve metrics
- `/analyze/summary` - Analytics summary

#### 3. **Frontend Usage**

```javascript
import { useMediaPipeJS } from '../hooks/useMediaPipeJS';

const MyComponent = () => {
  const {
    videoRef,
    faceMetrics,
    error,
    loading,
    stopWebcam
  } = useMediaPipeJS();

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />
      {faceMetrics && <DisplayMetrics metrics={faceMetrics} />}
    </div>
  );
};
```

### 📊 Face Metrics Output

The `faceMetrics` object contains:

```javascript
{
  face_detected: boolean,
  head_pose: {
    yaw: number,      // -30 to 30 (degrees)
    pitch: number     // -20 to 20 (degrees)
  },
  eye_metrics: {
    blink_rate: number,        // Blinks per minute
    eye_aspect_ratio: number   // 0 to 1 (lower = closed)
  },
  emotion: {
    mouth_open: boolean,
    confidence: number         // 0 to 100 (%)
  },
  violations: string[],  // ["Looking Away", "Frequent Blinking"]
  timestamp: string,     // ISO 8601 timestamp
  confidence: number     // Overall detection confidence
}
```

### ⚙️ Configuration

Edit `useMediaPipeJS.js` to customize:

```javascript
// Model initialization
const detector = await FaceDetector.createFromOptions(filesetResolver, {
  baseOptions: { /* model path */ },
  runningMode: 'VIDEO'  // VIDEO or IMAGE
});

// Blink threshold (lower = more sensitive)
if (ear < 0.2 && prevEARRef.current >= 0.2) {
  blinkCountRef.current++;
}

// Head pose thresholds
if (Math.abs(yaw) > 30 || Math.abs(pitch) > 20) {
  violations.push('Looking Away');
}

// Blink rate threshold
if (blinkRate > 25) {
  violations.push('Frequent Blinking');
}
```

### 🔍 Troubleshooting

#### Issue: Camera not working
- Check browser permissions
- Ensure HTTPS in production (required for camera access)
- Try a different browser

#### Issue: Models failing to load
- Check CDN connectivity (models load from cdn.jsdelivr.net)
- Verify internet connection
- Check browser console for errors

#### Issue: Face not being detected
- Ensure good lighting
- Face should be clearly visible
- Adjust camera distance (ideal: 1-3 feet)

#### Issue: High CPU usage
- Reduce frame processing rate (adjust in loop)
- Close other browser tabs
- Check device capabilities

### 📱 Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14.1+
- ✅ Mobile browsers (iOS 14+, Android 10+)

### 🔐 Privacy & Security

- ✅ Video stream never leaves device
- ✅ Only metrics extracted locally
- ✅ Optional backend logging (interview_logs/)
- ✅ No external video transmission

### 📝 Migration Checklist

- [x] Install `@mediapipe/tasks-vision`
- [x] Create `useMediaPipeJS.js` hook
- [x] Update `FaceMetricsMonitor.jsx`
- [x] Create new `app_mediapipe_js.py` backend
- [x] Update `useInterviewHooks.js` exports
- [x] Test face detection in browser
- [x] Verify metrics output format

### 🆘 Support

For issues or questions:
1. Check browser console (F12)
2. Review MediaPipe documentation: https://developers.google.com/mediapipe/solutions/vision/face_landmarker
3. Check GitHub issues or create new one

---

**Last Updated:** February 19, 2026  
**Status:** ✅ Active (MediaPipe JS v0.10.8)
