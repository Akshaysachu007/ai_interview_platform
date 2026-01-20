import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Candidate from '../models/Candidate.js';
import Interview from '../models/Interview.js';
import auth from '../middleware/auth.js';

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
    const update = { ...req.body };
    if (update.password) delete update.password;
    
    // Validate stream if provided
    const validStreams = ['Computer Science', 'Information Technology', 'Mechanical Engineering', 
                         'Electrical Engineering', 'Civil Engineering', 'Business Management', 
                         'Marketing', 'Finance', 'Data Science', 'AI/ML'];
    
    if (update.stream && update.stream !== '' && !validStreams.includes(update.stream)) {
      console.log('❌ Invalid stream value:', update.stream);
      return res.status(400).json({ message: 'Invalid stream selected' });
    }
    
    const candidate = await Candidate.findByIdAndUpdate(
      req.candidate.id, 
      update, 
      { new: true, runValidators: true }
    ).select('-password');
    
    console.log('✅ Profile updated successfully');
    res.json(candidate);
  } catch (err) {
    console.error('❌ Profile update error:', err);
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

export default router;
