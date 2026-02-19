import express from 'express';
import auth from '../middleware/auth.js';
import Interview from '../models/Interview.js';
import Candidate from '../models/Candidate.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// =====================================================================
// IDENTITY VERIFICATION ROUTES
// =====================================================================

/**
 * Upload reference photo for identity verification
 * Method: POST /api/identity-verification/upload-photo
 */
router.post('/upload-photo', auth, async (req, res) => {
  try {
    const { photoData } = req.body; // Base64 image

    if (!photoData || !photoData.startsWith('data:image')) {
      return res.status(400).json({ message: 'Invalid photo data. Must be base64 image.' });
    }

    const candidate = await Candidate.findById(req.candidate.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Store reference photo
    if (!candidate.identityVerification) {
      candidate.identityVerification = {};
    }
    
    candidate.identityVerification.referencePhoto = photoData;
    candidate.identityVerification.verificationMethod = 'live_photo';
    
    // Log attempt
    if (!candidate.identityVerification.verificationAttempts) {
      candidate.identityVerification.verificationAttempts = [];
    }
    
    candidate.identityVerification.verificationAttempts.push({
      attemptedAt: new Date(),
      method: 'live_photo',
      success: false, // Will be updated after face match
      failureReason: null
    });

    await candidate.save();

    res.json({
      message: 'Photo uploaded successfully',
      photoUploaded: true
    });

  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * Verify identity with face matching before interview
 * Method: POST /api/identity-verification/verify-face
 */
router.post('/verify-face', auth, async (req, res) => {
  try {
    const { interviewId, currentPhoto } = req.body;

    if (!currentPhoto || !currentPhoto.startsWith('data:image')) {
      return res.status(400).json({ message: 'Invalid current photo data' });
    }

    const candidate = await Candidate.findById(req.candidate.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidateId.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if verification is required
    if (!interview.identityVerificationRequired) {
      return res.status(400).json({ 
        message: 'Identity verification not required for this interview',
        verificationRequired: false
      });
    }

    // Get reference photo from interview application (uploaded when applying)
    const referencePhoto = interview.candidateApplicationPhoto;
    
    if (!referencePhoto) {
      return res.status(400).json({ 
        message: 'No application photo found. You must upload a photo when applying for the interview.',
        needsApplicationPhoto: true
      });
    }

    console.log('📸 Reference photo found from application');
    console.log('📸 Current photo received for verification');

    // ===================================================================
    // FACE MATCHING LOGIC - Using Python face_recognition
    // ===================================================================
    
    console.log('🔍 Starting face matching with Python service...');
    const faceMatchResult = await pythonFaceMatching(referencePhoto, currentPhoto);
    
    if (!faceMatchResult.success) {
      return res.status(400).json({
        message: 'Face matching failed: ' + faceMatchResult.error,
        verified: false,
        error: faceMatchResult.error,
        canStartInterview: false
      });
    }
    
    const faceMatchScore = faceMatchResult.match_score;
    const MATCH_THRESHOLD = faceMatchResult.threshold;
    const isMatch = faceMatchResult.is_match;

    // Update candidate verification record
    if (!candidate.identityVerification.verificationAttempts) {
      candidate.identityVerification.verificationAttempts = [];
    }
    
    candidate.identityVerification.verificationAttempts.push({
      attemptedAt: new Date(),
      method: 'face_match',
      success: isMatch,
      failureReason: isMatch ? null : `Low match score: ${faceMatchScore}%`,
      matchScore: faceMatchScore
    });

    if (isMatch) {
      // Mark candidate as verified
      candidate.identityVerification.isVerified = true;
      candidate.identityVerification.verifiedAt = new Date();
      candidate.identityVerification.verificationMethod = 'face_match';
      candidate.identityVerification.faceMatchScore = faceMatchScore;
      candidate.identityVerification.verificationIP = req.ip || req.connection.remoteAddress;
      candidate.identityVerification.verificationDevice = req.headers['user-agent'];

      // Mark interview verification as completed
      interview.identityVerificationCompleted = true;
      interview.identityVerificationData = {
        verifiedAt: new Date(),
        verificationMethod: 'face_match',
        faceMatchScore: faceMatchScore,
        referenceSnapshot: currentPhoto,
        verificationIP: req.ip || req.connection.remoteAddress,
        verificationDevice: req.headers['user-agent']
      };
      
      await candidate.save();
      await interview.save();

      return res.json({
        message: 'Identity verified successfully! You can now start the interview.',
        verified: true,
        matchScore: faceMatchScore,
        canStartInterview: true
      });
    } else {
      await candidate.save();
      
      return res.status(400).json({
        message: 'Identity verification failed. Face does not match reference photo.',
        verified: false,
        matchScore: faceMatchScore,
        threshold: MATCH_THRESHOLD,
        canStartInterview: false,
        hint: 'Please ensure good lighting and face the camera directly.'
      });
    }

  } catch (err) {
    console.error('Face verification error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * Upload ID document for verification
 * Method: POST /api/identity-verification/upload-id
 */
router.post('/upload-id', auth, async (req, res) => {
  try {
    const { idType, documentNumber, documentImage } = req.body;

    if (!idType || !documentImage) {
      return res.status(400).json({ message: 'ID type and document image required' });
    }

    const candidate = await Candidate.findById(req.candidate.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    if (!candidate.identityVerification) {
      candidate.identityVerification = {};
    }

    candidate.identityVerification.idDocument = {
      type: idType,
      documentNumber: documentNumber || '',
      documentImage: documentImage,
      verified: false,
      verifiedAt: null
    };

    candidate.identityVerification.verificationAttempts.push({
      attemptedAt: new Date(),
      method: 'government_id',
      success: false, // Will be verified manually or via OCR
      failureReason: 'Pending verification'
    });

    await candidate.save();

    res.json({
      message: 'ID document uploaded successfully. Pending verification.',
      idUploaded: true,
      pendingVerification: true
    });

  } catch (err) {
    console.error('ID upload error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * Check verification status for an interview
 * Method: GET /api/identity-verification/status/:interviewId
 */
router.get('/status/:interviewId', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidateId.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const candidate = await Candidate.findById(req.candidate.id);

    res.json({
      verificationRequired: interview.identityVerificationRequired,
      verificationCompleted: interview.identityVerificationCompleted,
      hasApplicationPhoto: !!interview.candidateApplicationPhoto,
      applicationPhotoUploadedAt: interview.candidateApplicationPhotoUploadedAt,
      candidateVerified: candidate.identityVerification?.isVerified || false,
      verificationMethod: candidate.identityVerification?.verificationMethod || 'none',
      verifiedAt: candidate.identityVerification?.verifiedAt || null,
      canStartInterview: !interview.identityVerificationRequired || interview.identityVerificationCompleted
    });

  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * Manual verification by admin/recruiter
 * Method: POST /api/identity-verification/manual-verify
 */
router.post('/manual-verify', auth, async (req, res) => {
  try {
    const { candidateId, verified, notes } = req.body;

    // This would normally require admin/recruiter auth middleware
    // For now, assuming the caller has permission

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    if (!candidate.identityVerification) {
      candidate.identityVerification = {};
    }

    candidate.identityVerification.manuallyVerified = verified;
    candidate.identityVerification.isVerified = verified;
    candidate.identityVerification.verifiedAt = new Date();
    candidate.identityVerification.verificationNotes = notes;
    // candidate.identityVerification.verifiedBy = req.user.id; // Admin/Recruiter ID
    // candidate.identityVerification.verifiedByModel = req.user.role; // 'Admin' or 'Recruiter'

    await candidate.save();

    res.json({
      message: verified ? 'Candidate verified successfully' : 'Candidate verification revoked',
      verified: verified
    });

  } catch (err) {
    console.error('Manual verification error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

/**
 * Call Python face matching service
 * @param {string} referencePhoto - Base64 reference photo
 * @param {string} currentPhoto - Base64 current photo
 * @returns {Promise<object>} - {success, match_score, is_match, threshold, error}
 */
async function pythonFaceMatching(referencePhoto, currentPhoto) {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '..', 'python', 'face_verification.py');
    
    console.log('📂 Python script path:', pythonScriptPath);
    console.log('🐍 Spawning Python process...');
    
    // Spawn Python process
    const pythonProcess = spawn('python', [pythonScriptPath]);
    
    let outputData = '';
    let errorData = '';
    
    // Collect stdout
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    // Collect stderr (for logging)
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.log('🐍 Python:', data.toString().trim());
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      console.log(`🐍 Python process exited with code ${code}`);
      
      if (errorData) {
        console.log('🐍 Python stderr:', errorData);
      }
      
      try {
        const result = JSON.parse(outputData);
        console.log('✅ Face matching result:', result);
        resolve(result);
      } catch (err) {
        console.error('❌ Failed to parse Python output:', outputData);
        resolve({
          success: false,
          match_score: 0,
          is_match: false,
          threshold: 70,
          error: 'Failed to parse face matching result: ' + err.message
        });
      }
    });
    
    // Handle errors
    pythonProcess.on('error', (err) => {
      console.error('❌ Python process error:', err);
      resolve({
        success: false,
        match_score: 0,
        is_match: false,
        threshold: 70,
        error: 'Python process error: ' + err.message
      });
    });
    
    // Send input data to Python script via stdin
    const inputData = JSON.stringify({
      reference_photo: referencePhoto,
      current_photo: currentPhoto
    });
    
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();
  });
}

/**
 * Simulate face matching (DEPRECATED - replaced by Python service)
 * Kept for fallback if Python is not available
 * @param {string} referencePhoto - Base64 reference photo
 * @param {string} currentPhoto - Base64 current photo
 * @returns {number} - Match score (0-100)
 */
async function simulateFaceMatching(referencePhoto, currentPhoto) {
  // ===================================================================
  // PRODUCTION IMPLEMENTATION:
  // ===================================================================
  // 
  // Option 1: AWS Rekognition
  // const rekognition = new AWS.Rekognition();
  // const result = await rekognition.compareFaces({
  //   SourceImage: { Bytes: Buffer.from(referencePhoto.split(',')[1], 'base64') },
  //   TargetImage: { Bytes: Buffer.from(currentPhoto.split(',')[1], 'base64') },
  //   SimilarityThreshold: 70
  // }).promise();
  // return result.FaceMatches[0]?.Similarity || 0;
  //
  // Option 2: Azure Face API
  // const faceClient = new FaceClient(credentials, endpoint);
  // const verifyResult = await faceClient.face.verifyFaceToFace(face1Id, face2Id);
  // return verifyResult.confidence * 100;
  //
  // Option 3: Face++ API
  // const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/compare', {
  //   api_key: process.env.FACEPP_API_KEY,
  //   api_secret: process.env.FACEPP_API_SECRET,
  //   image_base64_1: referencePhoto.split(',')[1],
  //   image_base64_2: currentPhoto.split(',')[1]
  // });
  // return response.data.confidence;
  //
  // ===================================================================
  
  // For demo purposes, simulate a match score
  // In a real implementation, this would use actual face recognition
  const randomFactor = Math.random();
  
  // Simulate realistic matching scenarios:
  // - 80% chance of good match (75-95%)
  // - 15% chance of medium match (50-74%)
  // - 5% chance of poor match (0-49%)
  if (randomFactor < 0.80) {
    return Math.floor(75 + Math.random() * 20); // 75-95%
  } else if (randomFactor < 0.95) {
    return Math.floor(50 + Math.random() * 24); // 50-74%
  } else {
    return Math.floor(Math.random() * 50); // 0-49%
  }
}

export default router;
