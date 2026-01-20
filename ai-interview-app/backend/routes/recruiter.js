import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Recruiter from '../models/Recruiter.js';
import Interview from '../models/Interview.js';
import NotificationService from '../services/notificationService.js';

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
    const { stream, difficulty, description } = req.body;
    
    if (!stream || !difficulty) {
      return res.status(400).json({ message: 'Stream and difficulty are required' });
    }

    const interview = new Interview({
      recruiterId: req.recruiterId,
      stream,
      difficulty,
      applicationStatus: 'open',
      status: 'scheduled',
      description: description || `${difficulty} level ${stream} interview`
    });

    await interview.save();
    await interview.populate('recruiterId', 'name email company');

    // 🔔 SEND NOTIFICATIONS TO CANDIDATES WITH MATCHING STREAM
    const recruiter = await Recruiter.findById(req.recruiterId);
    const notificationResult = await NotificationService.notifyNewInterview(interview, recruiter);
    
    console.log(`📢 Notification sent to ${notificationResult.notificationsSent} candidates`);

    res.status(201).json({
      message: 'Interview created successfully',
      interview,
      notificationsSent: notificationResult.notificationsSent
    });
  } catch (err) {
    console.error('Create interview error:', err);
    res.status(500).json({ message: err.message });
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

export default router;
