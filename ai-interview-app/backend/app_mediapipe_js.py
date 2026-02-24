"""
Simplified FastAPI Backend for Interview Face Analysis Logging
All face detection is now handled by MediaPipe JS in the frontend
This backend only handles data logging and storage
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import json
from pathlib import Path

app = FastAPI(title="AI Interview Face Analysis Logger")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class FaceMetrics(BaseModel):
    face_detected: bool
    head_pose: dict
    eye_metrics: dict
    emotion: dict
    violations: list
    confidence: float = 0.0
    timestamp: str = None

class AnalysisLog(BaseModel):
    interview_id: str
    metrics: FaceMetrics
    session_start: str = None

# Storage directory
LOGS_DIR = Path("interview_logs")
LOGS_DIR.mkdir(exist_ok=True)

# ================================
# API ENDPOINTS
# ================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "✅ AI Interview Face Analysis Backend",
        "version": "2.0 (MediaPipe JS + FastAPI)",
        "description": "Face detection runs in frontend via MediaPipe JS",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    """Health status"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/log/metrics")
async def log_face_metrics(data: AnalysisLog):
    """
    Log face analysis metrics to file
    Called by frontend to persist analysis data
    """
    try:
        interview_id = data.interview_id
        log_file = LOGS_DIR / f"{interview_id}_metrics.jsonl"

        # Append metrics to log file (one JSON per line)
        with open(log_file, "a") as f:
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "metrics": data.metrics.dict(),
                "session_start": data.session_start
            }
            f.write(json.dumps(log_entry) + "\n")

        return {
            "status": "✅ Logged",
            "interview_id": interview_id,
            "log_file": str(log_file)
        }
    except Exception as e:
        return {
            "status": "❌ Error",
            "error": str(e)
        }

@app.post("/log/violation")
async def log_violation(interview_id: str, violation: str):
    """Log a single violation event"""
    try:
        log_file = LOGS_DIR / f"{interview_id}_violations.jsonl"
        
        with open(log_file, "a") as f:
            violation_entry = {
                "timestamp": datetime.now().isoformat(),
                "violation": violation
            }
            f.write(json.dumps(violation_entry) + "\n")

        return {
            "status": "✅ Violation logged",
            "violation": violation
        }
    except Exception as e:
        return {
            "status": "❌ Error",
            "error": str(e)
        }

@app.get("/logs/{interview_id}")
async def get_logs(interview_id: str):
    """Retrieve all metrics logs for an interview"""
    try:
        log_file = LOGS_DIR / f"{interview_id}_metrics.jsonl"
        
        if not log_file.exists():
            return {
                "status": "❌ Not found",
                "interview_id": interview_id
            }

        logs = []
        with open(log_file, "r") as f:
            for line in f:
                if line.strip():
                    logs.append(json.loads(line))

        return {
            "status": "✅ Retrieved",
            "interview_id": interview_id,
            "count": len(logs),
            "logs": logs
        }
    except Exception as e:
        return {
            "status": "❌ Error",
            "error": str(e)
        }

@app.get("/violations/{interview_id}")
async def get_violations(interview_id: str):
    """Retrieve all violations for an interview"""
    try:
        log_file = LOGS_DIR / f"{interview_id}_violations.jsonl"
        
        if not log_file.exists():
            return {
                "status": "✅ Retrieved",
                "interview_id": interview_id,
                "violations": [],
                "count": 0
            }

        violations = []
        with open(log_file, "r") as f:
            for line in f:
                if line.strip():
                    violations.append(json.loads(line))

        return {
            "status": "✅ Retrieved",
            "interview_id": interview_id,
            "violations": violations,
            "count": len(violations)
        }
    except Exception as e:
        return {
            "status": "❌ Error",
            "error": str(e)
        }

@app.post("/analyze/summary")
async def analyze_summary(interview_id: str):
    """Generate summary analytics from interview logs"""
    try:
        metrics_file = LOGS_DIR / f"{interview_id}_metrics.jsonl"
        violations_file = LOGS_DIR / f"{interview_id}_violations.jsonl"

        metrics_data = []
        violations_data = []

        if metrics_file.exists():
            with open(metrics_file, "r") as f:
                for line in f:
                    if line.strip():
                        metrics_data.append(json.loads(line))

        if violations_file.exists():
            with open(violations_file, "r") as f:
                for line in f:
                    if line.strip():
                        violations_data.append(json.loads(line))

        # Calculate statistics
        face_detected_count = sum(1 for m in metrics_data if m["metrics"].get("face_detected", False))
        total_recordings = len(metrics_data)
        
        avg_confidence = 0
        if face_detected_count > 0:
            avg_confidence = sum(
                m["metrics"].get("confidence", 0) 
                for m in metrics_data 
                if m["metrics"].get("face_detected", False)
            ) / face_detected_count

        violation_types = {}
        for v in violations_data:
            violation = v.get("violation", "Unknown")
            violation_types[violation] = violation_types.get(violation, 0) + 1

        return {
            "status": "✅ Summary generated",
            "interview_id": interview_id,
            "statistics": {
                "total_frames": total_recordings,
                "face_detected_frames": face_detected_count,
                "detection_rate": f"{(face_detected_count/total_recordings*100):.1f}%" if total_recordings > 0 else "0%",
                "average_confidence": f"{avg_confidence:.1f}%",
                "total_violations": len(violations_data),
                "violation_breakdown": violation_types
            }
        }
    except Exception as e:
        return {
            "status": "❌ Error",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting AI Interview Backend (MediaPipe JS mode)")
    print("📍 Frontend: http://localhost:5173")
    print("🔌 Backend: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
