import express from 'express';
import Interview from '../models/Interview.js';
import Question from '../models/Question.js';
import AIService from '../services/aiService.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get available interviews by stream (for candidates to browse)
router.get('/available', auth, async (req, res) => {
  try {
    const { stream } = req.query;
    
    const query = { applicationStatus: 'open' };
    if (stream) {
      query.stream = stream;
    }

    const interviews = await Interview.find(query)
      .populate('recruiterId', 'name email company')
      .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (err) {
    console.error('Get available interviews error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get recruiters by stream
router.get('/recruiters-by-stream', auth, async (req, res) => {
  try {
    const { stream } = req.query;
    
    if (!stream) {
      return res.status(400).json({ message: 'Stream is required' });
    }

    // Find recruiters who have open interviews in this stream
    const interviews = await Interview.find({ 
      stream, 
      applicationStatus: 'open' 
    })
      .populate('recruiterId', 'name email company')
      .distinct('recruiterId');

    res.json(interviews);
  } catch (err) {
    console.error('Get recruiters by stream error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Apply for interview (candidate)
router.post('/apply/:interviewId', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.applicationStatus !== 'open') {
      return res.status(400).json({ message: 'This interview is not available for applications' });
    }

    // Update interview with candidate and set to pending
    interview.candidateId = req.candidate.id;
    interview.applicationStatus = 'pending';
    await interview.save();

    await interview.populate('recruiterId', 'name email company');

    res.json({ 
      message: 'Application submitted successfully. Awaiting recruiter approval.',
      interview 
    });
  } catch (err) {
    console.error('Apply for interview error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get pending applications (for recruiter)
router.get('/pending-applications', auth, async (req, res) => {
  try {
    // Note: auth middleware needs to be updated to support recruiter auth
    const applications = await Interview.find({ 
      recruiterId: req.candidate.id, // This will need to be updated based on your auth
      applicationStatus: 'pending' 
    })
      .populate('candidateId', 'name email')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error('Get pending applications error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Accept/Reject application (recruiter)
router.post('/application/:interviewId/decision', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { decision } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision. Must be "accepted" or "rejected"' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Verify it's the recruiter's interview
    if (interview.recruiterId.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (interview.applicationStatus !== 'pending') {
      return res.status(400).json({ message: 'This application is not pending' });
    }

    interview.applicationStatus = decision;
    
    // If rejected, clear the candidate
    if (decision === 'rejected') {
      interview.candidateId = null;
      interview.applicationStatus = 'open'; // Make it available again
    }

    await interview.save();

    await interview.populate('candidateId', 'name email');

    res.json({ 
      message: `Application ${decision} successfully`,
      interview 
    });
  } catch (err) {
    console.error('Application decision error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Start a new interview - Generate questions
router.post('/start', auth, async (req, res) => {
  try {
    const { interviewId } = req.body;

    // Check if interview exists and candidate is accepted
    if (interviewId) {
      const existingInterview = await Interview.findById(interviewId);
      
      if (!existingInterview) {
        return res.status(404).json({ message: 'Interview not found' });
      }

      if (existingInterview.candidateId.toString() !== req.candidate.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      if (existingInterview.applicationStatus !== 'accepted') {
        return res.status(403).json({ 
          message: 'You must be accepted by the recruiter to start this interview',
          applicationStatus: existingInterview.applicationStatus
        });
      }

      if (existingInterview.status === 'completed') {
        return res.status(400).json({ 
          message: 'Interview has already been completed',
          status: existingInterview.status 
        });
      }

      // If interview is already in-progress, return existing questions (resume)
      if (existingInterview.status === 'in-progress') {
        return res.status(200).json({
          message: 'Resuming interview',
          interviewId: existingInterview._id,
          questions: existingInterview.questions.map(q => ({ question: q.question, category: q.category })),
          stream: existingInterview.stream,
          difficulty: existingInterview.difficulty,
          currentQuestionIndex: existingInterview.currentQuestionIndex || 0
        });
      }

      // Generate questions for the accepted interview using REAL AI
      const generatedQuestions = await AIService.generateQuestions(
        existingInterview.stream, 
        existingInterview.difficulty, 
        5
      );

      // Get candidate name for dashboard display
      const Candidate = (await import('../models/Candidate.js')).default;
      const candidate = await Candidate.findById(existingInterview.candidateId);
      
      existingInterview.questions = generatedQuestions;
      existingInterview.status = 'in-progress';
      existingInterview.startTime = new Date();
      existingInterview.startedAt = new Date();
      existingInterview.candidateName = candidate ? candidate.name : 'Unknown';
      await existingInterview.save();

      console.log('✅ Interview started:', {
        interviewId: existingInterview._id,
        candidateId: existingInterview.candidateId,
        recruiterId: existingInterview.recruiterId,
        status: existingInterview.status,
        startedAt: existingInterview.startedAt
      });

      // Save questions to database
      const questionPromises = generatedQuestions.map(q => {
        const question = new Question({
          stream: existingInterview.stream,
          difficulty: existingInterview.difficulty,
          question: q.question,
          category: q.category,
          isAiGenerated: true
        });
        return question.save().catch(err => console.log('Question save error:', err));
      });

      await Promise.all(questionPromises);

      return res.status(200).json({
        message: 'Interview started successfully',
        interviewId: existingInterview._id,
        questions: generatedQuestions.map(q => ({ question: q.question, category: q.category })),
        stream: existingInterview.stream,
        difficulty: existingInterview.difficulty
      });
    }

    // Legacy: Old flow for direct interview start (kept for backwards compatibility)
    const { recruiterId, stream, difficulty } = req.body;

    if (!stream || !difficulty) {
      return res.status(400).json({ message: 'Stream and difficulty are required' });
    }

    // Get candidate name for dashboard display
    const Candidate = (await import('../models/Candidate.js')).default;
    const candidate = await Candidate.findById(req.candidate.id);

    // Generate AI questions using REAL AI
    const generatedQuestions = await AIService.generateQuestions(stream, difficulty, 5);

    // Create interview record
    const interview = new Interview({
      candidateId: req.candidate.id,
      recruiterId: recruiterId || req.candidate.id, // fallback for testing
      candidateName: candidate ? candidate.name : 'Unknown',
      stream,
      difficulty,
      questions: generatedQuestions,
      status: 'in-progress',
      applicationStatus: 'accepted', // Direct start means accepted
      startTime: new Date(),
      startedAt: new Date()
    });

    await interview.save();

    // Save questions to database for future use
    const questionPromises = generatedQuestions.map(q => {
      const question = new Question({
        stream,
        difficulty,
        question: q.question,
        category: q.category,
        isAiGenerated: true
      });
      return question.save().catch(err => console.log('Question save error:', err));
    });

    await Promise.all(questionPromises);

    res.status(201).json({
      message: 'Interview started successfully',
      interviewId: interview._id,
      questions: generatedQuestions.map(q => ({ question: q.question, category: q.category })),
      stream,
      difficulty
    });

  } catch (err) {
    console.error('Start interview error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Submit an answer and detect AI-generated content
router.post('/submit-answer', auth, async (req, res) => {
  try {
    const { interviewId, questionIndex, answer } = req.body;

    if (!interviewId || questionIndex === undefined || !answer) {
      return res.status(400).json({ message: 'Interview ID, question index, and answer are required' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidateId.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Detect if answer is AI-generated using REAL AI
    const aiDetection = await AIService.detectAIGeneratedAnswer(answer);

    // Update question with answer
    if (interview.questions[questionIndex]) {
      interview.questions[questionIndex].answer = answer;
      interview.questions[questionIndex].isAiGenerated = aiDetection.isAiGenerated;
      interview.questions[questionIndex].aiConfidence = aiDetection.confidence;
    }

    // If AI-generated, add to malpractices
    if (aiDetection.isAiGenerated && aiDetection.confidence > 60) {
      interview.malpractices.push({
        type: 'ai_generated_answer',
        detectedAt: new Date(),
        severity: aiDetection.confidence > 80 ? 'high' : 'medium',
        details: `AI-generated answer detected with ${aiDetection.confidence}% confidence. Indicators: ${JSON.stringify(aiDetection.indicators)}`
      });
      interview.aiAnswersDetected += 1;
    }

    await interview.save();

    res.json({
      message: 'Answer submitted successfully',
      aiDetection: {
        isAiGenerated: aiDetection.isAiGenerated,
        confidence: aiDetection.confidence,
        warning: aiDetection.isAiGenerated ? 'This answer appears to be AI-generated' : null
      }
    });

  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Report tab switch
router.post('/report-tab-switch', auth, async (req, res) => {
  try {
    const { interviewId } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidateId.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Add tab switch malpractice
    interview.malpractices.push({
      type: 'tab_switch',
      detectedAt: new Date(),
      severity: interview.tabSwitchCount > 3 ? 'high' : interview.tabSwitchCount > 1 ? 'medium' : 'low',
      details: `Tab/window switch detected. Total switches: ${interview.tabSwitchCount + 1}`
    });

    interview.tabSwitchCount += 1;
    await interview.save();

    res.json({
      message: 'Tab switch recorded',
      totalSwitches: interview.tabSwitchCount,
      warning: interview.tabSwitchCount > 3 ? 'Multiple tab switches detected - interview may be flagged' : null
    });

  } catch (err) {
    console.error('Tab switch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Report voice analysis
router.post('/report-voice-analysis', auth, async (req, res) => {
  try {
    const { interviewId, audioFeatures } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidateId.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Analyze voice for multiple speakers
    const voiceAnalysis = AIService.analyzeVoice(audioFeatures || {
      pitch: Math.random() * 100,
      frequency: Math.random() * 1000,
      duration: Math.random() * 60
    });

    if (voiceAnalysis.multipleVoicesDetected) {
      interview.malpractices.push({
        type: 'multiple_voice',
        detectedAt: new Date(),
        severity: 'high',
        details: voiceAnalysis.details + ` (${voiceAnalysis.numberOfSpeakers} speakers detected, ${voiceAnalysis.confidence}% confidence)`
      });
      interview.voiceChangesDetected += 1;
    }

    await interview.save();

    res.json({
      message: 'Voice analysis completed',
      analysis: voiceAnalysis,
      warning: voiceAnalysis.multipleVoicesDetected ? 'Multiple voices detected - possible impersonation' : null
    });

  } catch (err) {
    console.error('Voice analysis error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Report face detection
router.post('/report-face-detection', auth, async (req, res) => {
  try {
    const { interviewId, facesDetected } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidateId.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Validate input
    const actualFacesDetected = typeof facesDetected === 'number' ? facesDetected : 1;
    
    const faceAnalysis = AIService.analyzeFaceDetection({
      facesDetected: actualFacesDetected,
      timestamp: new Date()
    });

    let warning = null;
    
    // Track face detection issues
    if (faceAnalysis.hasIssue) {
      interview.malpractices.push({
        type: faceAnalysis.type,
        detectedAt: new Date(),
        severity: faceAnalysis.severity,
        details: faceAnalysis.details || `Face detection issue: ${faceAnalysis.facesCount} face(s) detected`
      });

      // Increment the appropriate counter
      if (faceAnalysis.type === 'face_not_detected') {
        interview.noFaceDetected = (interview.noFaceDetected || 0) + 1;
      } else if (faceAnalysis.type === 'multiple_faces') {
        interview.multipleFacesDetected = (interview.multipleFacesDetected || 0) + 1;
      }

      // Count recent face detection violations (last 10 checks - 20 seconds window)
      const recentFaceViolations = interview.malpractices
        .filter(m => m.type === 'face_not_detected' || m.type === 'multiple_faces')
        .slice(-10);

      // Flag interview if 5 or more violations in recent checks (persistent issue)
      if (recentFaceViolations.length >= 5) {
        interview.flagged = true;
        warning = '🚨 CRITICAL: Persistent face detection violations. Interview flagged for review.';
      } else if (faceAnalysis.facesCount === 0) {
        warning = '⚠️ No face detected. Please ensure you are visible and facing the camera.';
      } else if (faceAnalysis.facesCount > 1) {
        warning = `⚠️ ${faceAnalysis.facesCount} faces detected. Only the candidate should be visible.`;
      }
    }

    // Log for debugging
    console.log(`📹 Face Detection: ${actualFacesDetected} face(s) - ${faceAnalysis.isValid ? 'Valid' : 'Invalid'}`);

    await interview.save();

    res.json({
      message: 'Face detection reported',
      analysis: faceAnalysis,
      warning: warning,
      flagged: interview.flagged
    });

  } catch (err) {
    console.error('Face detection error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Complete interview
router.post('/complete', auth, async (req, res) => {
  try {
    const { interviewId } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidateId.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    interview.endTime = new Date();
    interview.completedAt = new Date();
    interview.duration = Math.round((interview.endTime - interview.startTime) / 60000); // in minutes
    
    // Calculate score based on answers and malpractices
    const score = AIService.calculateScore(interview.questions, interview.malpractices);
    interview.score = score;

    // Determine status based on malpractices
    const highSeverityCount = interview.malpractices.filter(m => m.severity === 'high').length;
    interview.flagged = highSeverityCount > 2;
    interview.status = interview.flagged ? 'flagged' : 'completed';

    await interview.save();

    res.json({
      message: 'Interview completed successfully',
      score: interview.score,
      status: interview.status,
      duration: interview.duration,
      malpracticesSummary: {
        total: interview.malpractices.length,
        tabSwitches: interview.tabSwitchCount,
        voiceChanges: interview.voiceChangesDetected,
        aiAnswers: interview.aiAnswersDetected
      },
      flagged: interview.status === 'flagged'
    });

  } catch (err) {
    console.error('Complete interview error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get interview details
router.get('/:interviewId', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId)
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check authorization
    if (interview.candidateId._id.toString() !== req.candidate.id && 
        interview.recruiterId._id.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(interview);

  } catch (err) {
    console.error('Get interview error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all interviews for candidate
router.get('/candidate/all', auth, async (req, res) => {
  try {
    const interviews = await Interview.find({ candidateId: req.candidate.id })
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });

    res.json(interviews);

  } catch (err) {
    console.error('Get interviews error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get interview statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const interviews = await Interview.find({ candidateId: req.candidate.id });

    const stats = {
      totalInterviews: interviews.length,
      completedInterviews: interviews.filter(i => i.status === 'completed').length,
      flaggedInterviews: interviews.filter(i => i.status === 'flagged').length,
      averageScore: interviews.length > 0 
        ? Math.round(interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length)
        : 0,
      totalMalpractices: interviews.reduce((sum, i) => sum + i.malpractices.length, 0),
      malpracticeBreakdown: {
        tabSwitches: interviews.reduce((sum, i) => sum + i.tabSwitchCount, 0),
        voiceChanges: interviews.reduce((sum, i) => sum + i.voiceChangesDetected, 0),
        aiAnswers: interviews.reduce((sum, i) => sum + i.aiAnswersDetected, 0)
      }
    };

    res.json(stats);

  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update webcam snapshot (called from candidate's browser)
router.post('/update-webcam-snapshot', auth, async (req, res) => {
  try {
    const { interviewId, snapshot, faceCount } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.candidateId.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    interview.currentWebcamSnapshot = snapshot;
    interview.currentFaceCount = faceCount;
    interview.lastSnapshotUpdate = new Date();
    await interview.save();

    res.json({ message: 'Snapshot updated' });
  } catch (err) {
    console.error('Update snapshot error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Transcribe audio (for browsers without Web Speech API)
router.post('/transcribe-audio', auth, async (req, res) => {
  try {
    // For now, return a helpful message
    // In production, integrate with Google Cloud Speech-to-Text or similar service
    console.log('📝 Audio transcription requested');
    
    // Simple fallback response
    res.json({
      text: '[Voice input recorded - Please type your answer in the text box as voice transcription requires additional API setup]',
      note: 'Audio transcription requires Google Cloud Speech-to-Text API or similar service. For best experience, please use Chrome or Edge browser which have built-in speech recognition.'
    });
    
  } catch (err) {
    console.error('Transcribe audio error:', err);
    res.status(500).json({ 
      message: 'Transcription failed',
      text: '[Please type your answer in the text box]'
    });
  }
});

// ==================== MOCK INTERVIEW ROUTES ====================

// Start mock interview (no recruiter required)
router.post('/mock/start', auth, async (req, res) => {
  try {
    const { stream, difficulty, duration } = req.body;

    if (!stream || !difficulty) {
      return res.status(400).json({ message: 'Stream and difficulty are required' });
    }

    // Get candidate name
    const Candidate = (await import('../models/Candidate.js')).default;
    const candidate = await Candidate.findById(req.candidate.id);

    // Generate AI questions for mock interview
    const questionCount = 5;
    const generatedQuestions = await AIService.generateQuestions(stream, difficulty, questionCount);

    // Create mock interview record
    const interview = new Interview({
      candidateId: req.candidate.id,
      recruiterId: req.candidate.id, // Self-assigned for mock
      candidateName: candidate ? candidate.name : 'Unknown',
      stream,
      difficulty,
      questions: generatedQuestions,
      status: 'in-progress',
      applicationStatus: 'mock', // Mark as mock interview
      startTime: new Date(),
      startedAt: new Date(),
      description: `Mock Interview - ${stream} (${difficulty})`,
      duration: duration || 30 // Duration in minutes
    });

    await interview.save();

    console.log('✅ Mock interview started:', interview._id);

    res.status(201).json({
      message: 'Mock interview started successfully',
      interviewId: interview._id,
      questions: generatedQuestions.map(q => ({ question: q.question, category: q.category })),
      stream,
      difficulty,
      duration: duration || 30,
      isMock: true
    });

  } catch (err) {
    console.error('Start mock interview error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get mock interview statistics
router.get('/mock/statistics', auth, async (req, res) => {
  try {
    const mockInterviews = await Interview.find({ 
      candidateId: req.candidate.id,
      applicationStatus: 'mock'
    }).sort({ createdAt: -1 });

    const completed = mockInterviews.filter(i => i.status === 'completed');
    
    const stats = {
      totalMockInterviews: mockInterviews.length,
      completedMockInterviews: completed.length,
      averageMockScore: completed.length > 0 
        ? Math.round(completed.reduce((sum, i) => sum + (i.score || 0), 0) / completed.length)
        : 0,
      byStream: {},
      byDifficulty: {},
      recentScores: completed.slice(0, 10).map(i => ({
        date: i.createdAt,
        score: i.score || 0,
        stream: i.stream,
        difficulty: i.difficulty
      }))
    };

    // Group by stream
    mockInterviews.forEach(interview => {
      if (!stats.byStream[interview.stream]) {
        stats.byStream[interview.stream] = { count: 0, totalScore: 0, completedCount: 0 };
      }
      stats.byStream[interview.stream].count++;
      if (interview.status === 'completed' && interview.score) {
        stats.byStream[interview.stream].totalScore += interview.score;
        stats.byStream[interview.stream].completedCount++;
      }
    });

    // Calculate average scores by stream
    Object.keys(stats.byStream).forEach(stream => {
      const data = stats.byStream[stream];
      data.averageScore = data.completedCount > 0 
        ? Math.round(data.totalScore / data.completedCount) 
        : 0;
    });

    // Group by difficulty
    mockInterviews.forEach(interview => {
      if (!stats.byDifficulty[interview.difficulty]) {
        stats.byDifficulty[interview.difficulty] = { count: 0, totalScore: 0, completedCount: 0 };
      }
      stats.byDifficulty[interview.difficulty].count++;
      if (interview.status === 'completed' && interview.score) {
        stats.byDifficulty[interview.difficulty].totalScore += interview.score;
        stats.byDifficulty[interview.difficulty].completedCount++;
      }
    });

    // Calculate average scores by difficulty
    Object.keys(stats.byDifficulty).forEach(difficulty => {
      const data = stats.byDifficulty[difficulty];
      data.averageScore = data.completedCount > 0 
        ? Math.round(data.totalScore / data.completedCount) 
        : 0;
    });

    res.json(stats);
  } catch (err) {
    console.error('Get mock statistics error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Generate interview report (for both candidate and recruiter)
router.get('/:interviewId/report', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const interview = await Interview.findById(interviewId)
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email company');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Authorization check
    const isCandidate = interview.candidateId._id.toString() === req.candidate.id;
    const isRecruiter = interview.recruiterId._id.toString() === req.candidate.id;
    const isMock = interview.applicationStatus === 'mock';

    if (!isCandidate && !isRecruiter && !isMock) {
      return res.status(403).json({ message: 'Unauthorized to view this report' });
    }

    // Calculate detailed analytics
    const totalQuestions = interview.questions.length;
    const answeredQuestions = interview.questions.filter(q => q.answer).length;
    const aiGeneratedAnswers = interview.questions.filter(q => q.isAiGenerated).length;
    
    // Malpractice summary
    const malpracticeByType = {};
    interview.malpractices.forEach(m => {
      if (!malpracticeByType[m.type]) {
        malpracticeByType[m.type] = { count: 0, severity: { low: 0, medium: 0, high: 0 } };
      }
      malpracticeByType[m.type].count++;
      if (m.severity) {
        malpracticeByType[m.type].severity[m.severity]++;
      }
    });

    // Question-wise analysis
    const questionAnalysis = interview.questions.map((q, index) => ({
      questionNumber: index + 1,
      question: q.question,
      answered: !!q.answer,
      answerLength: q.answer ? q.answer.length : 0,
      isAiGenerated: q.isAiGenerated || false,
      aiConfidence: q.aiConfidence || 0,
      category: q.category || 'General'
    }));

    // Performance metrics
    const completionRate = totalQuestions > 0 
      ? Math.round((answeredQuestions / totalQuestions) * 100) 
      : 0;
    
    const integrityScore = 100 - Math.min(
      (interview.tabSwitchCount * 5) + 
      (aiGeneratedAnswers * 10) + 
      (interview.malpractices.filter(m => m.severity === 'high').length * 15),
      100
    );

    const report = {
      interviewId: interview._id,
      candidateName: interview.candidateId.name,
      candidateEmail: interview.candidateId.email,
      recruiterName: interview.recruiterId.name,
      recruiterCompany: interview.recruiterId.company || 'N/A',
      stream: interview.stream,
      difficulty: interview.difficulty,
      isMock: interview.applicationStatus === 'mock',
      
      // Status and scores
      status: interview.status,
      finalScore: interview.score || 0,
      integrityScore,
      completionRate,
      flagged: interview.flagged || false,
      
      // Time metrics
      startTime: interview.startedAt,
      endTime: interview.completedAt,
      duration: interview.duration,
      
      // Question analysis
      totalQuestions,
      answeredQuestions,
      questionAnalysis,
      
      // Malpractice summary
      totalMalpractices: interview.malpractices.length,
      tabSwitches: interview.tabSwitchCount || 0,
      aiDetections: aiGeneratedAnswers,
      voiceChanges: interview.voiceChangesDetected || 0,
      faceViolations: interview.malpractices.filter(m => 
        m.type === 'face_not_detected' || m.type === 'multiple_faces'
      ).length,
      noFaceDetected: interview.noFaceDetected || 0,
      multipleFacesDetected: interview.multipleFacesDetected || 0,
      malpracticeByType,
      
      // Detailed malpractices
      malpractices: interview.malpractices.map(m => ({
        type: m.type,
        detectedAt: m.detectedAt,
        severity: m.severity,
        details: m.details
      })),
      
      // Recommendations
      strengths: [],
      weaknesses: [],
      recommendations: []
    };

    // Generate AI-powered recommendations
    if (report.finalScore >= 80) {
      report.strengths.push('Excellent overall performance');
    }
    if (report.integrityScore >= 90) {
      report.strengths.push('High integrity maintained throughout');
    }
    if (report.completionRate === 100) {
      report.strengths.push('Completed all questions');
    }
    
    if (report.tabSwitches > 3) {
      report.weaknesses.push('Multiple tab switches detected');
      report.recommendations.push('Focus on the interview window and avoid switching tabs');
    }
    if (report.aiDetections > 0) {
      report.weaknesses.push('AI-generated answers detected');
      report.recommendations.push('Provide original, authentic answers in your own words');
    }
    if (report.completionRate < 100) {
      report.weaknesses.push('Not all questions were answered');
      report.recommendations.push('Manage time better to answer all questions');
    }

    res.json(report);
  } catch (err) {
    console.error('Generate report error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
