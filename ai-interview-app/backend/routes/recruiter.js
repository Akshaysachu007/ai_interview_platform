import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import Recruiter from '../models/Recruiter.js';
import Interview from '../models/Interview.js';
import NotificationService from '../services/notificationService.js';

// Configure multer for PDF upload (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

const router = express.Router();

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.recruiterId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Register
router.post('/register', async (req, res) => {
  console.log('📝 Register request received:', { name: req.body.name, email: req.body.email });
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const exists = await Recruiter.findOne({ email });
    if (exists) {
      console.log('❌ Email already exists:', email);
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const recruiter = new Recruiter({ name, email, password: hashed });
    await recruiter.save();
    
    console.log('✅ Recruiter registered successfully:', email);
    res.status(201).json({ message: 'Recruiter registered successfully' });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  console.log('🔐 Login request received:', { email: req.body.email });
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) {
      console.log('❌ Recruiter not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, recruiter.password);
    if (!valid) {
      console.log('❌ Invalid password for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: recruiter._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
    console.log('✅ Login successful:', email);
    res.json({ token });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.recruiterId).select('-password');
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });
    res.json(recruiter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.email;
    
    const recruiter = await Recruiter.findByIdAndUpdate(
      req.recruiterId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });
    res.json(recruiter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Subscribe
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { plan, name, email, phone, company, cardNumber } = req.body;
    
    if (!plan || !['weekly', 'monthly'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }
    
    // Calculate expiry date
    const expiryDate = new Date();
    if (plan === 'weekly') {
      expiryDate.setDate(expiryDate.getDate() + 7);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }
    
    // TODO: Process payment with payment gateway
    // For now, just update the subscription
    
    const recruiter = await Recruiter.findByIdAndUpdate(
      req.recruiterId,
      {
        $set: {
          subscriptionPlan: plan,
          subscriptionExpiry: expiryDate,
          verified: false // Set to false, awaiting admin verification
        }
      },
      { new: true }
    ).select('-password');
    
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });
    
    res.json({
      message: 'Subscription successful! Awaiting admin verification.',
      expiryDate: expiryDate,
      recruiter
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create open interview (for candidates to apply)
router.post('/create-interview', auth, async (req, res) => {
  try {
    const { 
      stream, 
      difficulty, 
      description, 
      jobDescription, 
      title, 
      company, 
      requiredSkills, 
      preferredSkills,
      questionCount,
      timeLimit,
      customQuestions // Array of {question: string, addedBy: string}
    } = req.body;
    
    if (!stream || !difficulty) {
      return res.status(400).json({ message: 'Stream and difficulty are required' });
    }

    // Validate questionCount
    const finalQuestionCount = questionCount ? Math.min(Math.max(questionCount, 1), 20) : 5;
    
    // Validate timeLimit
    const finalTimeLimit = timeLimit ? Math.min(Math.max(timeLimit, 5), 180) : 30;

    // Process custom questions
    const processedCustomQuestions = customQuestions && Array.isArray(customQuestions)
      ? customQuestions.map(q => ({
          question: typeof q === 'string' ? q : q.question,
          addedBy: (typeof q === 'object' && q.addedBy) ? q.addedBy : 'recruiter',
          addedAt: new Date()
        }))
      : [];

    const interview = new Interview({
      recruiterId: req.recruiterId,
      stream,
      difficulty,
      applicationStatus: 'open',
      status: 'scheduled',
      description: description || `${difficulty} level ${stream} interview`,
      jobDescription: jobDescription || '',
      title: title || `${stream} Position`,
      company: company || '',
      requiredSkills: requiredSkills || [],
      preferredSkills: preferredSkills || [],
      questionCount: finalQuestionCount,
      timeLimit: finalTimeLimit,
      customQuestions: processedCustomQuestions,
      questionSources: {
        recruiterAdded: processedCustomQuestions.filter(q => q.addedBy === 'recruiter').length,
        pdfExtracted: processedCustomQuestions.filter(q => q.addedBy === 'pdf').length,
        aiGenerated: 0 // Will be set when interview starts
      }
    });

    await interview.save();
    await interview.populate('recruiterId', 'name email company');

    console.log(`✅ Interview created with ${finalQuestionCount} questions, ${finalTimeLimit} min time limit, ${processedCustomQuestions.length} custom questions`);

    // 🔔 SEND NOTIFICATIONS TO CANDIDATES WITH MATCHING STREAM
    const recruiter = await Recruiter.findById(req.recruiterId);
    const notificationResult = await NotificationService.notifyNewInterview(interview, recruiter);
    
    console.log(`📢 Notification sent to ${notificationResult.notificationsSent} candidates`);

    res.status(201).json({
      message: 'Interview created successfully',
      interview,
      notificationsSent: notificationResult.notificationsSent,
      config: {
        questionCount: finalQuestionCount,
        timeLimit: finalTimeLimit,
        customQuestions: processedCustomQuestions.length
      }
    });
  } catch (err) {
    console.error('Create interview error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Upload PDF and extract questions
router.post('/extract-questions-from-pdf', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    console.log('📄 Processing PDF file:', req.file.originalname);
    
    // Parse PDF
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text;
    
    console.log(`📄 Extracted ${text.length} characters from PDF`);
    
    // Extract questions using pattern matching
    // Common patterns: "Q1:", "Question 1:", "1.", "1)", etc
    const questionPatterns = [
      /(?:Q(?:uestion)?|q(?:uestion)?)\s*[\d]+[\.:)]\s*([^\n]+(?:\n(?!Q|q|\d+[\.:)])[^\n]+)*)/gi,
      /(?:^|\n)\s*(\d+)[\.:)]\s*([^\n]+(?:\n(?!\d+[\.:)])[^\n]+)*)/gm,
      /(?:^|\n)\s*[-•]\s*([^\n]+(?:\n(?![-•])[^\n]+)*)/gm
    ];
    
    let extractedQuestions = [];
    
    // Try each pattern
    for (const pattern of questionPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        extractedQuestions = matches.map(match => {
          // Get the question text (last capture group)
          const questionText = match[match.length - 1] || match[0];
          return questionText.trim()
            .replace(/\s+/g, ' ')  // Normalize whitespace
            .replace(/^[-•\d+\.:)]+\s*/, ''); // Remove leading markers
        }).filter(q => q.length > 10 && q.length < 500); // Filter by length
        
        if (extractedQuestions.length > 0) {
          console.log(`✅ Found ${extractedQuestions.length} questions using pattern`);
          break; // Use first successful pattern
        }
      }
    }
    
    // If no questions found with patterns, try splitting by newlines and filtering
    if (extractedQuestions.length === 0) {
      console.log('⚠️ No pattern match. Trying line-by-line extraction...');
      extractedQuestions = text
        .split(/\n+/)
        .map(line => line.trim())
        .filter(line => {
          // Filter lines that look like questions
          return line.length > 20 && 
                 line.length < 500 && 
                 (line.includes('?') || 
                  /^(?:what|how|why|when|where|explain|describe|define|list)/i.test(line));
        })
        .slice(0, 20); // Max 20 questions
    }
    
    if (extractedQuestions.length === 0) {
      return res.status(400).json({ 
        message: 'No questions found in PDF. Please ensure the PDF contains clearly formatted questions.',
        extractedText: text.substring(0, 500) // Send first 500 chars for debugging
      });
    }
    
    // Format questions for response
    const formattedQuestions = extractedQuestions.slice(0, 20).map(q => ({
      question: q,
      addedBy: 'pdf'
    }));
    
    console.log(`✅ Successfully extracted ${formattedQuestions.length} questions`);
    
    res.json({
      message: `Successfully extracted ${formattedQuestions.length} questions from PDF`,
      questions: formattedQuestions,
      totalExtracted: formattedQuestions.length
    });
    
  } catch (err) {
    console.error('PDF extraction error:', err);
    res.status(500).json({ 
      message: 'Error extracting questions from PDF',
      error: err.message 
    });
  }
});

// Get my interviews (recruiter)
router.get('/my-interviews', auth, async (req, res) => {
  try {
    const interviews = await Interview.find({ recruiterId: req.recruiterId })
      .populate('candidateId', 'name email')
      .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (err) {
    console.error('Get interviews error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all interviews for recruiter (alias for dashboard)
router.get('/interviews', auth, async (req, res) => {
  try {
    const interviews = await Interview.find({ recruiterId: req.recruiterId })
      .populate('candidateId', 'name email')
      .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (err) {
    console.error('Get interviews error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get pending applications for recruiter
router.get('/pending-applications', auth, async (req, res) => {
  try {
    const applications = await Interview.find({ 
      recruiterId: req.recruiterId,
      applicationStatus: 'pending' 
    })
      .populate('candidateId', 'name email')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error('Get pending applications error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Accept/Reject candidate application
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
    if (interview.recruiterId.toString() !== req.recruiterId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (interview.applicationStatus !== 'pending') {
      return res.status(400).json({ message: 'This application is not pending' });
    }

    // Store candidate ID before potential clearing
    const candidateId = interview.candidateId;

    interview.applicationStatus = decision;
    
    // If rejected, clear the candidate and make it available again
    if (decision === 'rejected') {
      interview.candidateId = null;
      interview.applicationStatus = 'open';
    }

    await interview.save();
    await interview.populate('candidateId', 'name email');

    // 🔔 SEND NOTIFICATION TO CANDIDATE ABOUT DECISION
    const recruiter = await Recruiter.findById(req.recruiterId);
    await NotificationService.notifyApplicationStatus(candidateId, interview, decision, recruiter);

    res.json({ 
      message: `Application ${decision} successfully`,
      interview 
    });
  } catch (err) {
    console.error('Application decision error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete interview (recruiter)
router.delete('/interview/:interviewId', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Verify it's the recruiter's interview
    if (interview.recruiterId.toString() !== req.recruiterId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Don't allow deletion of in-progress or completed interviews
    if (interview.status === 'in-progress') {
      return res.status(400).json({ message: 'Cannot delete an in-progress interview' });
    }

    await Interview.findByIdAndDelete(interviewId);

    res.json({ message: 'Interview deleted successfully' });
  } catch (err) {
    console.error('Delete interview error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get live interviews (in-progress interviews for recruiter)
router.get('/live-interviews', auth, async (req, res) => {
  try {
    console.log('🔴 Fetching live interviews for recruiter:', req.recruiterId);
    
    // Debug: Check all interviews in database
    const allInterviews = await Interview.find({});
    console.log('📊 Total interviews in DB:', allInterviews.length);
    console.log('📊 Interview statuses:', allInterviews.map(i => ({
      id: i._id,
      status: i.status,
      recruiterId: i.recruiterId,
      candidateId: i.candidateId,
      startedAt: i.startedAt
    })));
    
    const liveInterviews = await Interview.find({
      recruiterId: req.recruiterId,
      status: 'in-progress'
    })
    .populate('candidateId', 'name email')
    .sort({ startedAt: -1 });

    console.log(`✅ Found ${liveInterviews.length} live interview(s) for this recruiter`);
    
    res.json(liveInterviews);
  } catch (err) {
    console.error('❌ Get live interviews error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get detailed live interview data (with real-time malpractices)
router.get('/live-interview/:interviewId', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId)
      .populate('candidateId', 'name email');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Verify it's the recruiter's interview
    if (interview.recruiterId.toString() !== req.recruiterId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Return detailed interview data including live malpractices, webcam, and Q&A
    res.json({
      interviewId: interview._id,
      candidate: interview.candidateId,
      stream: interview.stream,
      difficulty: interview.difficulty,
      status: interview.status,
      flagged: interview.flagged,
      currentQuestionIndex: interview.currentQuestionIndex || 0,
      questions: interview.questions,
      answers: interview.answers,
      malpractices: interview.malpractices,
      startedAt: interview.startedAt,
      tabSwitches: interview.malpractices.filter(m => m.type === 'tab-switch').length,
      faceViolations: interview.malpractices.filter(m => m.type === 'no-face' || m.type === 'multiple-faces').length,
      aiDetections: interview.malpractices.filter(m => m.type === 'ai-answer').length,
      currentWebcamSnapshot: interview.currentWebcamSnapshot,
      currentFaceCount: interview.currentFaceCount || 0,
      lastSnapshotUpdate: interview.lastSnapshotUpdate,
      tabSwitchCount: interview.tabSwitchCount || 0
    });
  } catch (err) {
    console.error('Get live interview error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all AI evaluations for completed interviews
router.get('/ai-evaluations', auth, async (req, res) => {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📊 FETCHING AI EVALUATIONS FOR RECRUITER');
    console.log('='.repeat(80));
    console.log(`Recruiter ID: ${req.recruiterId}\n`);

    // Find all completed interviews for this recruiter with AI evaluations
    const interviews = await Interview.find({
      recruiterId: req.recruiterId,
      status: { $in: ['completed', 'flagged'] },
      score: { $exists: true, $ne: null }
    })
      .populate('candidateId', 'name email phone skills yearsOfExperience')
      .sort({ completedAt: -1 })
      .lean();

    console.log(`Found ${interviews.length} completed interviews with AI evaluations\n`);

    // Format the AI evaluations
    const aiEvaluations = interviews.map(interview => ({
      // Interview Basic Info
      interviewId: interview._id,
      candidateId: interview.candidateId?._id,
      candidateName: interview.candidateId?.name || interview.candidateName || 'Unknown',
      candidateEmail: interview.candidateId?.email || 'N/A',
      candidatePhone: interview.candidateId?.phone || 'N/A',
      
      // Job Details
      jobTitle: interview.title || interview.stream,
      company: interview.company,
      stream: interview.stream,
      difficulty: interview.difficulty,
      
      // Interview Metadata
      completedAt: interview.completedAt,
      duration: interview.duration,
      status: interview.status,
      flagged: interview.flagged,
      
      // Core AI Evaluation
      score: interview.score,
      recommendation: interview.recommendation || 'Not Evaluated',
      pros: interview.pros || [],
      cons: interview.cons || [],
      overallAssessment: interview.overallAssessment || 'No assessment available',
      aiConfidenceLevel: interview.aiConfidenceLevel || 0,
      
      // Enhanced Evaluation (if available)
      enhancedEvaluation: interview.enhancedEvaluation ? {
        // Timing Analysis
        averageAnswerTime: interview.enhancedEvaluation.averageAnswerTime,
        responseConsistency: interview.enhancedEvaluation.responseConsistency,
        paceAnalysis: interview.enhancedEvaluation.paceAnalysis,
        
        // Tone & Communication
        toneAnalysis: interview.enhancedEvaluation.toneAnalysis,
        
        // Quality Metrics
        answerDepthScore: interview.enhancedEvaluation.answerDepthScore,
        technicalAccuracyScore: interview.enhancedEvaluation.technicalAccuracyScore,
        relevanceScore: interview.enhancedEvaluation.relevanceScore,
        completenessScore: interview.enhancedEvaluation.completenessScore,
        overallQualityScore: interview.enhancedEvaluation.overallQualityScore,
        
        // Comparative Analysis
        comparedToAverage: interview.enhancedEvaluation.comparedToAverage,
        percentileRank: interview.enhancedEvaluation.percentileRank,
        
        // Feedback
        detailedFeedback: interview.enhancedEvaluation.detailedFeedback || [],
        improvementSuggestions: interview.enhancedEvaluation.improvementSuggestions || []
      } : null,
      
      // Sentiment Analysis (if available)
      sentimentAnalysis: interview.sentimentAnalysis ? {
        confidence: interview.sentimentAnalysis.confidence,
        communicationClarity: interview.sentimentAnalysis.communicationClarity,
        softSkills: interview.sentimentAnalysis.softSkills,
        sentimentTrend: interview.sentimentAnalysis.sentimentTrend
      } : null,
      
      // Score Breakdown
      scoreBreakdown: interview.scoreBreakdown,
      
      // Integrity Metrics
      malpractices: {
        total: interview.malpractices?.length || 0,
        tabSwitches: interview.tabSwitchCount || 0,
        aiAnswers: interview.aiAnswersDetected || 0,
        voiceChanges: interview.voiceChangesDetected || 0,
        faceViolations: (interview.noFaceDetected || 0) + (interview.multipleFacesDetected || 0)
      },
      
      // Questions Summary
      questionsSummary: {
        total: interview.questions?.length || 0,
        answered: interview.questions?.filter(q => q.answer).length || 0,
        averageWordCount: interview.questions?.filter(q => q.answer && q.wordCount)
          .reduce((sum, q) => sum + q.wordCount, 0) / Math.max(1, interview.questions?.filter(q => q.answer).length || 1) || 0
      },
      
      // ATS Score (if available)
      atsScore: interview.atsScore
    }));

    // Calculate summary statistics
    const summary = {
      totalEvaluations: aiEvaluations.length,
      averageScore: aiEvaluations.length > 0 
        ? Math.round(aiEvaluations.reduce((sum, e) => sum + (e.score || 0), 0) / aiEvaluations.length) 
        : 0,
      recommendations: {
        strongHire: aiEvaluations.filter(e => e.recommendation === 'Strong Hire').length,
        hire: aiEvaluations.filter(e => e.recommendation === 'Hire').length,
        maybe: aiEvaluations.filter(e => e.recommendation === 'Maybe').length,
        noHire: aiEvaluations.filter(e => e.recommendation === 'No Hire').length
      },
      flaggedCount: aiEvaluations.filter(e => e.flagged).length,
      averageDuration: aiEvaluations.length > 0
        ? Math.round(aiEvaluations.reduce((sum, e) => sum + (e.duration || 0), 0) / aiEvaluations.length)
        : 0
    };

    console.log('Summary Statistics:');
    console.log(`  Total Evaluations: ${summary.totalEvaluations}`);
    console.log(`  Average Score: ${summary.averageScore}`);
    console.log(`  Strong Hire: ${summary.recommendations.strongHire}`);
    console.log(`  Hire: ${summary.recommendations.hire}`);
    console.log(`  Maybe: ${summary.recommendations.maybe}`);
    console.log(`  No Hire: ${summary.recommendations.noHire}`);
    console.log(`  Flagged: ${summary.flaggedCount}`);
    console.log('='.repeat(80) + '\n');

    res.json({
      success: true,
      summary,
      evaluations: aiEvaluations
    });

  } catch (err) {
    console.error('❌ Get AI evaluations error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch AI evaluations', 
      error: err.message 
    });
  }
});

export default router;
