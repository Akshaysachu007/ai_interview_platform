@echo off
REM Quick Start Commands for Windows
REM Copy commands from each section to a separate terminal

echo.
echo ============================================================================
echo STEP 1: Start Python Backend (Terminal 1)
echo ============================================================================
echo.
echo cd d:\ai-interview-app\ai-interview-app\ai-interview-app\backend\python
echo python face_analysis_server_fixed.py
echo.
echo Expected output:
echo ✅ Loading face detection model...
echo ✅ TensorFlow.js backend ready
echo INFO:     Uvicorn running on http://0.0.0.0:8000
echo.
pause

echo.
echo ============================================================================
echo STEP 2: Start Node Backend (Terminal 2)
echo ============================================================================
echo.
echo cd d:\ai-interview-app\ai-interview-app\ai-interview-app\backend
echo npm start
echo.
echo Expected output:
echo ✅ Server running on port 5000
echo.
pause

echo.
echo ============================================================================
echo STEP 3: Start Frontend Dev Server (Terminal 3)
echo ============================================================================
echo.
echo cd d:\ai-interview-app\ai-interview-app\ai-interview-app\frontend
echo npm run dev
echo.
echo Expected output:
echo ➜  Local:   http://localhost:5173/
echo.
pause

echo.
echo ============================================================================
echo STEP 4: Run Diagnostics (New Terminal)
echo ============================================================================
echo.
echo cd d:\ai-interview-app\ai-interview-app\ai-interview-app\backend\python
echo python verify_face_detection.py
echo.
echo This will check:
echo ✅ Python backend running on 8000
echo ✅ Node backend running on 5000
echo ✅ Frontend running on 5173
echo ✅ Frame analysis working
echo ✅ CORS configured correctly
echo ✅ WebSocket support available
echo.
pause

echo.
echo ============================================================================
echo STEP 5: Open Browser
echo ============================================================================
echo.
echo Go to: http://localhost:5173
echo.
start http://localhost:5173
pause

echo.
echo ============================================================================
echo STEP 6: Test Face Detection
echo ============================================================================
echo.
echo In browser:
echo 1. Click "Start Interview"
echo 2. Select stream and difficulty
echo 3. Click "Create Interview"
echo 4. Allow camera permission
echo 5. Watch FaceMetricsMonitor component
echo    - Should show "Initializing face detection..."
echo    - After 1-5 seconds: Should show face metrics
echo    - Metrics update in real-time
echo.
pause

echo.
echo ============================================================================
echo IMPORTANT: Port Check Commands
echo ============================================================================
echo.
echo To check if ports are in use:
echo  netstat -ano | findstr :8000   (Python backend)
echo  netstat -ano | findstr :5000   (Node backend)
echo  netstat -ano | findstr :5173   (Frontend)
echo.
echo To kill a process using a port:
echo  taskkill /PID ^<PID^> /F
echo.
echo To find process by port quickly:
echo  For /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /PID %%a /F
echo.
pause

echo.
echo ============================================================================
echo TROUBLESHOOTING
echo ============================================================================
echo.
echo If Python backend fails to start:
echo   Error: ModuleNotFoundError
echo   Solution: pip install -r requirements.txt
echo.
echo If port already in use:
echo   Solution: taskkill /PID ^<PID^> /F
echo.
echo If frontend can't connect to backend:
echo   Check: http://localhost:8000 in browser
echo   Make sure Python backend is running
echo.
echo If face detection stuck on "Initializing":
echo   Open DevTools Console (F12)
echo   Check for errors
echo   Check Python backend logs
echo   Check camera permissions
echo   Check lighting and camera distance (8-10 inches)
echo.
echo For detailed help:
echo   Read: FACE_DETECTION_STARTUP.md
echo   Read: FACE_DETECTION_TEST_CHECKLIST.md
echo   Read: FACE_DETECTION_IMPLEMENTATION_COMPLETE.md
echo.
pause
