# Testing Checklist - MediaPipe JS Face Detection System

## 📅 Post-Cleanup Testing Guide

This checklist ensures all components work correctly after the MediaPipe JS migration and code cleanup.

---

## ✅ Pre-Test Setup

### **1. Dependencies Check**
```bash
cd frontend
npm list @mediapipe/tasks-vision
```
**Expected:** `@mediapipe/tasks-vision@0.10.32` (or latest)

### **2. Start Backend (Optional - for logging)**
```bash
cd backend
python app_mediapipe_js.py
```
**Expected:** Server running on `http://localhost:8001`

### **3. Start Frontend**
```bash
cd frontend
npm run dev
```
**Expected:** Development server on `http://localhost:5173`

---

## 🧪 Test Cases

### **Test 1: MediaPipe Hook Initialization**

**Component:** `useMediaPipeJS`

**Steps:**
1. Open browser to `http://localhost:5173`
2. Navigate to AI Interview page
3. Open browser console (F12)

**Expected Output:**
```
📦 Initializing MediaPipe...
✅ MediaPipe models loaded successfully
📹 Starting webcam...
✅ Webcam started
🔍 Starting face detection loop...
```

**Pass Criteria:**
- ✅ No console errors
- ✅ All initialization messages appear
- ✅ Webcam access granted

---

### **Test 2: Face Detection Metrics**

**Component:** `useMediaPipeJS` → `FaceMetricsMonitor`

**Steps:**
1. Start interview session
2. Look at Face Metrics Monitor panel
3. Move head left/right (test yaw)
4. Move head up/down (test pitch)
5. Blink eyes (test EAR and blink rate)
6. Open mouth (test mouth detection)

**Expected Metrics:**
```javascript
{
  face_detected: true,
  head_pose: {
    yaw: -15 to 15,  // Neutral position
    pitch: -10 to 10
  },
  eye_metrics: {
    blink_rate: 15-25,  // Normal range
    eye_aspect_ratio: 0.2-0.4
  },
  emotion: {
    mouth_open: false,  // Changes to true when mouth opens
    confidence: 80-100
  },
  violations: []
}
```

**Pass Criteria:**
- ✅ Face detected shows "✅ Yes"
- ✅ Head pose changes when head moves
- ✅ Blink rate increases when blinking rapidly
- ✅ EAR drops below 0.2 during blinks
- ✅ Mouth open changes to "Yes" when mouth opens

---

### **Test 3: Violation Detection**

**Component:** `useMediaPipeJS` violation logic

#### **3a. Looking Away**
**Steps:**
1. Start interview
2. Turn head >30° left or right (test yaw)
3. OR tilt head >20° up or down (test pitch)

**Expected:**
```
violations: ["Looking Away"]
```

**Pass Criteria:**
- ✅ "Looking Away" appears in violations section
- ⚠️ Warning alert displayed

---

#### **3b. No Face Detected**
**Steps:**
1. Start interview
2. Move out of camera frame
3. Wait 2-3 seconds

**Expected:**
```
violations: ["No face detected"]
```

**Pass Criteria:**
- ✅ "No face detected" appears
- 🔴 Error alert displayed

---

#### **3c. Frequent Blinking**
**Steps:**
1. Start interview
2. Blink rapidly (>25 blinks per minute)
3. Continue for 10 seconds

**Expected:**
```
violations: ["Frequent Blinking"]
```

**Pass Criteria:**
- ✅ "Frequent Blinking" appears after threshold exceeded

---

### **Test 4: Component Integration**

**Component:** `AIInterview.jsx` → `FaceMetricsMonitor.jsx`

**Steps:**
1. Start interview
2. Verify metrics flow from parent to child

**Check in React DevTools:**
```
AIInterview
  └─ useMediaPipeJS() returns faceMetrics
  └─ FaceMetricsMonitor receives props:
      - faceMetrics: { ... }
      - webcamActive: true
      - videoRef: { current: <video> }
```

**Pass Criteria:**
- ✅ Props passed correctly
- ✅ FaceMetricsMonitor displays live data
- ✅ No "Initializing..." message after 2 seconds

---

### **Test 5: Webcam Lifecycle**

**Component:** `useMediaPipeJS` webcam management

#### **5a. Start Webcam**
**Steps:**
1. Click "Start Interview"
2. Grant camera permission when prompted

**Expected:**
- ✅ Video stream starts
- ✅ Face detection begins
- ✅ Metrics update every ~33ms

---

#### **5b. Stop Webcam**
**Steps:**
1. Complete interview or click "End Interview"
2. Check browser console

**Expected:**
```
🛑 Stopping webcam...
✅ Webcam stopped and resources cleaned up
```

**Pass Criteria:**
- ✅ Video stream stops
- ✅ Camera indicator turns off
- ✅ No memory leaks (check Chrome Task Manager)

---

#### **5c. Webcam Error Handling**
**Steps:**
1. Deny camera permission
2. OR disconnect camera device

**Expected:**
```
❌ Webcam error: [error message]
```

**Pass Criteria:**
- ✅ Error message displayed to user
- ✅ No infinite retry loops
- ✅ Graceful fallback (interview can continue without camera)

---

### **Test 6: Performance**

**Component:** Overall system performance

**Metrics to Check:**

| Metric | Target | How to Check |
|--------|--------|--------------|
| Face Detection FPS | 25-30 FPS | Console: `Frame processed in Xms` |
| CPU Usage | <30% | Chrome Task Manager |
| Memory Usage | <200MB | Chrome Task Manager |
| Detection Latency | <50ms | Console timestamps |
| Webcam Resolution | 640x480 or 1280x720 | Video element inspect |

**Steps:**
1. Run interview for 5 minutes
2. Monitor Chrome Task Manager
3. Check console for performance logs

**Pass Criteria:**
- ✅ Consistent FPS (no major drops)
- ✅ CPU usage stable
- ✅ No memory leaks (memory doesn't increase continuously)
- ✅ Detection latency <50ms average

---

### **Test 7: Browser Compatibility**

**Browsers to Test:**

| Browser | Version | Expected Result |
|---------|---------|-----------------|
| Chrome | Latest | ✅ Full support |
| Edge | Latest | ✅ Full support |
| Brave | Latest | ✅ Full support (shields down) |
| Firefox | Latest | ⚠️ Check WebGL support |
| Safari | Latest | ⚠️ Check MediaPipe CDN loading |

**Steps:**
1. Open app in each browser
2. Test face detection
3. Check console for errors

**Pass Criteria:**
- ✅ Chrome/Edge: Perfect
- ✅ Brave: Works with shields down
- ⚠️ Firefox/Safari: Minimal errors, functional

---

### **Test 8: Interview Hooks (Other Features)**

#### **8a. Voice Input**
**Component:** `useVoiceInput`

**Steps:**
1. Click microphone button
2. Speak into microphone
3. Verify transcript appears

**Expected:**
```
🎤 Listening...
[Transcript appears in real-time]
```

**Pass Criteria:**
- ✅ Speech recognition starts
- ✅ Transcription accurate
- ✅ Stop button works

---

#### **8b. Text-to-Speech**
**Component:** `useTextToSpeech`

**Steps:**
1. Click "Read Question" button
2. Verify question is spoken

**Expected:**
- ✅ Speech synthesis starts
- ✅ Question spoken clearly
- ✅ Can be stopped mid-speech

---

#### **8c. Interview Timer**
**Component:** `useInterviewTimer`

**Steps:**
1. Start 30-minute interview
2. Watch timer countdown
3. Verify warnings at 5 min and 1 min remaining

**Expected:**
```
29:59 → 29:58 → ...
⚠️ 5 minutes remaining warning
⚠️ 1 minute remaining warning
⏰ Time's up!
```

**Pass Criteria:**
- ✅ Timer counts down every second
- ✅ Warnings appear at correct times
- ✅ Interview ends when time expires

---

#### **8d. Malpractice Tracker**
**Component:** `useMalpracticeTracker`

**Steps:**
1. Switch tabs during interview
2. Trigger face violations (look away)
3. Check malpractice monitor

**Expected:**
```javascript
{
  tabSwitches: 3,
  faceViolations: 2,
  warnings: [
    "⚠️ Tab switch detected at 10:30:45 AM",
    "👤 Face violation detected at 10:31:00 AM"
  ]
}
```

**Pass Criteria:**
- ✅ Tab switches counted
- ✅ Face violations tracked
- ✅ Warnings timestamped

---

## 🐛 Common Issues & Fixes

### **Issue 1: "MediaPipe models failed to load"**

**Cause:** CDN blocking or slow network

**Fix:**
```javascript
// Check network tab in DevTools
// Verify these URLs load:
- https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm/vision_wasm_internal.wasm
- https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite
```

**Solution:**
- Disable VPN/firewall temporarily
- Check browser console for CORS errors
- Wait for CDN to respond (may take 5-10 seconds on first load)

---

### **Issue 2: "Webcam permission denied"**

**Cause:** Browser blocked camera access

**Fix:**
1. Click lock icon in address bar
2. Change camera permission to "Allow"
3. Refresh page

---

### **Issue 3: Face detection not working**

**Symptoms:**
- Webcam shows video
- No metrics appear
- Console shows no errors

**Debug Steps:**
1. Check if MediaPipe models loaded: `console.log(faceDetector, faceLandmarker)`
2. Verify `analyzeFrame` is being called (add console.log)
3. Check if face is in frame and well-lit

**Solution:**
- Adjust lighting (bright frontal light)
- Center face in camera
- Reload page to reinitialize MediaPipe

---

### **Issue 4: Low FPS (<15 FPS)**

**Cause:** Weak GPU or CPU overload

**Fix:**
1. Close other browser tabs
2. Reduce video resolution in `useMediaPipeJS.js`:
```javascript
video: { 
  width: { ideal: 640 },  // Lower from 1280
  height: { ideal: 480 }  // Lower from 720
}
```
3. Increase detection interval in `detectFaces()`:
```javascript
setTimeout(() => {
  detectFaces();
}, 50);  // Change from 33ms to 50ms (20 FPS)
```

---

### **Issue 5: Memory leak**

**Symptoms:** Memory usage increases over time

**Debug Steps:**
1. Open Chrome Task Manager (Shift+Esc)
2. Monitor "Memory Footprint" while running interview
3. If memory increases >500MB, there's a leak

**Solution:**
- Verify `stopWebcam()` is called on unmount
- Check if video stream tracks are stopped:
```javascript
stream.getTracks().forEach(track => track.stop());
```
- Clear intervals/timeouts properly

---

## 📊 Test Results Template

Copy this table and fill in results:

| Test Case | Status | Notes | Date |
|-----------|--------|-------|------|
| MediaPipe Initialization | ⬜ | | |
| Face Detection Metrics | ⬜ | | |
| Violation: Looking Away | ⬜ | | |
| Violation: No Face | ⬜ | | |
| Violation: Frequent Blinking | ⬜ | | |
| Component Integration | ⬜ | | |
| Webcam Start/Stop | ⬜ | | |
| Error Handling | ⬜ | | |
| Performance (FPS) | ⬜ | | |
| Performance (Memory) | ⬜ | | |
| Chrome Browser | ⬜ | | |
| Edge Browser | ⬜ | | |
| Brave Browser | ⬜ | | |
| Voice Input | ⬜ | | |
| Text-to-Speech | ⬜ | | |
| Interview Timer | ⬜ | | |
| Malpractice Tracker | ⬜ | | |

**Legend:**
- ⬜ Not tested
- ✅ Passed
- ⚠️ Passed with warnings
- ❌ Failed

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All test cases passed
- [ ] No console errors in production build
- [ ] Performance metrics meet targets
- [ ] Tested on Chrome, Edge, Brave
- [ ] Camera permissions handled gracefully
- [ ] Error messages user-friendly
- [ ] Fallback for unsupported browsers
- [ ] HTTPS enabled (required for `getUserMedia`)
- [ ] Privacy policy updated (camera usage disclosure)
- [ ] Backend logging endpoint secured (authentication)

---

## 📝 Bug Report Template

If you find a bug, report it using this format:

```markdown
### Bug Title
[Brief description]

**Environment:**
- Browser: [Chrome 120.0]
- OS: [Windows 11]
- Camera: [Logitech C920]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**

**Actual Behavior:**

**Console Errors:**
```
[Paste console output]
```

**Screenshots:**
[Attach if relevant]

**Priority:** [Low / Medium / High / Critical]
```

---

## 📞 Support

For testing issues:
1. Check `CLEANUP_SUMMARY.md` for architecture overview
2. See `MEDIAPIPE_JS_QUICKSTART.md` for setup instructions
3. Review browser console for detailed error messages
4. Test with different lighting conditions (bright, frontal light works best)

**Successful test completion:** All green checkmarks ✅ in test results table.
