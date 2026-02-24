#!/usr/bin/env python3
"""
Download MediaPipe FaceLandmarker model file

This script downloads the required face_landmarker.task file
from the official MediaPipe repository.

Official model repo: https://storage.googleapis.com/mediapipe-assets/face_landmarker.task
"""

import os
import sys
import urllib.request
from pathlib import Path

def download_model():
    """Download face_landmarker.task model"""
    
    # Model URL and destination
    model_url = "https://storage.googleapis.com/mediapipe-assets/face_landmarker.task"
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    model_path = os.path.join(model_dir, 'face_landmarker.task')
    
    # Create models directory if it doesn't exist
    os.makedirs(model_dir, exist_ok=True)
    
    # Check if model already exists
    if os.path.exists(model_path):
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"✅ Model already exists: {model_path}")
        print(f"   Size: {size_mb:.2f} MB")
        return True
    
    print("📥 Downloading MediaPipe FaceLandmarker model...")
    print(f"   URL: {model_url}")
    print(f"   Destination: {model_path}")
    print("")
    
    try:
        def download_progress(block_num, block_size, total_size):
            downloaded = block_num * block_size
            percent = min(downloaded * 100 // total_size, 100)
            bar_length = 40
            filled = int(bar_length * percent // 100)
            bar = '█' * filled + '░' * (bar_length - filled)
            sys.stdout.write(f'\r   [{bar}] {percent}%')
            sys.stdout.flush()
        
        urllib.request.urlretrieve(model_url, model_path, download_progress)
        
        print("\n\n✅ Model downloaded successfully!")
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"   Size: {size_mb:.2f} MB")
        print(f"   Location: {model_path}")
        return True
        
    except Exception as e:
        print(f"\n❌ Download failed: {e}")
        print("\nTroubleshooting:")
        print(f"  1. Check internet connection")
        print(f"  2. Create {model_dir} directory manually")
        print(f"  3. Download from: {model_url}")
        print(f"  4. Place file at: {model_path}")
        return False

if __name__ == "__main__":
    success = download_model()
    sys.exit(0 if success else 1)
