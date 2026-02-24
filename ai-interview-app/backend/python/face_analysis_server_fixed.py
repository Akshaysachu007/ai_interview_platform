"""
⚠️ DEPRECATED FILE - DO NOT USE

This file is an old backend implementation for face analysis.
All face detection now runs in the frontend via MediaPipe JS.

🚀 USE INSTEAD:
  Backend: python app_mediapipe_js.py  (logging only)
  Frontend: useMediaPipeJS hook + FaceMetricsMonitor component

Migration completed in previous iteration.
File kept for historical reference only.
"""

# Request model for base64 frames
class FrameData(BaseModel):
    model_config = ConfigDict(extra="allow")
    
    base64_frame: Optional[str] = None
    frame: Optional[str] = None
    interview_id: Optional[str] = None

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Face Analysis API", version="1.0.0")

# CORS middleware for React frontend - Enhanced for WebSocket support
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "*"  # Keep fallback for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "WebSocket", "Authorization", "Content-Type"],
    allow_origin_regex=".*",
)

# Per-connection analyzers (prevents memory leaks)
active_connections = {}  # websocket -> FaceAnalyzer


@app.on_event("startup")
async def startup():
    """Initialize on startup"""
    logger.info("[OK] Face Analysis API Server Started")
    logger.info("[+] Face detection model loaded successfully")
    logger.info("[*] Ready to process video frames")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Face Behavior Analyzer",
        "version": "1.0.0"
    }


@app.post("/analyze/frame")
async def analyze_frame(file: UploadFile = File(...)):
    """Analyze a single frame (image upload)"""
    temp_analyzer = FaceAnalyzer(max_num_faces=3)
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Analyze
        results = temp_analyzer.analyze_frame(frame)
        
        logger.info(f"Frame analyzed: {results.get('face_count', 0)} face(s)")
        
        return JSONResponse(content=results)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Frame analysis error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        try:
            temp_analyzer.close()
        except Exception as e:
            logger.error(f"[ERROR] Cleanup error: {str(e)}")


@app.post("/analyze/base64")
async def analyze_base64(data: FrameData):
    """Analyze frame from base64-encoded image"""
    temp_analyzer = None
    try:
        # Try both possible key names
        frame_base64 = data.base64_frame or data.frame or ""
        
        if not frame_base64:
            raise HTTPException(status_code=400, detail="No frame data provided")
        
        if frame_base64.startswith("data:"):
            frame_base64 = frame_base64.split(",")[1]
        
        # Decode base64 safely
        try:
            frame_bytes = base64.b64decode(frame_base64)
        except Exception as e:
            logger.error(f"[ERROR] Base64 decode error: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid base64 encoding")
        
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None or frame.size == 0:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Resize for performance
        h, w = frame.shape[:2]
        if h > 480:
            scale = 480 / h
            frame = cv2.resize(frame, (int(w * scale), 480))
        
        # Initialize analyzer for this frame
        temp_analyzer = FaceAnalyzer(max_num_faces=3)
        results = temp_analyzer.analyze_frame(frame)
        
        logger.info(f"✓ Frame analyzed: {results.get('face_count', 0)} face(s) detected")
        return JSONResponse(content=results)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Base64 analysis error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        if temp_analyzer:
            try:
                temp_analyzer.close()
            except Exception as e:
                logger.error(f"[ERROR] Cleanup error: {str(e)}")


@app.websocket("/ws/video")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time streaming with improved error handling"""
    try:
        await websocket.accept()
    except Exception as e:
        logger.error(f"[ERROR] WebSocket accept failed: {str(e)}")
        return
    
    # Per-connection analyzer
    connection_analyzer = None
    frame_count = 0
    
    try:
        connection_analyzer = FaceAnalyzer(max_num_faces=3)
        active_connections[websocket] = connection_analyzer
        
        logger.info(f"[+] WebSocket client connected (Active: {len(active_connections)})")
        
        while True:
            try:
                data = await websocket.receive_text()
                frame_count += 1
                
                try:
                    message = json.loads(data)
                    frame_base64 = message.get("frame", "")
                    
                    if not frame_base64:
                        logger.warning(f"[W] WebSocket frame {frame_count}: No frame data")
                        continue
                    
                    # Safely decode frame
                    try:
                        frame_bytes = base64.b64decode(frame_base64)
                    except Exception as e:
                        logger.warning(f"[W] WebSocket frame {frame_count}: Invalid base64 - {str(e)}")
                        continue
                    
                    nparr = np.frombuffer(frame_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    if frame is None or frame.size == 0:
                        logger.warning(f"[W] WebSocket frame {frame_count}: Invalid image data")
                        continue
                    
                    # Resize for performance
                    h, w = frame.shape[:2]
                    if h > 720:  # Increased from 480 for better accuracy
                        scale = 720 / h
                        frame = cv2.resize(frame, (int(w * scale), 720))
                    
                    # Analyze in thread pool to avoid blocking
                    loop = asyncio.get_event_loop()
                    results = await loop.run_in_executor(None, connection_analyzer.analyze_frame, frame)
                    
                    # Send back results
                    await websocket.send_json(results)
                    
                    if frame_count % 30 == 0:
                        logger.info(f"[✓] Processed {frame_count} frames, face detected: {results.get('face_detected')}")
                
                except json.JSONDecodeError as e:
                    logger.error(f"[ERROR] WebSocket JSON decode error: {str(e)}")
                    await websocket.send_json({"error": "Invalid JSON"})
                except Exception as e:
                    logger.error(f"[ERROR] WebSocket frame processing error: {str(e)}")
                    await websocket.send_json({"error": f"Processing error: {str(e)}"})
            
            except Exception as e:
                logger.error(f"[ERROR] WebSocket receive error: {str(e)}")
                break
    
    except Exception as e:
        logger.error(f"[ERROR] WebSocket connection error: {str(e)}")
    
    finally:
        # Cleanup
        if websocket in active_connections:
            try:
                connection_analyzer = active_connections[websocket]
                if connection_analyzer:
                    connection_analyzer.close()
                del active_connections[websocket]
            except Exception as e:
                logger.error(f"[ERROR] WebSocket cleanup error: {str(e)}")
        
        logger.info(f"[-] WebSocket client disconnected after {frame_count} frames (Active: {len(active_connections)})")


@app.get("/metrics/summary")
async def get_summary():
    """Get session summary metrics"""
    return {
        "active_connections": len(active_connections),
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("[*] Starting Face Analysis API Server...")
    print("="*60)
    print("[+] Server: http://localhost:8000")
    print("[+] API Docs: http://localhost:8000/docs")
    print("[+] Ready for real-time face detection with MediaPipe")
    print("="*60 + "\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
