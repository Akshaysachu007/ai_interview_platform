# 🚀 Quick Start - Identity Verification with Python

## Installation (5 minutes)

### Windows
```powershell
# Run setup script
.\setup-face-recognition.bat
```

### Linux/Mac
```bash
# Make script executable
chmod +x setup-face-recognition.sh

# Run setup
./setup-face-recognition.sh
```

---

## Usage Flow

### 1. Candidate Applies with Photo
```jsx
// In your interview browser component
import ApplicationPhotoCapture from './components/ApplicationPhotoCapture';

<ApplicationPhotoCapture
  interviewId={interviewId}
  onApplicationComplete={(data) => {
    alert('Application submitted!');
  }}
  onCancel={() => setShowCapture(false)}
/>
```

### 2. Recruiter Sees Photo
```jsx
// Display application photo
{application.candidateApplicationPhoto && (
  <img src={application.candidateApplicationPhoto} alt="Candidate" />
)}
```

### 3. Candidate Verifies Before Interview
```jsx
// In AIInterview.jsx or similar
import IdentityVerification from './components/IdentityVerification';

{showVerification ? (
  <IdentityVerification
    interviewId={interviewId}
    onVerificationComplete={() => startInterview()}
  />
) : (
  // Interview UI
)}
```

---

## API Endpoints

### Apply with Photo
```javascript
POST /api/interview/apply/:interviewId
{
  "candidatePhoto": "data:image/jpeg;base64,..."
}
```

### Verify Face
```javascript
POST /api/identity-verification/verify-face
{
  "interviewId": "interview_id",
  "currentPhoto": "data:image/jpeg;base64,..."
}

// Response
{
  "verified": true,
  "matchScore": 87.34,
  "canStartInterview": true
}
```

---

## Testing

### Test Python Script
```bash
cd backend/python

# Create test input
echo '{"reference_photo":"data:image/jpeg;base64,iVBORw0KGgo...","current_photo":"data:image/jpeg;base64,iVBORw0KGgo..."}' | python face_verification.py
```

### Test from Node.js
```javascript
const { spawn } = require('child_process');

const python = spawn('python', ['backend/python/face_verification.py']);

python.stdout.on('data', (data) => {
  console.log('Result:', JSON.parse(data.toString()));
});

python.stdin.write(JSON.stringify({
  reference_photo: "data:image/jpeg;base64,...",
  current_photo: "data:image/jpeg;base64,..."
}));
python.stdin.end();
```

---

## Enable Verification for Interview

```javascript
// When creating interview
const interview = new Interview({
  stream: 'Computer Science',
  difficulty: 'Medium',
  identityVerificationRequired: true, // Enable verification
  // ... other fields
});
```

---

## Troubleshooting

### "Python not found"
- Install Python 3.8+ from python.org
- Add to PATH

### "dlib install failed"
- Windows: Install Visual Studio Build Tools
- Linux: `sudo apt-get install build-essential cmake`
- Mac: `brew install cmake`

### "No face detected"
- Check lighting
- Ensure face is centered
- Remove glasses/hats
- Only one person in frame

### "Match score too low"
- Improve lighting
- Face camera directly
- Use same background
- Ensure clear photo quality

---

## Configuration

### Adjust Match Threshold
```javascript
// In face_verification.py (line 128)
result['is_match'] = similarity >= 70  // Change 70 to your threshold
```

### Store Photos in S3 (Production)
```javascript
// Instead of base64 in MongoDB
import AWS from 'aws-sdk';
const s3 = new AWS.S3();

// Upload to S3
const params = {
  Bucket: 'interview-photos',
  Key: `${candidateId}-${Date.now()}.jpg`,
  Body: Buffer.from(photoBase64.split(',')[1], 'base64'),
  ContentType: 'image/jpeg'
};

const result = await s3.upload(params).promise();
interview.candidateApplicationPhoto = result.Location; // Store URL
```

---

## Architecture

```
Application Flow:
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Capture   │ --> │  Store in    │ --> │  Recruiter  │
│   Photo     │     │  Interview   │     │  Reviews    │
└─────────────┘     └──────────────┘     └─────────────┘
                                               │
                                               ▼
                                          Accept
                                               │
                                               ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Python    │ <-- │   Verify     │ <-- │  Start      │
│   Matching  │     │   Face       │     │  Interview  │
└─────────────┘     └──────────────┘     └─────────────┘
```

---

## Files Reference

- **Backend:**
  - `models/Interview.js` - Schema with photo fields
  - `routes/interview.js` - Application endpoint
  - `routes/identityVerification.js` - Verification endpoint
  - `python/face_verification.py` - Python matching script
  - `python/requirements.txt` - Dependencies

- **Frontend:**
  - `components/ApplicationPhotoCapture.jsx` - Capture during apply
  - `components/IdentityVerification.jsx` - Verify before interview
  - `components/*.css` - Styling

---

## Documentation

- Full Guide: `PYTHON_IDENTITY_VERIFICATION_GUIDE.md`
- Original Guide: `IDENTITY_VERIFICATION_GUIDE.md`

---

## Support

- Check Python logs: `python backend/python/face_verification.py`
- Check Node logs: Backend console shows Python output
- Test face matching: Use sample images
- Adjust threshold: Modify in `face_verification.py`

---

✅ **Status: Fully Implemented with Python Face Recognition!**
