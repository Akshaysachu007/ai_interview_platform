import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Recruiter from '../models/Recruiter.js';
import Candidate from '../models/Candidate.js';
import SubscriptionPricing from '../models/SubscriptionPricing.js';
import SystemLog from '../models/SystemLog.js';

const router = express.Router();

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.adminId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Helper function to create system log
const createLog = async (action, adminId, targetUser, targetUserType, details, metadata = {}) => {
  try {
    const log = new SystemLog({
      action,
      performedBy: adminId,
      targetUser,
      targetUserType,
      details,
      metadata
    });
    await log.save();
  } catch (err) {
    console.error('Error creating log:', err);
  }
};

// Register - DISABLED (Default admin account is auto-created)
router.post('/register', async (req, res) => {
  return res.status(403).json({ 
    message: 'Admin registration is disabled. Please contact the system administrator.' 
  });
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Admin login attempt:', req.body.email);
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    console.log('Admin found:', admin ? 'Yes' : 'No');
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, admin.password);
    console.log('Password valid:', valid);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
    
    await createLog('Admin Login', admin._id, admin._id, 'admin', `Admin ${admin.name} logged in`);
    
    console.log('Login successful for:', admin.email);
    res.json({ 
      token,
      name: admin.name,
      email: admin.email
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all recruiters
router.get('/recruiters', auth, async (req, res) => {
  try {
    const recruiters = await Recruiter.find().select('-password').sort({ createdAt: -1 });
    res.json(recruiters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all candidates
router.get('/candidates', auth, async (req, res) => {
  try {
    const candidates = await Candidate.find().select('-password').sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify recruiter
router.put('/recruiters/:id/verify', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;
    
    const recruiter = await Recruiter.findByIdAndUpdate(
      id,
      { $set: { verified } },
      { new: true }
    ).select('-password');
    
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });
    
    await createLog(
      verified ? 'Recruiter Verified' : 'Recruiter Unverified',
      req.adminId,
      id,
      'recruiter',
      `Recruiter ${recruiter.name} (${recruiter.email}) was ${verified ? 'verified' : 'unverified'}`,
      { recruiterEmail: recruiter.email, verified }
    );
    
    res.json({ message: 'Recruiter updated successfully', recruiter });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete recruiter
router.delete('/recruiters/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const recruiter = await Recruiter.findByIdAndDelete(id);
    
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });
    
    await createLog(
      'Recruiter Deleted',
      req.adminId,
      id,
      'recruiter',
      `Recruiter ${recruiter.name} (${recruiter.email}) was deleted`,
      { recruiterEmail: recruiter.email }
    );
    
    res.json({ message: 'Recruiter deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete candidate
router.delete('/candidates/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findByIdAndDelete(id);
    
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    
    await createLog(
      'Candidate Deleted',
      req.adminId,
      id,
      'candidate',
      `Candidate ${candidate.name} (${candidate.email}) was deleted`,
      { candidateEmail: candidate.email }
    );
    
    res.json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get subscription pricing
router.get('/pricing', auth, async (req, res) => {
  try {
    let pricing = await SubscriptionPricing.find();
    
    // Initialize default pricing if not exists
    if (pricing.length === 0) {
      const defaultPricing = [
        { planType: 'weekly', price: 49, features: ['Post up to 5 job listings', 'Access to candidate database', 'Basic analytics', 'Email support'] },
        { planType: 'monthly', price: 149, features: ['Post unlimited job listings', 'Full access to candidate database', 'Advanced analytics & reports', 'Priority support', 'Featured postings'] }
      ];
      pricing = await SubscriptionPricing.insertMany(defaultPricing);
    }
    
    res.json(pricing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update subscription pricing
router.put('/pricing/:planType', auth, async (req, res) => {
  try {
    const { planType } = req.params;
    const { price, features } = req.body;
    
    const pricing = await SubscriptionPricing.findOneAndUpdate(
      { planType },
      { $set: { price, features, updatedBy: req.adminId } },
      { new: true, upsert: true }
    );
    
    await createLog(
      'Pricing Updated',
      req.adminId,
      null,
      'admin',
      `${planType} plan pricing updated to $${price}`,
      { planType, price, features }
    );
    
    res.json({ message: 'Pricing updated successfully', pricing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get system logs
router.get('/logs', auth, async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;
    const logs = await SystemLog.find()
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await SystemLog.countDocuments();
    
    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const totalCandidates = await Candidate.countDocuments();
    const totalRecruiters = await Recruiter.countDocuments();
    const verifiedRecruiters = await Recruiter.countDocuments({ verified: true });
    const pendingRecruiters = await Recruiter.countDocuments({ verified: false, subscriptionPlan: { $ne: 'none' } });
    const subscribedRecruiters = await Recruiter.countDocuments({ subscriptionPlan: { $ne: 'none' } });
    
    const weeklySubscribers = await Recruiter.countDocuments({ subscriptionPlan: 'weekly' });
    const monthlySubscribers = await Recruiter.countDocuments({ subscriptionPlan: 'monthly' });
    
    const recentLogs = await SystemLog.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      totalCandidates,
      totalRecruiters,
      verifiedRecruiters,
      pendingRecruiters,
      subscribedRecruiters,
      weeklySubscribers,
      monthlySubscribers,
      recentLogs
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
