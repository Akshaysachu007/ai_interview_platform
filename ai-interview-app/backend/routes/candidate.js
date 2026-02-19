import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Candidate from '../models/Candidate.js';
import Interview from '../models/Interview.js';
import auth from '../middleware/auth.js';
import SimpleResumeParser from '../services/simpleResumeParser.js';
import { calculateATSScore } from '../services/atsService.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Register endpoint hit. Body:', req.body);
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
    const existing = await Candidate.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const candidate = new Candidate({ name, email, password: hashed });
    await candidate.save();
    console.log('Candidate saved:', candidate);
    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Candidate login attempt:', { email: req.body.email });
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    const candidate = await Candidate.findOne({ email });
    if (!candidate) {
      console.log('❌ Candidate not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('✓ Candidate found:', candidate.email);
    const isMatch = await bcrypt.compare(password, candidate.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: candidate._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
    console.log('✅ Login successful:', email);
    res.json({ token });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.candidate.id).select('-password');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    console.log('📝 Profile update request:', req.body);
    
    // Define allowed fields that exist in the Candidate schema
    const allowedFields = [
      'name', 'phone', 'skills', 'bio', 'avatar', 'stream', 
      'notificationsEnabled', 'resumeText', 'resumeUrl', 
      'personalDetails', 'workExperience', 'education', 
      'certifications', 'extractedSkills', 'profileSummary', 'completed'
    ];
    
    // Filter update to only include allowed fields
    const update = {};
    allowedFields.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        update[field] = req.body[field];
      }
    });
    
    // Handle resume field mapping (frontend sends 'resume', backend uses 'resumeUrl')
    if (req.body.resume) {
      update.resumeUrl = req.body.resume;
    }
    
    // Never update password through this endpoint
    if (update.password) delete update.password;
    // Never update email through this endpoint (it's unique identifier)
    if (update.email) delete update.email;
    
    // Validate stream if provided
    const validStreams = ['Computer Science', 'Information Technology', 'Mechanical Engineering', 
                         'Electrical Engineering', 'Civil Engineering', 'Business Management', 
                         'Marketing', 'Finance', 'Data Science', 'AI/ML'];
    
    if (update.stream !== undefined) {
      if (update.stream === '' || update.stream === null) {
        // Remove stream field if empty (set to undefined to unset it)
        update.stream = undefined;
      } else if (!validStreams.includes(update.stream)) {
        console.log('❌ Invalid stream value:', update.stream);
        return res.status(400).json({ message: 'Invalid stream selected' });
      }
    }
    
    // Validate personalDetails structure if provided
    if (update.personalDetails && typeof update.personalDetails === 'object') {
      const validPersonalFields = ['fullName', 'linkedinUrl', 'location', 'phone'];
      const filteredPersonalDetails = {};
      validPersonalFields.forEach(field => {
        if (update.personalDetails.hasOwnProperty(field)) {
          filteredPersonalDetails[field] = update.personalDetails[field];
        }
      });
      update.personalDetails = filteredPersonalDetails;
    }
    
    console.log('📝 Filtered update:', update);
    
    const candidate = await Candidate.findByIdAndUpdate(
      req.candidate.id, 
      update, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    console.log('✅ Profile updated successfully');
    res.json(candidate);
  } catch (err) {
    console.error('❌ Profile update error:', err);
    
    // Handle specific Mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation error: ' + errors.join(', '),
        errors: errors 
      });
    }
    
    // Handle cast errors (invalid data types)
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: `Invalid ${err.path}: ${err.value}` 
      });
    }
    
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get available interviews by stream
router.get('/interviews/available', auth, async (req, res) => {
  try {
    const { stream } = req.query;
    
    const query = { applicationStatus: 'open' };
    if (stream && stream !== 'All') {
      query.stream = stream;
    }

    const interviews = await Interview.find(query)
      .populate('recruiterId', 'name email company')
      .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (err) {
    console.error('Get available interviews error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply for an interview
router.post('/interviews/:interviewId/apply', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.applicationStatus !== 'open') {
      return res.status(400).json({ message: 'This interview is not available for applications' });
    }

    // Check if candidate already applied to another interview with same recruiter
    const existingApplication = await Interview.findOne({
      candidateId: req.candidate.id,
      recruiterId: interview.recruiterId,
      applicationStatus: { $in: ['pending', 'accepted'] }
    });

    if (existingApplication) {
      return res.status(400).json({ 
        message: 'You already have a pending or accepted application with this recruiter' 
      });
    }

    // Get candidate's resume text
    const candidate = await Candidate.findById(req.candidate.id);
    
    // Calculate ATS score if both resume and job description exist
    let atsResult = null;
    if (candidate.resumeText && interview.jobDescription) {
      console.log('📊 Calculating ATS score...');
      atsResult = calculateATSScore(candidate.resumeText, interview.jobDescription);
      
      // Store ATS score in interview
      interview.atsScore = atsResult.score;
      interview.resumeText = candidate.resumeText;
      
      // Store in applicationScores array
      interview.applicationScores.push({
        candidateId: req.candidate.id,
        score: atsResult.score,
        breakdown: atsResult.breakdown,
        gapAnalysis: atsResult.gapAnalysis,
        strengths: atsResult.strengths,
        weaknesses: atsResult.weaknesses,
        recommendation: atsResult.recommendation
      });
      
      console.log(`✅ ATS Score calculated: ${atsResult.score}%`);
    }

    // Update interview with candidate and set to pending
    interview.candidateId = req.candidate.id;
    interview.applicationStatus = 'pending';
    await interview.save();

    await interview.populate('recruiterId', 'name email company');

    res.json({ 
      message: 'Application submitted successfully. Awaiting recruiter approval.',
      interview,
      atsScore: atsResult ? atsResult.score : null
    });
  } catch (err) {
    console.error('Apply for interview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my applications (for candidate)
router.get('/my-applications', auth, async (req, res) => {
  try {
    const applications = await Interview.find({ 
      candidateId: req.candidate.id,
      applicationStatus: { $in: ['pending', 'accepted', 'rejected'] }
    })
      .populate('recruiterId', 'name email company')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accepted interviews (ready to start)
router.get('/interviews/accepted', auth, async (req, res) => {
  try {
    const interviews = await Interview.find({ 
      candidateId: req.candidate.id,
      applicationStatus: 'accepted',
      status: { $in: ['scheduled', 'in-progress'] }
    })
      .populate('recruiterId', 'name email company')
      .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (err) {
    console.error('Get accepted interviews error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete/withdraw application (candidate)
router.delete('/interviews/:interviewId', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Verify it's the candidate's interview/application
    if (interview.candidateId && interview.candidateId.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Don't allow deletion of in-progress interviews
    if (interview.status === 'in-progress') {
      return res.status(400).json({ message: 'Cannot delete an in-progress interview' });
    }

    // If it's a pending or accepted application, just withdraw it
    if (['pending', 'accepted'].includes(interview.applicationStatus)) {
      interview.candidateId = null;
      interview.applicationStatus = 'open';
      await interview.save();
      return res.json({ message: 'Application withdrawn successfully' });
    }

    // If it's a completed interview created by candidate, delete it
    await Interview.findByIdAndDelete(interviewId);

    res.json({ message: 'Interview deleted successfully' });
  } catch (err) {
    console.error('Delete interview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/resume/parse', auth, async (req, res) => {
  try {
    console.log('📋 Resume parsing request from candidate:', req.candidate.id);
    const { fileBase64, fileType } = req.body;

    if (!fileBase64 || !fileType) {
      return res.status(400).json({ 
        message: 'File data is required',
        hint: 'Provide fileBase64 (base64 encoded file) and fileType (pdf or docx)'
      });
    }

    console.log('📄 Extracting data from resume...');
    
    // Extract contact info, skills, and bio using Python
    const extractionResult = await SimpleResumeParser.parseResume(fileBase64, fileType);
    
    if (!extractionResult.success) {
      return res.status(500).json({ 
        message: 'Failed to extract data from resume',
        error: extractionResult.error,
        hint: 'Ensure Python is installed with: pip install pdfplumber==0.11.0 python-docx==1.1.0'
      });
    }

    const { contact, skills, bio, text } = extractionResult;

    // Update candidate profile with extracted data
    const candidate = await Candidate.findById(req.candidate.id);
    
    // Store raw text
    candidate.resumeText = text;
    candidate.lastResumeUpdate = new Date();
    
    // Update contact information
    if (contact.name) {
      candidate.name = contact.name;
    }
    if (contact.email) {
      // Don't overwrite registered email, but store in personalDetails
      if (!candidate.personalDetails) candidate.personalDetails = {};
      candidate.personalDetails.email = contact.email;
    }
    if (contact.phone) {
      candidate.phone = contact.phone;
      if (!candidate.personalDetails) candidate.personalDetails = {};
      candidate.personalDetails.phone = contact.phone;
    }
    if (contact.linkedin) {
      if (!candidate.personalDetails) candidate.personalDetails = {};
      candidate.personalDetails.linkedinUrl = contact.linkedin;
    }
    
    // Update skills
    if (skills && skills.length > 0) {
      // Merge with existing skills and remove duplicates
      const allSkills = [...(candidate.skills || []), ...skills];
      candidate.skills = [...new Set(allSkills.map(s => s.toLowerCase()))];
    }
    
    // Update bio
    if (bio) {
      candidate.bio = bio;
    }

    // Calculate profile completeness
    let completeness = 0;
    if (candidate.name) completeness += 15;
    if (candidate.email) completeness += 15;
    if (candidate.phone) completeness += 15;
    if (candidate.skills && candidate.skills.length > 0) completeness += 30;
    if (candidate.bio) completeness += 25;
    
    candidate.profileCompleteness = completeness;

    await candidate.save();

    console.log('✅ Resume parsed and profile updated for:', candidate.name);

    res.json({
      message: 'Resume parsed successfully',
      extractedData: {
        contact,
        skills,
        bio,
        textLength: text.length
      },
      profileCompleteness: completeness,
      profile: {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        skills: candidate.skills,
        bio: candidate.bio,
        personalDetails: candidate.personalDetails
      }
    });

  } catch (err) {
    console.error('❌ Resume parsing error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

/**
 * TASK 2: Check Skill Match for Interview
 * Calculate if candidate matches job requirements
 */
router.get('/interviews/:interviewId/skill-match', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const candidate = await Candidate.findById(req.candidate.id);
    
    // Combine all candidate skills
    const candidateSkills = [
      ...(candidate.skills || []),
      ...(candidate.extractedSkills?.hardSkills || []),
      ...(candidate.extractedSkills?.softSkills || [])
    ];

    const requiredSkills = interview.requiredSkills || [];

    if (requiredSkills.length === 0) {
      return res.json({
        message: 'No specific skill requirements for this position',
        matchPercentage: 100,
        shouldApply: true
      });
    }

    // Calculate match using AI service
    const matchResult = AIService.calculateSkillMatch(candidateSkills, requiredSkills);

    res.json({
      matchPercentage: matchResult.matchPercentage,
      shouldApply: matchResult.shouldNotify,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      totalRequired: matchResult.totalRequired,
      totalMatched: matchResult.totalMatched,
      message: matchResult.shouldNotify 
        ? `Great match! You have ${matchResult.totalMatched} out of ${matchResult.totalRequired} required skills.`
        : `Your skill match is below 60%. Consider gaining experience in: ${matchResult.missingSkills.slice(0, 3).join(', ')}`
    });

  } catch (err) {
    console.error('❌ Skill match error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

/**
 * TASK 3: Validate & Score Resume Against Job Description
 * Score candidate's resume when applying or validating
 */
router.post('/interviews/:interviewId/validate', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;
    console.log('📊 Resume validation request for interview:', interviewId);

    const interview = await Interview.findById(interviewId).populate('recruiterId', 'name company');
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const candidate = await Candidate.findById(req.candidate.id);

    // Prepare candidate profile for scoring
    const candidateProfile = {
      personalDetails: candidate.personalDetails || {
        fullName: candidate.name,
        email: candidate.email,
        phone: candidate.phone
      },
      workExperience: candidate.workExperience || [],
      education: candidate.education || [],
      certifications: candidate.certifications || [],
      skills: {
        hardSkills: candidate.extractedSkills?.hardSkills || candidate.skills || [],
        softSkills: candidate.extractedSkills?.softSkills || []
      }
    };

    // Prepare job description
    const jobDescription = {
      title: interview.title || interview.stream,
      company: interview.company || interview.recruiterId?.company,
      stream: interview.stream,
      difficulty: interview.difficulty,
      requiredSkills: interview.requiredSkills || [],
      preferredSkills: interview.preferredSkills || [],
      description: interview.jobDescription || interview.description,
      requirements: interview.requirements || {}
    };

    // Score resume using AI service
    const scoringResult = await AIService.scoreResumeAgainstJD(candidateProfile, jobDescription);

    // Save scoring result to interview
    const existingScoreIndex = interview.applicationScores?.findIndex(
      score => score.candidateId.toString() === req.candidate.id
    );

    const scoreEntry = {
      candidateId: req.candidate.id,
      score: scoringResult.overallScore,
      breakdown: scoringResult.breakdown,
      gapAnalysis: scoringResult.gapAnalysis,
      strengths: scoringResult.strengths,
      weaknesses: scoringResult.weaknesses,
      recommendation: scoringResult.recommendation,
      scoredAt: new Date()
    };

    if (existingScoreIndex >= 0) {
      interview.applicationScores[existingScoreIndex] = scoreEntry;
    } else {
      if (!interview.applicationScores) interview.applicationScores = [];
      interview.applicationScores.push(scoreEntry);
    }

    await interview.save();

    console.log(`✅ Resume scored: ${scoringResult.overallScore}/100 - ${scoringResult.recommendation}`);

    res.json({
      message: 'Resume validated successfully',
      score: scoringResult.overallScore,
      breakdown: scoringResult.breakdown,
      gapAnalysis: scoringResult.gapAnalysis,
      strengths: scoringResult.strengths,
      weaknesses: scoringResult.weaknesses,
      recommendation: scoringResult.recommendation,
      canApply: scoringResult.overallScore >= 40 // Minimum threshold
    });

  } catch (err) {
    console.error('❌ Resume validation error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

/**
 * Get Resume Score History
 * View all resume scores for different job applications
 */
router.get('/resume/scores', auth, async (req, res) => {
  try {
    const interviews = await Interview.find({
      'applicationScores.candidateId': req.candidate.id
    })
      .populate('recruiterId', 'name company')
      .select('title company stream difficulty applicationScores');

    const scores = interviews.map(interview => {
      const candidateScore = interview.applicationScores.find(
        score => score.candidateId.toString() === req.candidate.id
      );

      return {
        interviewId: interview._id,
        jobTitle: interview.title || interview.stream,
        company: interview.company || interview.recruiterId?.company,
        stream: interview.stream,
        difficulty: interview.difficulty,
        score: candidateScore.score,
        breakdown: candidateScore.breakdown,
        recommendation: candidateScore.recommendation,
        scoredAt: candidateScore.scoredAt
      };
    });

    res.json({
      totalScores: scores.length,
      averageScore: scores.length > 0 
        ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
        : 0,
      scores: scores.sort((a, b) => new Date(b.scoredAt) - new Date(a.scoredAt))
    });

  } catch (err) {
    console.error('❌ Get scores error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

export default router;
