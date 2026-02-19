"""
Face Verification Service using face_recognition library
Compares two face photos and returns similarity score
"""

import face_recognition
import numpy as np
import base64
import sys
import json
from io import BytesIO
from PIL import Image

def decode_base64_image(base64_string):
    """
    Decode base64 image string to numpy array
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)
        
        # Open image with PIL
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB (face_recognition requires RGB)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(image)
        
        return image_array
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")

def get_face_encoding(image_array):
    """
    Extract face encoding from image
    Returns None if no face found
    """
    try:
        # Detect face locations
        face_locations = face_recognition.face_locations(image_array)
        
        if len(face_locations) == 0:
            return None, "No face detected in image"
        
        if len(face_locations) > 1:
            return None, f"Multiple faces detected ({len(face_locations)} faces). Only one face allowed"
        
        # Get face encoding
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        
        if len(face_encodings) == 0:
            return None, "Could not extract face features"
        
        return face_encodings[0], None
    except Exception as e:
        return None, f"Face encoding error: {str(e)}"

def compare_faces(reference_base64, current_base64):
    """
    Compare two face images and return similarity score (0-100)
    
    Args:
        reference_base64: Base64 encoded reference photo
        current_base64: Base64 encoded current photo
    
    Returns:
        dict: {
            'success': bool,
            'match_score': float (0-100),
            'is_match': bool,
            'threshold': int (70),
            'error': str or None
        }
    """
    result = {
        'success': False,
        'match_score': 0,
        'is_match': False,
        'threshold': 70,
        'error': None
    }
    
    try:
        # Decode images
        print("Decoding reference image...", file=sys.stderr)
        ref_image = decode_base64_image(reference_base64)
        
        print("Decoding current image...", file=sys.stderr)
        cur_image = decode_base64_image(current_base64)
        
        # Get face encodings
        print("Extracting face from reference image...", file=sys.stderr)
        ref_encoding, ref_error = get_face_encoding(ref_image)
        if ref_encoding is None:
            result['error'] = f"Reference photo: {ref_error}"
            return result
        
        print("Extracting face from current image...", file=sys.stderr)
        cur_encoding, cur_error = get_face_encoding(cur_image)
        if cur_encoding is None:
            result['error'] = f"Current photo: {cur_error}"
            return result
        
        # Calculate face distance
        # face_distance returns value between 0 (identical) and 1 (completely different)
        print("Comparing faces...", file=sys.stderr)
        distance = face_recognition.face_distance([ref_encoding], cur_encoding)[0]
        
        # Convert distance to similarity percentage
        # distance = 0.0 → 100% match
        # distance = 0.6 → 40% match (threshold)
        # distance = 1.0 → 0% match
        similarity = (1 - distance) * 100
        
        # Round to 2 decimal places
        similarity = round(similarity, 2)
        
        print(f"Face distance: {distance:.4f}", file=sys.stderr)
        print(f"Similarity score: {similarity}%", file=sys.stderr)
        
        result['success'] = True
        result['match_score'] = similarity
        result['is_match'] = similarity >= 70  # 70% threshold
        
        return result
        
    except Exception as e:
        result['error'] = str(e)
        return result

def main():
    """
    Main function - reads JSON from stdin, processes, outputs JSON to stdout
    
    Expected input format:
    {
        "reference_photo": "data:image/jpeg;base64,...",
        "current_photo": "data:image/jpeg;base64,..."
    }
    
    Output format:
    {
        "success": true/false,
        "match_score": 87.34,
        "is_match": true/false,
        "threshold": 70,
        "error": null or "error message"
    }
    """
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        # Validate input
        if 'reference_photo' not in data or 'current_photo' not in data:
            print(json.dumps({
                'success': False,
                'match_score': 0,
                'is_match': False,
                'threshold': 70,
                'error': 'Missing reference_photo or current_photo in input'
            }))
            sys.exit(1)
        
        # Compare faces
        result = compare_faces(data['reference_photo'], data['current_photo'])
        
        # Output result as JSON
        print(json.dumps(result))
        
        # Exit with appropriate code
        sys.exit(0 if result['success'] else 1)
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'match_score': 0,
            'is_match': False,
            'threshold': 70,
            'error': f'Invalid JSON input: {str(e)}'
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'success': False,
            'match_score': 0,
            'is_match': False,
            'threshold': 70,
            'error': f'Unexpected error: {str(e)}'
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()
