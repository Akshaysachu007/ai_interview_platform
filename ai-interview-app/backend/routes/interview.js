import express from 'express';
import Interview from '../models/Interview.js';
import Question from '../models/Question.js';
import AIService from '../services/aiService.js';
import answerEvaluationService from '../services/answerEvaluationService.js';
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
    const { candidatePhoto } = req.body; // Photo uploaded during application

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.applicationStatus !== 'open') {
      return res.status(400).json({ message: 'This interview is not available for applications' });
    }

    // Validate photo if verification is required
    if (interview.identityVerificationRequired) {
      if (!candidatePhoto || !candidatePhoto.startsWith('data:image')) {
        return res.status(400).json({ 
          message: 'Photo is required for this interview. Please upload your photo.',
          photoRequired: true
        });
      }
      
      console.log('📸 Candidate photo received for application');
      interview.candidateApplicationPhoto = candidatePhoto;
      interview.candidateApplicationPhotoUploadedAt = new Date();
    }

    // Update interview with candidate and set to pending
    interview.candidateId = req.candidate.id;
    interview.applicationStatus = 'pending';
    await interview.save();

    await interview.populate('recruiterId', 'name email company');

    res.json({ 
      message: 'Application submitted successfully. Awaiting recruiter approval.',
      interview,
      photoUploaded: !!candidatePhoto
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

      // ===================================================================
      // IDENTITY VERIFICATION STATUS CHECK
      // Log verification status but don't hard-block — the frontend gates
      // the Start button behind the IdentityVerification component.
      // If Python face matching is unavailable, blocking here permanently
      // locks candidates out. Verification status is tracked in the DB
      // for the recruiter's report.
      // ===================================================================
      if (existingInterview.identityVerificationRequired && 
          !existingInterview.identityVerificationCompleted && 
          existingInterview.candidateApplicationPhoto) {
        console.warn(`⚠️ Interview ${interviewId}: Identity verification required but not completed. Allowing start — recruiter will see verification status in report.`);
        existingInterview.identityVerificationSkipped = true;
        await existingInterview.save();
      }

      // If interview is already in-progress, return existing questions (resume)
      if (existingInterview.status === 'in-progress') {
        return res.status(200).json({
          message: 'Resuming interview',
          interviewId: existingInterview._id,
          questions: existingInterview.questions.map(q => ({ question: q.question, category: q.category })),
          stream: existingInterview.stream,
          difficulty: existingInterview.difficulty,
          timeLimit: existingInterview.timeLimit || 30,
          questionCount: existingInterview.questions.length,
          currentQuestionIndex: existingInterview.currentQuestionIndex || 0,
          violationThresholds: existingInterview.violationThresholds || {}
        });
      }

      // Generate questions for the accepted interview using REAL AI
      // Mix custom questions with AI-generated questions
      const customQuestions = existingInterview.customQuestions || [];
      const customQuestionCount = customQuestions.length;
      const aiQuestionCount = Math.max(0, (existingInterview.questionCount || 5) - customQuestionCount);
      
      console.log(`📊 Question Mix: ${customQuestionCount} custom + ${aiQuestionCount} AI = ${customQuestionCount + aiQuestionCount} total`);
      
      let generatedQuestions = [];
      
      // Add custom questions first
      if (customQuestionCount > 0) {
        generatedQuestions = customQuestions.map(cq => ({
          question: cq.question,
          category: 'Custom',
          generatedAt: new Date(),
          source: cq.addedBy || 'recruiter'
        }));
        console.log(`✅ Added ${customQuestionCount} custom questions`);
      }
      
      // Generate AI questions if needed
      if (aiQuestionCount > 0) {
        const aiQuestions = await AIService.generateQuestions(
          existingInterview.stream, 
          existingInterview.difficulty, 
          aiQuestionCount
        );
        generatedQuestions.push(...aiQuestions.map(q => ({
          ...q,
          source: 'ai'
        })));
        console.log(`✅ Generated ${aiQuestionCount} AI questions`);
      }
      
      // Shuffle questions to mix custom and AI
      const shuffledQuestions = generatedQuestions
        .map(q => ({ q, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ q }) => q);
      
      console.log(`🔀 Shuffled ${shuffledQuestions.length} questions`);
      
      // Update question sources tracking
      existingInterview.questionSources = {
        aiGenerated: aiQuestionCount,
        recruiterAdded: customQuestions.filter(q => q.addedBy === 'recruiter').length,
        pdfExtracted: customQuestions.filter(q => q.addedBy === 'pdf').length
      };

      // Get candidate name for dashboard display
      const Candidate = (await import('../models/Candidate.js')).default;
      const candidate = await Candidate.findById(existingInterview.candidateId);
      
      existingInterview.questions = shuffledQuestions;
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
        startedAt: existingInterview.startedAt,
        totalQuestions: shuffledQuestions.length,
        timeLimit: existingInterview.timeLimit
      });

      // Save questions to database
      const questionPromises = shuffledQuestions.map(q => {
        const question = new Question({
          stream: existingInterview.stream,
          difficulty: existingInterview.difficulty,
          question: q.question,
          category: q.category,
          isAiGenerated: q.source === 'ai'
        });
        return question.save().catch(err => console.log('Question save error:', err));
      });

      await Promise.all(questionPromises);

      return res.status(200).json({
        message: 'Interview started successfully',
        interviewId: existingInterview._id,
        questions: shuffledQuestions.map(q => ({ 
          question: q.question, 
          category: q.category,
          source: q.source 
        })),
        stream: existingInterview.stream,
        difficulty: existingInterview.difficulty,
        timeLimit: existingInterview.timeLimit,
        questionCount: shuffledQuestions.length,
        violationThresholds: existingInterview.violationThresholds || {}
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

    // Check if interview time has expired
    if (interview.startTime && interview.timeLimit) {
      const startTime = new Date(interview.startTime);
      const now = new Date();
      const elapsedMinutes = Math.floor((now - startTime) / 1000 / 60);
      
      if (elapsedMinutes >= interview.timeLimit) {
        return res.status(400).json({ 
          message: 'Time limit exceeded. Interview will be auto-submitted.',
          timeExpired: true
        });
      }
    }

    // Detect if answer is AI-generated using REAL AI
    const aiDetection = await AIService.detectAIGeneratedAnswer(answer);

    // Evaluate answer quality using LOCAL NLP (real-time per-answer scoring)
    let answerEvaluation = null;
    try {
      const questionText = interview.questions[questionIndex]?.question || '';
      answerEvaluation = answerEvaluationService.evaluateAnswer(questionText, answer, {
        stream: interview.stream,
        difficulty: interview.difficulty
      });
      console.log(`📊 Real-time NLP evaluation for Q${questionIndex + 1}: ${answerEvaluation.score}/100 (confidence: ${(answerEvaluation.confidence * 100).toFixed(0)}%)`);
    } catch (evalError) {
      console.error('Answer evaluation error:', evalError.message);
    }

    // Update question with answer
    if (interview.questions[questionIndex]) {
      interview.questions[questionIndex].answer = answer;
      interview.questions[questionIndex].isAiGenerated = aiDetection.isAiGenerated;
      interview.questions[questionIndex].aiConfidence = aiDetection.confidence;

      // Store per-question timing data
      const now = new Date();
      interview.questions[questionIndex].answerEndTime = now;
      if (req.body.questionStartedAt) {
        const startedAt = new Date(req.body.questionStartedAt);
        interview.questions[questionIndex].answerStartTime = startedAt;
        const durationSec = Math.round((now - startedAt) / 1000);
        interview.questions[questionIndex].answerDuration = durationSec;
        // Classify response speed
        if (durationSec < 15) interview.questions[questionIndex].responseSpeed = 'Very Fast';
        else if (durationSec < 45) interview.questions[questionIndex].responseSpeed = 'Fast';
        else if (durationSec < 120) interview.questions[questionIndex].responseSpeed = 'Normal';
        else if (durationSec < 240) interview.questions[questionIndex].responseSpeed = 'Slow';
        else interview.questions[questionIndex].responseSpeed = 'Very Slow';
      }
      // Store word count
      interview.questions[questionIndex].wordCount = answer.trim().split(/\s+/).length;

      // Store NLP topic-based evaluation results
      if (answerEvaluation) {
        interview.questions[questionIndex].answerQuality = {
          relevance: answerEvaluation.breakdown?.relevanceScore || 0,
          completeness: answerEvaluation.breakdown?.keywordScore || 0,
          clarity: answerEvaluation.breakdown?.structuralScore || 0,
          technicalDepth: answerEvaluation.breakdown?.conceptGroupScore || 0,
          overallScore: answerEvaluation.score
        };
      }
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
      },
      answerEvaluation: answerEvaluation ? {
        score: answerEvaluation.score,
        confidence: answerEvaluation.confidence,
        evaluationMethod: answerEvaluation.useGptFallback ? 'pending-gpt' : 'local-nlp',
        feedback: answerEvaluation.feedback,
        breakdown: answerEvaluation.breakdown
      } : null
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

    // Check if tab switch threshold is exceeded
    const threshold = interview.violationThresholds?.tabSwitch || 0;
    const shouldTerminate = threshold > 0 && interview.tabSwitchCount >= threshold;

    if (shouldTerminate) {
      interview.terminatedByViolation = true;
      interview.terminationReason = `Tab switch limit exceeded (${interview.tabSwitchCount}/${threshold})`;
      interview.status = 'completed';
      interview.endTime = new Date();
      interview.completedAt = new Date();
      interview.flagged = true;
      if (interview.startTime) {
        interview.duration = Math.round((interview.endTime - new Date(interview.startTime)) / 60000);
      }
      await interview.save();
      console.log(`🚫 Interview ${interviewId} TERMINATED — tab switch threshold exceeded (${interview.tabSwitchCount}/${threshold})`);
    }

    res.json({
      message: shouldTerminate ? 'Interview terminated due to excessive tab switches' : 'Tab switch recorded',
      totalSwitches: interview.tabSwitchCount,
      warning: interview.tabSwitchCount > 3 ? 'Multiple tab switches detected - interview may be flagged' : null,
      terminated: shouldTerminate,
      terminationReason: shouldTerminate ? interview.terminationReason : null
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

// Complete interview with enhanced AI evaluation
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

    // Ensure all required fields have defaults
    if (!interview.questions) interview.questions = [];
    if (!interview.malpractices) interview.malpractices = [];
    if (typeof interview.tabSwitchCount !== 'number') interview.tabSwitchCount = 0;
    if (typeof interview.voiceChangesDetected !== 'number') interview.voiceChangesDetected = 0;
    if (typeof interview.aiAnswersDetected !== 'number') interview.aiAnswersDetected = 0;
    if (typeof interview.noFaceDetected !== 'number') interview.noFaceDetected = 0;
    if (typeof interview.multipleFacesDetected !== 'number') interview.multipleFacesDetected = 0;
    if (typeof interview.lookingAwayDetected !== 'number') interview.lookingAwayDetected = 0;

    // Merge frontend violation counts (may be higher than backend-tracked counts)
    const { violationCounts, terminatedByViolation, terminationReason } = req.body;
    if (violationCounts) {
      interview.noFaceDetected = Math.max(interview.noFaceDetected, violationCounts.noFaceCount || 0);
      interview.multipleFacesDetected = Math.max(interview.multipleFacesDetected, violationCounts.multipleFaceCount || 0);
      interview.lookingAwayDetected = Math.max(interview.lookingAwayDetected, violationCounts.lookingAwayCount || 0);
    }

    // Mark if terminated by violation threshold
    if (terminatedByViolation) {
      interview.terminatedByViolation = true;
      interview.terminationReason = terminationReason || 'Violation threshold exceeded';
      interview.flagged = true;
      console.log(`🚫 Interview ${interviewId} terminated by violation: ${interview.terminationReason}`);
    }

    interview.endTime = new Date();
    interview.completedAt = new Date();
    
    // Calculate duration safely
    if (interview.startTime) {
      interview.duration = Math.round((interview.endTime - interview.startTime) / 60000); // in minutes
    } else if (interview.startedAt) {
      interview.duration = Math.round((interview.endTime - interview.startedAt) / 60000); // in minutes
    } else {
      interview.duration = 0; // Default if no start time recorded
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPLETING INTERVIEW WITH ENHANCED AI EVALUATION');
    console.log('='.repeat(80));
    console.log(`Interview ID: ${interviewId}`);
    console.log(`Candidate: ${interview.candidateId}`);
    console.log(`Stream: ${interview.stream}`);
    console.log(`Difficulty: ${interview.difficulty}`);
    console.log(`Duration: ${interview.duration} minutes`);
    console.log('='.repeat(80) + '\n');

    // Calculate basic score first (fallback)
    const answeredQuestions = interview.questions.filter(q => q.answer && q.answer.trim()).length;
    const totalQuestions = interview.questions.length;
    const baseScore = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    const malpracticeDeduction = Math.min(interview.malpractices.length * 5, 40); // Max 40 point deduction
    const basicScore = Math.max(0, Math.round(baseScore - malpracticeDeduction));

    // Try enhanced AI evaluation, but always have fallback
    let evaluationSuccess = false;
    try {
      console.log('🤖 Attempting enhanced AI evaluation...');
      const evaluationResult = await AIService.evaluateInterviewComprehensive({
        questions: interview.questions || [],
        malpractices: interview.malpractices || [],
        duration: interview.duration || 0,
        jobDescription: interview.jobDescription || '',
        stream: interview.stream || 'General',
        difficulty: interview.difficulty || 'Medium'
      });

      if (evaluationResult && typeof evaluationResult.score === 'number') {
        // Update interview with comprehensive evaluation results
        interview.score = evaluationResult.score;
        interview.enhancedEvaluation = evaluationResult.enhancedEvaluation || {};
        
        // Recommendation must be one of: 'Strong Hire', 'Hire', 'Maybe', 'No Hire'
        const validRecommendations = ['Strong Hire', 'Hire', 'Maybe', 'No Hire'];
        const resultRec = evaluationResult.recommendation || '';
        if (validRecommendations.includes(resultRec)) {
          interview.recommendation = resultRec;
        } else {
          // Map common variations to valid values
          const recLower = resultRec.toLowerCase();
          if (recLower.includes('highly') || recLower.includes('strong')) {
            interview.recommendation = 'Strong Hire';
          } else if (recLower.includes('hire') || recLower.includes('consider')) {
            interview.recommendation = 'Hire';
          } else if (recLower.includes('maybe') || recLower.includes('review')) {
            interview.recommendation = 'Maybe';
          } else {
            interview.recommendation = 'No Hire';
          }
        }
        
        interview.pros = Array.isArray(evaluationResult.pros) ? evaluationResult.pros : [];
        interview.cons = Array.isArray(evaluationResult.cons) ? evaluationResult.cons : [];
        interview.overallAssessment = evaluationResult.overallAssessment || 'Interview evaluated';
        
        // aiConfidenceLevel should be a number (0-100), not a string
        if (typeof evaluationResult.aiConfidenceLevel === 'number') {
          interview.aiConfidenceLevel = Math.min(100, Math.max(0, evaluationResult.aiConfidenceLevel));
        } else {
          interview.aiConfidenceLevel = 70; // Default confidence level
        }

        // Determine status based on malpractices and evaluation
        const highSeverityCount = interview.malpractices.filter(m => m.severity === 'high').length;
        interview.flagged = highSeverityCount > 2 || interview.recommendation === 'No Hire';
        interview.status = interview.flagged ? 'flagged' : 'completed';
        
        evaluationSuccess = true;
        console.log('✅ Enhanced AI evaluation successful');
      } else {
        throw new Error('Invalid evaluation result');
      }
    } catch (aiError) {
      console.error('❌ AI Evaluation failed:', aiError.message);
      console.log('⚠️ Using basic evaluation fallback...');
      evaluationSuccess = false;
    }

    // Use basic evaluation if AI failed
    if (!evaluationSuccess) {
      interview.score = basicScore;
      interview.status = 'completed';
      interview.flagged = interview.malpractices.filter(m => m.severity === 'high').length > 2;
      
      // Use valid enum values for recommendation: 'Strong Hire', 'Hire', 'Maybe', 'No Hire'
      if (interview.score >= 80) {
        interview.recommendation = 'Strong Hire';
      } else if (interview.score >= 70) {
        interview.recommendation = 'Hire';
      } else if (interview.score >= 50) {
        interview.recommendation = 'Maybe';
      } else {
        interview.recommendation = 'No Hire';
      }
      
      interview.overallAssessment = `Interview completed with ${answeredQuestions}/${totalQuestions} questions answered. Score: ${interview.score}/100`;
      interview.pros = answeredQuestions > 0 ? ['Completed the interview'] : [];
      interview.cons = interview.malpractices.length > 0 ? ['Malpractices detected'] : [];
      // Don't set enhancedEvaluation to avoid schema issues
    }

    // Ensure all required fields are set before saving
    if (!interview.status) interview.status = 'completed';
    if (typeof interview.score !== 'number') interview.score = basicScore;
    if (!interview.recommendation || !['Strong Hire', 'Hire', 'Maybe', 'No Hire'].includes(interview.recommendation)) {
      interview.recommendation = 'Maybe'; // Safe default
    }
    if (!interview.overallAssessment) interview.overallAssessment = 'Interview completed';
    if (!Array.isArray(interview.pros)) interview.pros = [];
    if (!Array.isArray(interview.cons)) interview.cons = [];

    // Save interview with error handling
    try {
      await interview.save();
      console.log('✅ Interview data saved successfully');
    } catch (saveError) {
      console.error('❌ Primary save failed:', saveError.message);
      console.log('⚠️ Attempting minimal save...');
      
      try {
        // Remove potentially problematic fields
        if (interview.enhancedEvaluation && typeof interview.enhancedEvaluation === 'object' && Object.keys(interview.enhancedEvaluation).length === 0) {
          delete interview.enhancedEvaluation;
        }
        
        // Ensure basic fields are set with valid values
        interview.score = interview.score || basicScore;
        interview.status = 'completed';
        // Ensure recommendation is a valid enum value
        if (!interview.recommendation || !['Strong Hire', 'Hire', 'Maybe', 'No Hire'].includes(interview.recommendation)) {
          interview.recommendation = 'Maybe';
        }
        interview.overallAssessment = interview.overallAssessment || 'Interview completed';
        
        await interview.save();
        console.log('✅ Minimal save successful');
      } catch (retryError) {
        console.error('❌ Retry save also failed:', retryError.message);
        // Don't throw - we'll return what we have
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ INTERVIEW COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log(`Final Score: ${interview.score}/100`);
    console.log(`Recommendation: ${interview.recommendation || 'N/A'}`);
    console.log(`Status: ${interview.status}`);
    console.log(`Flagged: ${interview.flagged}`);
    console.log(`Method: ${evaluationSuccess ? 'AI Enhanced' : 'Basic'}`);
    console.log('='.repeat(80) + '\n');

    // Ensure final score is set
    if (typeof interview.score !== 'number' || isNaN(interview.score)) {
      console.warn('⚠️ Score not set properly, using basic score');
      interview.score = basicScore;
    }

    // Build response object safely
    const response = {
      message: 'Interview completed successfully',
      score: interview.score || 0,
      status: interview.status || 'completed',
      duration: interview.duration || 0,
      recommendation: interview.recommendation || 'Maybe', // Use valid enum value
      malpracticesSummary: {
        total: (interview.malpractices || []).length,
        tabSwitches: interview.tabSwitchCount || 0,
        voiceChanges: interview.voiceChangesDetected || 0,
        aiAnswers: interview.aiAnswersDetected || 0,
        noFaceDetected: interview.noFaceDetected || 0,
        multipleFacesDetected: interview.multipleFacesDetected || 0,
        lookingAwayDetected: interview.lookingAwayDetected || 0
      },
      flagged: interview.status === 'flagged' || interview.flagged === true
    };
    if (interview.enhancedEvaluation && typeof interview.enhancedEvaluation === 'object') {
      try {
        // Extract tone analysis safely
        let toneAnalysisText = 'N/A';
        if (interview.enhancedEvaluation.toneAnalysis) {
          if (typeof interview.enhancedEvaluation.toneAnalysis === 'string') {
            toneAnalysisText = interview.enhancedEvaluation.toneAnalysis;
          } else if (interview.enhancedEvaluation.toneAnalysis.overallTone) {
            toneAnalysisText = interview.enhancedEvaluation.toneAnalysis.overallTone;
          }
        }
        
        response.enhancedEvaluation = {
          overallQualityScore: interview.enhancedEvaluation.overallQualityScore || interview.score || 0,
          toneAnalysis: toneAnalysisText,
          paceAnalysis: interview.enhancedEvaluation.paceAnalysis || 'N/A',
          comparedToAverage: interview.enhancedEvaluation.comparedToAverage || 'N/A'
        };
      } catch (evalError) {
        console.error('Error accessing enhancedEvaluation properties:', evalError.message);
        response.enhancedEvaluation = {
          overallQualityScore: interview.score || 0,
          toneAnalysis: 'Basic evaluation used',
          paceAnalysis: 'Basic evaluation used',
          comparedToAverage: 'Not available'
        };
      }
    } else {
      response.enhancedEvaluation = {
        overallQualityScore: interview.score || 0,
        toneAnalysis: 'Basic evaluation used',
        paceAnalysis: 'Basic evaluation used',
        comparedToAverage: 'Not available'
      };
    }

    res.json(response);

  } catch (err) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ COMPLETE INTERVIEW ERROR');
    console.error('='.repeat(80));
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Interview ID:', req.body.interviewId);
    console.error('Candidate ID:', req.candidate ? req.candidate.id : 'N/A');
    console.error('='.repeat(80) + '\n');
    
    // Return a structured error response
    res.status(500).json({ 
      message: 'Failed to complete interview', 
      error: err.message,
      errorType: err.name,
      details: process.env.NODE_ENV === 'development' ? err.stack : 'Contact support for assistance'
    });
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

    // Auto-complete interview if time limit exceeded
    if (interview.status === 'in-progress' && interview.startTime && interview.timeLimit) {
      const startTime = new Date(interview.startTime);
      const now = new Date();
      const elapsedMinutes = Math.floor((now - startTime) / 1000 / 60);
      
      if (elapsedMinutes >= interview.timeLimit) {
        console.log(`⏰ Interview ${interview._id} time limit exceeded (${elapsedMinutes}/${interview.timeLimit} min) - auto-completing...`);
        
        // Auto-complete the interview
        interview.status = 'completed';
        interview.endTime = now;
        interview.duration = Math.round((interview.endTime - interview.startTime) / 60000); // in minutes
        interview.autoSubmitted = true; // Flag to indicate auto-submission
        
        // Calculate score (penalize for time expiration)
        const answeredQuestions = interview.questions.filter(q => q.answer).length;
        const totalQuestions = interview.questions.length;
        const baseScore = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 70 : 0;
        interview.score = Math.round(baseScore); // Max 70% for auto-submit due to time
        
        await interview.save();
        
        console.log(`✅ Interview auto-completed with score: ${interview.score}/100`);
      }
    }

    // Strip ATS score and sensitive data from candidate view
    const interviewData = interview.toObject();
    
    // If the viewer is the candidate (not the recruiter), hide ATS data
    const isCandidate = interview.candidateId._id.toString() === req.candidate.id;
    if (isCandidate) {
      delete interviewData.atsScore;
      delete interviewData.applicationScores;
      delete interviewData.candidateApplicationPhoto;
      delete interviewData.resumeText;
    }

    res.json(interviewData);

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

    const viewerRole = isRecruiter ? 'recruiter' : 'candidate';

    // === CALCULATION HELPERS ===
    const totalQuestions = interview.questions.length;
    const answeredQuestions = interview.questions.filter(q => q.answer && q.answer.trim()).length;
    const aiGeneratedAnswers = interview.questions.filter(q => q.isAiGenerated).length;

    // Malpractice by type
    const malpracticeByType = {};
    interview.malpractices.forEach(m => {
      if (!malpracticeByType[m.type]) {
        malpracticeByType[m.type] = { count: 0, severity: { low: 0, medium: 0, high: 0 } };
      }
      malpracticeByType[m.type].count++;
      if (m.severity) malpracticeByType[m.type].severity[m.severity]++;
    });

    // === VIOLATION DEDUCTION TABLE ===
    const noFace = interview.noFaceDetected || 0;
    const multiFace = interview.multipleFacesDetected || 0;
    const lookingAway = interview.lookingAwayDetected || 0;
    const tabSwitches = interview.tabSwitchCount || 0;
    const voiceChanges = interview.voiceChangesDetected || 0;
    const aiAnswers = interview.aiAnswersDetected || 0;

    // Per-violation deduction rates
    const violationDeductions = [
      { type: 'No Face Detected', count: noFace, ratePerIncident: 2, maxDeduction: 15, severity: noFace > 5 ? 'High' : noFace > 2 ? 'Medium' : 'Low' },
      { type: 'Multiple Faces Detected', count: multiFace, ratePerIncident: 3, maxDeduction: 20, severity: multiFace > 3 ? 'High' : multiFace > 1 ? 'Medium' : 'Low' },
      { type: 'Looking Away', count: lookingAway, ratePerIncident: 1.5, maxDeduction: 12, severity: lookingAway > 8 ? 'High' : lookingAway > 3 ? 'Medium' : 'Low' },
      { type: 'Tab Switches', count: tabSwitches, ratePerIncident: 3, maxDeduction: 15, severity: tabSwitches > 3 ? 'High' : tabSwitches > 1 ? 'Medium' : 'Low' },
      { type: 'Voice Anomalies', count: voiceChanges, ratePerIncident: 4, maxDeduction: 15, severity: voiceChanges > 2 ? 'High' : voiceChanges > 0 ? 'Medium' : 'Low' },
      { type: 'AI-Generated Answers', count: aiAnswers, ratePerIncident: 8, maxDeduction: 25, severity: aiAnswers > 1 ? 'High' : aiAnswers > 0 ? 'Medium' : 'Low' }
    ];

    let totalViolationDeduction = 0;
    violationDeductions.forEach(v => {
      v.deduction = Math.min(+(v.count * v.ratePerIncident).toFixed(1), v.maxDeduction);
      totalViolationDeduction += v.deduction;
    });
    totalViolationDeduction = Math.min(totalViolationDeduction, 40); // cap

    // === PER-QUESTION DETAILED EVALUATION TABLE ===
    const questionEvaluations = interview.questions.map((q, index) => {
      const hasAnswer = !!(q.answer && q.answer.trim());
      const quality = q.answerQuality || {};

      return {
        questionNumber: index + 1,
        question: q.question,
        answer: q.answer || '',
        answered: hasAnswer,
        wordCount: q.wordCount || (hasAnswer ? q.answer.trim().split(/\s+/).length : 0),
        responseSpeed: q.responseSpeed || 'N/A',
        answerDuration: q.answerDuration || null,

        // Per-question quality scores (0-100)
        relevanceScore: quality.relevance || 0,
        completenessScore: quality.completeness || 0,
        clarityScore: quality.clarity || 0,
        technicalDepthScore: quality.technicalDepth || 0,
        overallScore: quality.overallScore || 0,

        // AI detection for this question
        isAiGenerated: q.isAiGenerated || false,
        aiConfidence: q.aiConfidence || 0,

        // Category
        category: q.category || 'General'
      };
    });

    // Average quality score across answered questions
    const answeredWithScores = questionEvaluations.filter(q => q.answered && q.overallScore > 0);
    const avgQuestionScore = answeredWithScores.length > 0
      ? +(answeredWithScores.reduce((s, q) => s + q.overallScore, 0) / answeredWithScores.length).toFixed(1)
      : 0;

    // === SCORE BREAKDOWN TABLE ===
    const completionRate = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    const answerQualityContribution = +(avgQuestionScore * 0.50).toFixed(1);
    const completionContribution = +(completionRate * 0.10).toFixed(1);

    // Tone contribution
    const tone = interview.enhancedEvaluation?.toneAnalysis || {};
    const avgTone = typeof tone.professionalism === 'number'
      ? +((tone.professionalism + (tone.confidence || 0) + (tone.clarity || 0) + (tone.articulation || 0)) / 4).toFixed(1)
      : 0;
    const toneContribution = +(avgTone * 0.15).toFixed(1);

    // Timing contribution
    const paceAnalysis = interview.enhancedEvaluation?.paceAnalysis || 'N/A';
    let timingBase = 70;
    if (paceAnalysis === 'Well-paced') timingBase = 90;
    else if (paceAnalysis === 'Rushed') timingBase = 55;
    const timingContribution = +(timingBase * 0.05).toFixed(1);

    // Integrity contribution
    const rawIntegrity = Math.max(0, 100 - totalViolationDeduction * 2.5);
    const integrityContribution = +(rawIntegrity * 0.20).toFixed(1);
    const integrityScore = Math.round(rawIntegrity);

    const computedScoreBeforeViolation = +(answerQualityContribution + completionContribution + toneContribution + timingContribution + integrityContribution).toFixed(1);

    const scoreBreakdownTable = [
      { factor: 'Answer Quality', weight: '50%', rawScore: avgQuestionScore, contribution: answerQualityContribution, description: 'Average NLP-evaluated score across answered questions' },
      { factor: 'Completion Rate', weight: '10%', rawScore: completionRate, contribution: completionContribution, description: `${answeredQuestions}/${totalQuestions} questions answered` },
      { factor: 'Communication & Tone', weight: '15%', rawScore: +avgTone.toFixed(0), contribution: toneContribution, description: tone.overallTone || 'N/A' },
      { factor: 'Timing & Pace', weight: '5%', rawScore: timingBase, contribution: timingContribution, description: paceAnalysis },
      { factor: 'Integrity (Violations)', weight: '20%', rawScore: integrityScore, contribution: integrityContribution, description: totalViolationDeduction > 0 ? `${totalViolationDeduction} pts deducted for violations` : 'Clean – No violations' }
    ];

    // === STRENGTHS / WEAKNESSES from AI evaluation data ===
    const strengths = Array.isArray(interview.pros) && interview.pros.length > 0
      ? interview.pros
      : [];
    const weaknesses = Array.isArray(interview.cons) && interview.cons.length > 0
      ? interview.cons
      : [];

    // Auto-generate extras
    if (completionRate === 100 && !strengths.includes('Completed all questions')) strengths.push('Completed all questions');
    if (integrityScore >= 90 && !strengths.includes('High integrity maintained')) strengths.push('High integrity maintained throughout the assessment');
    if (avgQuestionScore >= 75) strengths.push(`Strong average answer quality (${avgQuestionScore}/100)`);

    if (tabSwitches > 3) weaknesses.push(`Excessive tab switching (${tabSwitches} times)`);
    if (noFace > 5) weaknesses.push(`Frequent absence from camera (${noFace} incidents)`);
    if (lookingAway > 5) weaknesses.push(`Frequent looking away (${lookingAway} incidents)`);
    if (aiAnswers > 0) weaknesses.push(`AI-generated answers detected (${aiAnswers})`);
    if (completionRate < 100) weaknesses.push(`Didn't answer all questions (${answeredQuestions}/${totalQuestions})`);

    const improvementSuggestions = interview.enhancedEvaluation?.improvementSuggestions || [];
    const detailedFeedback = interview.enhancedEvaluation?.detailedFeedback || [];

    // === FINAL REPORT ===
    const report = {
      viewerRole,
      interviewId: interview._id,
      candidateName: interview.candidateId.name,
      candidateEmail: interview.candidateId.email,
      recruiterName: interview.recruiterId.name,
      recruiterCompany: interview.recruiterId.company || 'N/A',
      stream: interview.stream,
      difficulty: interview.difficulty,
      jobDescription: interview.jobDescription || '',
      isMock: interview.applicationStatus === 'mock',

      // Status & scores
      status: interview.status,
      finalScore: interview.score || 0,
      integrityScore,
      completionRate,
      recommendation: interview.recommendation || 'N/A',
      overallAssessment: interview.overallAssessment || '',
      aiConfidenceLevel: interview.aiConfidenceLevel || 0,
      flagged: interview.flagged || false,

      // Time metrics
      startTime: interview.startedAt || interview.startTime,
      endTime: interview.completedAt || interview.endTime,
      duration: interview.duration,

      // === TABLES ===

      // 1. Per-question evaluation table
      questionEvaluations,
      totalQuestions,
      answeredQuestions,
      avgQuestionScore,

      // 2. Score breakdown table (how final score was computed)
      scoreBreakdownTable,
      computedScore: computedScoreBeforeViolation,

      // 3. Violation deduction table
      violationDeductions,
      totalViolationDeduction: Math.min(totalViolationDeduction, 40),

      // Raw violation counts
      tabSwitches,
      voiceChanges,
      aiDetections: aiAnswers,
      noFaceDetected: noFace,
      multipleFacesDetected: multiFace,
      lookingAwayDetected: lookingAway,
      totalMalpractices: interview.malpractices.length,
      faceViolations: noFace + multiFace + lookingAway,
      malpracticeByType,

      // Enhanced evaluation metrics
      enhancedEvaluation: interview.enhancedEvaluation || null,
      scoreBreakdown: interview.scoreBreakdown || null,
      sentimentAnalysis: interview.sentimentAnalysis || null,

      // Strengths / Weaknesses / Feedback
      strengths,
      weaknesses,
      improvementSuggestions,
      detailedFeedback,
      recommendations: improvementSuggestions.length > 0 ? improvementSuggestions : [],

      // Termination info
      terminatedByViolation: interview.terminatedByViolation || false,
      terminationReason: interview.terminationReason || '',

      // Identity verification
      identityVerificationRequired: interview.identityVerificationRequired || false,
      identityVerificationCompleted: interview.identityVerificationCompleted || false,
      identityVerificationSkipped: interview.identityVerificationSkipped || false,
      identityVerificationData: interview.identityVerificationData || null
    };

    res.json(report);
  } catch (err) {
    console.error('Generate report error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
