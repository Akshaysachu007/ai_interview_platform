#!/bin/bash
# Quick Start Commands - Copy & Paste to Terminal

# ============================================================================
# STEP 1: Start Python Backend (Terminal 1)
# ============================================================================
echo "📦 Setting up Python backend..."
cd d:/ai-interview-app/ai-interview-app/ai-interview-app/backend/python

# Check Python installation
python --version

# Install dependencies if needed (first time only)
# pip install -r requirements.txt

# Start server
python face_analysis_server_fixed.py

# Expected output:
# ✅ Loading face detection model...
# ✅ TensorFlow.js backend ready
# INFO:     Uvicorn running on http://0.0.0.0:8000


# ============================================================================
# STEP 2: Start Node Backend (Terminal 2)
# ============================================================================
echo "📦 Setting up Node backend..."
cd d:/ai-interview-app/ai-interview-app/ai-interview-app/backend

# Install dependencies if needed (first time only)
# npm install

# Start server
npm start

# Expected output:
# ✅ Server running on port 5000


# ============================================================================
# STEP 3: Start Frontend Dev Server (Terminal 3)
# ============================================================================
echo "📦 Setting up Frontend..."
cd d:/ai-interview-app/ai-interview-app/ai-interview-app/frontend

# Install dependencies if needed (first time only)
# npm install

# Start dev server
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/


# ============================================================================
# STEP 4: Run Diagnostics (New Terminal)
# ============================================================================
echo "🔍 Running diagnostics..."
cd d:/ai-interview-app/ai-interview-app/ai-interview-app/backend/python

python verify_face_detection.py

# This will check:
# ✅ Python backend running on 8000
# ✅ Node backend running on 5000
# ✅ Frontend running on 5173
# ✅ Frame analysis working
# ✅ CORS configured correctly
# ✅ WebSocket support available


# ============================================================================
# STEP 5: Open Browser
# ============================================================================
echo "🌐 Opening browser..."
# Go to: http://localhost:5173


# ============================================================================
# STEP 6: Test Face Detection
# ============================================================================
# In browser:
# 1. Click "Start Interview"
# 2. Select stream and difficulty
# 3. Click "Create Interview"
# 4. Allow camera permission
# 5. Watch FaceMetricsMonitor component
#    - Should show "Initializing face detection..."
#    - After 1-5 seconds: Should show face metrics
#    - Metrics update in real-time


# ============================================================================
# CLEANUP/SHUTDOWN
# ============================================================================
# When done, stop servers:
# Terminal 1: Ctrl+C (stop Python backend)
# Terminal 2: Ctrl+C (stop Node backend)
# Terminal 3: Ctrl+C (stop Frontend)


# ============================================================================
# TROUBLESHOOTING
# ============================================================================

# If Python backend fails to start:
# Error: ModuleNotFoundError
# Solution: pip install -r requirements.txt

# If port 8000 already in use:
# Error: Address already in use
# Solution: lsof -i :8000  (or netstat -ano | findstr :8000 on Windows)
#          kill -9 <PID>   (or taskkill /PID <PID> /F on Windows)

# If frontend can't connect to backend:
# Error: CORS error in console
# Solution: Make sure Python backend is running on port 8000
#          Check: http://localhost:8000 in browser

# If face detection stuck on "Initializing":
# Check:
# - DevTools Console for errors
# - Python backend logs for frame processing
# - Camera permissions granted
# - Good lighting on face
# - Face 8-10 inches from camera

# For detailed troubleshooting:
# Read: FACE_DETECTION_STARTUP.md
# Read: FACE_DETECTION_TEST_CHECKLIST.md
# Read: FACE_DETECTION_IMPLEMENTATION_COMPLETE.md
