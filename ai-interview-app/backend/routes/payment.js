import express from 'express';
import jwt from 'jsonwebtoken';
import Recruiter from '../models/Recruiter.js';
import SubscriptionPricing from '../models/SubscriptionPricing.js';

const router = express.Router();
console.log('💳 Mock Payment System Enabled (Development Mode)');

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

// Get subscription pricing
router.get('/pricing', async (req, res) => {
  try {
    let pricing = await SubscriptionPricing.find();
    
    // Create default pricing if none exists
    if (pricing.length === 0) {
      const defaultPricing = [
        {
          planType: 'weekly',
          price: 99,
          features: [
            'Post unlimited job listings',
            'Access to candidate database',
            'AI-powered screening',
            'Video interview platform',
            'Email support'
          ]
        },
        {
          planType: 'monthly',
          price: 299,
          features: [
            'Everything in Weekly plan',
            'Advanced analytics',
            'Priority support',
            'Custom branding',
            'API access',
            'Dedicated account manager'
          ]
        }
      ];
      
      pricing = await SubscriptionPricing.insertMany(defaultPricing);
    }
    
    res.json(pricing);
  } catch (err) {
    console.error('Error fetching pricing:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create mock payment order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { planType } = req.body;
    
    if (!['weekly', 'monthly'].includes(planType)) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }
    
    const pricing = await SubscriptionPricing.findOne({ planType });
    if (!pricing) {
      return res.status(404).json({ message: 'Pricing plan not found' });
    }
    
    const recruiter = await Recruiter.findById(req.recruiterId);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }
    
    // Generate mock order ID
    const orderId = `mock_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`💳 Mock order created: ${orderId} for ${recruiter.email}`);
    
    res.json({ 
      orderId: orderId,
      amount: pricing.price * 100,
      currency: 'INR',
      planType: planType,
      isMockPayment: true
    });
  } catch (err) {
    console.error('Error creating mock order:', err);
    res.status(500).json({ message: err.message });
  }
});

// Verify mock payment and activate subscription
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { orderId, planType } = req.body;
    
    // Simulate payment verification (always succeeds in mock mode)
    if (!orderId || !orderId.startsWith('mock_order_')) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }
    
    // Calculate expiry date
    const expiryDate = new Date();
    if (planType === 'weekly') {
      expiryDate.setDate(expiryDate.getDate() + 7);
    } else if (planType === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }
    
    // Update recruiter subscription
    const recruiter = await Recruiter.findByIdAndUpdate(
      req.recruiterId,
      {
        subscriptionPlan: planType,
        subscriptionExpiry: expiryDate
      },
      { new: true }
    ).select('-password');
    
    console.log(`✅ Mock Subscription activated for ${recruiter.email}: ${planType} plan until ${expiryDate}`);
    
    res.json({
      success: true,
      message: 'Subscription activated successfully (Mock Payment)',
      recruiter,
      isMockPayment: true
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ message: err.message });
  }
});

// Mock webhook (not used in development)
router.post('/webhook', express.json(), async (req, res) => {
  console.log('💳 Mock webhook received (development mode)');
  res.json({ status: 'ok', message: 'Mock webhook - no action taken' });
});

export default router;
