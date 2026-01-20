// Test script for notification system
// Run this with: node backend/testNotifications.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Candidate from './models/Candidate.js';
import Recruiter from './models/Recruiter.js';
import Interview from './models/Interview.js';
import Notification from './models/Notification.js';
import NotificationService from './services/notificationService.js';

dotenv.config();

async function testNotificationSystem() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 TESTING NOTIFICATION SYSTEM');
    console.log('='.repeat(70) + '\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Check candidates with streams
    console.log('📋 Test 1: Checking candidates with streams...');
    const candidatesWithStreams = await Candidate.find({ 
      stream: { $exists: true, $ne: null } 
    }).select('name email stream notificationsEnabled');
    
    console.log(`Found ${candidatesWithStreams.length} candidates with streams:`);
    candidatesWithStreams.forEach(c => {
      console.log(`   - ${c.name} (${c.email}): ${c.stream} | Notifications: ${c.notificationsEnabled}`);
    });
    console.log('');

    // Test 2: Check existing notifications
    console.log('📋 Test 2: Checking existing notifications...');
    const notifications = await Notification.find()
      .populate('recipientId', 'name email')
      .populate('interviewId', 'stream difficulty')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`Found ${notifications.length} recent notifications:`);
    notifications.forEach(n => {
      console.log(`   - ${n.recipientId?.name}: ${n.title} (${n.isRead ? 'Read' : 'Unread'})`);
    });
    console.log('');

    // Test 3: Check unread counts
    console.log('📋 Test 3: Checking unread notification counts...');
    const candidates = await Candidate.find({ stream: { $exists: true } });
    for (const candidate of candidates) {
      const unreadCount = await NotificationService.getUnreadCount(candidate._id);
      console.log(`   ${candidate.name}: ${unreadCount} unread notifications`);
    }
    console.log('');

    // Test 4: Simulate creating an interview
    console.log('📋 Test 4: Simulating interview creation...');
    const testInterview = {
      _id: new mongoose.Types.ObjectId(),
      stream: 'Computer Science',
      difficulty: 'Medium',
      recruiterId: new mongoose.Types.ObjectId(),
      applicationStatus: 'open'
    };

    const testRecruiter = {
      _id: testInterview.recruiterId,
      name: 'Test Recruiter',
      company: 'Test Company'
    };

    // Count candidates that would be notified
    const matchingCandidates = await Candidate.countDocuments({
      stream: testInterview.stream,
      notificationsEnabled: true
    });

    console.log(`   If a ${testInterview.difficulty} ${testInterview.stream} interview is created:`);
    console.log(`   ${matchingCandidates} candidates would be notified\n`);

    // Test 5: Statistics
    console.log('📊 Statistics:');
    const totalCandidates = await Candidate.countDocuments();
    const candidatesWithStreamSet = await Candidate.countDocuments({ stream: { $exists: true, $ne: null } });
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ isRead: false });

    console.log(`   Total Candidates: ${totalCandidates}`);
    console.log(`   Candidates with Stream: ${candidatesWithStreamSet} (${((candidatesWithStreamSet/totalCandidates)*100).toFixed(1)}%)`);
    console.log(`   Total Notifications: ${totalNotifications}`);
    console.log(`   Unread Notifications: ${unreadNotifications}`);
    console.log('');

    // Test 6: Stream distribution
    console.log('📊 Stream Distribution:');
    const streamCounts = await Candidate.aggregate([
      { $match: { stream: { $exists: true, $ne: null } } },
      { $group: { _id: '$stream', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    streamCounts.forEach(s => {
      console.log(`   ${s._id}: ${s.count} candidates`);
    });
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ ALL TESTS COMPLETE!');
    console.log('='.repeat(70) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Test Error:', error);
    process.exit(1);
  }
}

testNotificationSystem();
