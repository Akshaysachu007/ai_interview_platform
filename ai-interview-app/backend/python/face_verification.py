#!/usr/bin/env python3
"""
Face Verification Service
Compares two face images and returns a match score.
Reads JSON from stdin, writes JSON to stdout.

Input:  { "reference_photo": "data:image/jpeg;base64,...", "current_photo": "data:image/jpeg;base64,..." }
Output: { "success": true, "match_score": 85.5, "is_match": true, "threshold": 60 }
"""

import sys
import json
import base64
import io
import numpy as np

# Match threshold (percentage)
MATCH_THRESHOLD = 60


def decode_base64_image(data_url):
    """Decode base64 data URL to numpy array."""
    try:
        # Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        if ',' in data_url:
            data_url = data_url.split(',', 1)[1]
        
        image_bytes = base64.b64decode(data_url)
        
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        return np.array(img)
    except Exception as e:
        print(f"Image decode error: {e}", file=sys.stderr)
        return None


def try_face_recognition(ref_img, cur_img):
    """Try using face_recognition library (most accurate)."""
    try:
        import face_recognition
        
        ref_encodings = face_recognition.face_encodings(ref_img)
        cur_encodings = face_recognition.face_encodings(cur_img)
        
        if len(ref_encodings) == 0:
            return None, "No face found in reference photo"
        if len(cur_encodings) == 0:
            return None, "No face found in current photo"
        
        # Compare faces - face_distance returns euclidean distance (0 = identical)
        distance = face_recognition.face_distance([ref_encodings[0]], cur_encodings[0])[0]
        
        # Convert distance to percentage score (0 distance = 100%, 1.0 distance = 0%)
        score = max(0, (1.0 - distance) * 100)
        
        return round(score, 1), None
    except ImportError:
        return None, "face_recognition not installed"
    except Exception as e:
        return None, str(e)


def try_structural_similarity(ref_img, cur_img):
    """Fallback: Use structural similarity (SSIM) on face regions."""
    try:
        import cv2
        
        # Convert to grayscale
        ref_gray = cv2.cvtColor(ref_img, cv2.COLOR_RGB2GRAY)
        cur_gray = cv2.cvtColor(cur_img, cv2.COLOR_RGB2GRAY)
        
        # Detect faces using Haar cascades
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        ref_faces = face_cascade.detectMultiScale(ref_gray, 1.1, 5, minSize=(60, 60))
        cur_faces = face_cascade.detectMultiScale(cur_gray, 1.1, 5, minSize=(60, 60))
        
        if len(ref_faces) == 0:
            # Try with more lenient params
            ref_faces = face_cascade.detectMultiScale(ref_gray, 1.05, 3, minSize=(30, 30))
        if len(cur_faces) == 0:
            cur_faces = face_cascade.detectMultiScale(cur_gray, 1.05, 3, minSize=(30, 30))
        
        if len(ref_faces) == 0:
            return None, "No face found in reference photo"
        if len(cur_faces) == 0:
            return None, "No face found in current photo"
        
        # Crop largest face from each
        ref_face = max(ref_faces, key=lambda f: f[2] * f[3])
        cur_face = max(cur_faces, key=lambda f: f[2] * f[3])
        
        rx, ry, rw, rh = ref_face
        cx, cy, cw, ch = cur_face
        
        ref_crop = ref_gray[ry:ry+rh, rx:rx+rw]
        cur_crop = cur_gray[cy:cy+ch, cx:cx+cw]
        
        # Resize both to same size for comparison
        target_size = (128, 128)
        ref_resized = cv2.resize(ref_crop, target_size)
        cur_resized = cv2.resize(cur_crop, target_size)
        
        # Normalize histograms
        ref_norm = cv2.equalizeHist(ref_resized)
        cur_norm = cv2.equalizeHist(cur_resized)
        
        # Method 1: Histogram comparison
        ref_hist = cv2.calcHist([ref_norm], [0], None, [256], [0, 256])
        cur_hist = cv2.calcHist([cur_norm], [0], None, [256], [0, 256])
        cv2.normalize(ref_hist, ref_hist)
        cv2.normalize(cur_hist, cur_hist)
        hist_score = cv2.compareHist(ref_hist, cur_hist, cv2.HISTCMP_CORREL)
        
        # Method 2: Template matching (normalized cross-correlation)
        result = cv2.matchTemplate(ref_norm, cur_norm, cv2.TM_CCOEFF_NORMED)
        template_score = result[0][0]
        
        # Method 3: Mean absolute difference (inverted)
        diff = cv2.absdiff(ref_norm, cur_norm)
        mean_diff = np.mean(diff)
        pixel_score = max(0, 1.0 - mean_diff / 128.0)
        
        # Weighted combination
        combined = (hist_score * 0.3 + template_score * 0.4 + pixel_score * 0.3)
        
        # Scale to 0-100 range with a boost (structural similarity tends to be lower)
        score = min(100, max(0, combined * 100 * 1.2))
        
        return round(score, 1), None
        
    except ImportError:
        return None, "opencv-python not installed"
    except Exception as e:
        return None, str(e)


def try_histogram_comparison(ref_img, cur_img):
    """Last resort fallback: Simple histogram comparison."""
    try:
        from PIL import Image
        
        # Convert to same size grayscale
        ref_pil = Image.fromarray(ref_img).convert('L').resize((128, 128))
        cur_pil = Image.fromarray(cur_img).convert('L').resize((128, 128))
        
        ref_arr = np.array(ref_pil, dtype=np.float64)
        cur_arr = np.array(cur_pil, dtype=np.float64)
        
        # Normalized correlation
        ref_norm = (ref_arr - ref_arr.mean()) / (ref_arr.std() + 1e-8)
        cur_norm = (cur_arr - cur_arr.mean()) / (cur_arr.std() + 1e-8)
        
        correlation = np.mean(ref_norm * cur_norm)
        score = max(0, min(100, correlation * 100))
        
        return round(score, 1), None
        
    except Exception as e:
        return None, str(e)


def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        reference_photo = data.get('reference_photo', '')
        current_photo = data.get('current_photo', '')
        
        if not reference_photo or not current_photo:
            print(json.dumps({
                "success": False,
                "match_score": 0,
                "is_match": False,
                "threshold": MATCH_THRESHOLD,
                "error": "Missing photo data"
            }))
            return
        
        # Decode images
        print("Decoding reference photo...", file=sys.stderr)
        ref_img = decode_base64_image(reference_photo)
        print("Decoding current photo...", file=sys.stderr)
        cur_img = decode_base64_image(current_photo)
        
        if ref_img is None or cur_img is None:
            print(json.dumps({
                "success": False,
                "match_score": 0,
                "is_match": False,
                "threshold": MATCH_THRESHOLD,
                "error": "Failed to decode images"
            }))
            return
        
        print(f"Reference image: {ref_img.shape}", file=sys.stderr)
        print(f"Current image: {cur_img.shape}", file=sys.stderr)
        
        # Try methods in order of accuracy
        score = None
        method = None
        
        # Method 1: face_recognition (most accurate)
        score, err = try_face_recognition(ref_img, cur_img)
        if score is not None:
            method = "face_recognition"
            print(f"Used face_recognition: {score}%", file=sys.stderr)
        else:
            print(f"face_recognition unavailable: {err}", file=sys.stderr)
        
        # Method 2: OpenCV structural similarity
        if score is None:
            score, err = try_structural_similarity(ref_img, cur_img)
            if score is not None:
                method = "opencv_structural"
                print(f"Used OpenCV structural: {score}%", file=sys.stderr)
            else:
                print(f"OpenCV unavailable: {err}", file=sys.stderr)
        
        # Method 3: Simple histogram
        if score is None:
            score, err = try_histogram_comparison(ref_img, cur_img)
            if score is not None:
                method = "histogram"
                print(f"Used histogram comparison: {score}%", file=sys.stderr)
            else:
                print(f"Histogram comparison failed: {err}", file=sys.stderr)
        
        if score is None:
            print(json.dumps({
                "success": False,
                "match_score": 0,
                "is_match": False,
                "threshold": MATCH_THRESHOLD,
                "error": "All face matching methods failed"
            }))
            return
        
        # Convert numpy types to native Python types for JSON serialization
        score = float(score)
        
        print(json.dumps({
            "success": True,
            "match_score": score,
            "is_match": bool(score >= MATCH_THRESHOLD),
            "threshold": MATCH_THRESHOLD,
            "method": method
        }))
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            "success": False,
            "match_score": 0,
            "is_match": False,
            "threshold": MATCH_THRESHOLD,
            "error": f"Invalid JSON input: {str(e)}"
        }))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "match_score": 0,
            "is_match": False,
            "threshold": MATCH_THRESHOLD,
            "error": f"Unexpected error: {str(e)}"
        }))


if __name__ == '__main__':
    main()
