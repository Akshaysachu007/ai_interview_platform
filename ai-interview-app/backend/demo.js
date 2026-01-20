// Demo script to test AI Interview features
// Run this after starting the backend server

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test credentials
const testCandidate = {
  email: 'test@example.com',
  password: 'test123',
  name: 'Test Candidate'
};

let authToken = '';
let interviewId = '';

// Helper function for API calls
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      data
    };
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Error in ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Demo functions
async function demo() {
  console.log('🚀 AI Interview System Demo\n');
  console.log('=' .repeat(80));

  try {
    // Step 1: Register/Login
    console.log('\n📝 Step 1: Registering/Logging in candidate...');
    try {
      await apiCall('POST', '/candidate/register', testCandidate);
      console.log('✓ Candidate registered successfully');
    } catch (error) {
      console.log('ℹ️  Candidate already exists, logging in...');
    }

    const loginResponse = await apiCall('POST', '/candidate/login', {
      email: testCandidate.email,
      password: testCandidate.password
    });
    authToken = loginResponse.token;
    console.log('✅ Logged in successfully\n');

    // Step 2: Start Interview with AI Question Generation
    console.log('=' .repeat(80));
    console.log('\n🎯 Step 2: Starting interview with AI question generation...');
    const interviewData = await apiCall('POST', '/interview/start', {
      stream: 'Computer Science',
      difficulty: 'Medium'
    });
    interviewId = interviewData.interviewId;
    
    console.log('✅ Interview started!');
    console.log(`📋 Interview ID: ${interviewId}`);
    console.log(`📚 Stream: ${interviewData.stream}`);
    console.log(`⭐ Difficulty: ${interviewData.difficulty}`);
    console.log('\n📝 Generated Questions:');
    interviewData.questions.forEach((q, i) => {
      console.log(`\n${i + 1}. [${q.category}] ${q.question}`);
    });

    // Step 3: Submit Normal Answer
    console.log('\n' + '='.repeat(80));
    console.log('\n✏️  Step 3: Submitting normal answer...');
    const normalAnswer = "Object-Oriented Programming is a programming paradigm based on objects which contain data and code. The main principles are encapsulation, inheritance, polymorphism, and abstraction.";
    
    const normalResult = await apiCall('POST', '/interview/submit-answer', {
      interviewId,
      questionIndex: 0,
      answer: normalAnswer
    });
    
    console.log('✅ Answer submitted');
    console.log('🤖 AI Detection Result:');
    console.log(`   - AI Generated: ${normalResult.aiDetection.isAiGenerated ? 'YES ⚠️' : 'NO ✓'}`);
    console.log(`   - Confidence: ${normalResult.aiDetection.confidence}%`);
    if (normalResult.aiDetection.warning) {
      console.log(`   - Warning: ${normalResult.aiDetection.warning}`);
    }

    // Step 4: Submit AI-Generated Answer (to demonstrate detection)
    console.log('\n' + '='.repeat(80));
    console.log('\n🤖 Step 4: Submitting AI-generated answer (for demo)...');
    const aiAnswer = "Certainly! Object-Oriented Programming is a fundamental programming paradigm. Furthermore, it encompasses various sophisticated principles including encapsulation, inheritance, and polymorphism. Moreover, it provides numerous advantages for software development. Consequently, modern applications leverage OOP extensively. In conclusion, OOP is essential for contemporary software engineering practices.";
    
    const aiResult = await apiCall('POST', '/interview/submit-answer', {
      interviewId,
      questionIndex: 1,
      answer: aiAnswer
    });
    
    console.log('✅ Answer submitted');
    console.log('🤖 AI Detection Result:');
    console.log(`   - AI Generated: ${aiResult.aiDetection.isAiGenerated ? 'YES ⚠️' : 'NO ✓'}`);
    console.log(`   - Confidence: ${aiResult.aiDetection.confidence}%`);
    if (aiResult.aiDetection.warning) {
      console.log(`   - ⚠️  Warning: ${aiResult.aiDetection.warning}`);
    }

    // Step 5: Simulate Tab Switching
    console.log('\n' + '='.repeat(80));
    console.log('\n🔄 Step 5: Simulating tab switching (malpractice)...');
    
    for (let i = 1; i <= 3; i++) {
      const tabResult = await apiCall('POST', '/interview/report-tab-switch', {
        interviewId
      });
      console.log(`   Switch ${i}: Total switches = ${tabResult.totalSwitches}`);
      if (tabResult.warning) {
        console.log(`   ⚠️  ${tabResult.warning}`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 6: Voice Analysis
    console.log('\n' + '='.repeat(80));
    console.log('\n🎤 Step 6: Running voice analysis...');
    const voiceResult = await apiCall('POST', '/interview/report-voice-analysis', {
      interviewId,
      audioFeatures: {
        pitch: 150,
        frequency: 400,
        duration: 45
      }
    });
    
    console.log('✅ Voice analysis completed');
    console.log(`   - Multiple voices: ${voiceResult.analysis.multipleVoicesDetected ? 'YES ⚠️' : 'NO ✓'}`);
    console.log(`   - Speakers detected: ${voiceResult.analysis.numberOfSpeakers}`);
    console.log(`   - Confidence: ${voiceResult.analysis.confidence}%`);
    if (voiceResult.warning) {
      console.log(`   - ⚠️  Warning: ${voiceResult.warning}`);
    }

    // Step 7: Face Detection
    console.log('\n' + '='.repeat(80));
    console.log('\n📸 Step 7: Running face detection...');
    const faceResult = await apiCall('POST', '/interview/report-face-detection', {
      interviewId,
      facesDetected: 1
    });
    
    console.log('✅ Face detection completed');
    console.log(`   - Faces detected: ${faceResult.analysis.facesCount}`);
    console.log(`   - Issue detected: ${faceResult.analysis.hasIssue ? 'YES ⚠️' : 'NO ✓'}`);
    if (faceResult.warning) {
      console.log(`   - ⚠️  Warning: ${faceResult.warning}`);
    }

    // Step 8: Complete Interview
    console.log('\n' + '='.repeat(80));
    console.log('\n🏁 Step 8: Completing interview and calculating score...');
    const completionResult = await apiCall('POST', '/interview/complete', {
      interviewId
    });
    
    console.log('✅ Interview completed!');
    console.log(`\n📊 Final Results:`);
    console.log(`   - Score: ${completionResult.score}/100`);
    console.log(`   - Status: ${completionResult.status.toUpperCase()}`);
    console.log(`   - Duration: ${completionResult.duration} minutes`);
    console.log(`   - Flagged: ${completionResult.flagged ? 'YES ⚠️' : 'NO ✓'}`);
    console.log(`\n🚨 Malpractices Summary:`);
    console.log(`   - Total violations: ${completionResult.malpracticesSummary.total}`);
    console.log(`   - Tab switches: ${completionResult.malpracticesSummary.tabSwitches}`);
    console.log(`   - Voice changes: ${completionResult.malpracticesSummary.voiceChanges}`);
    console.log(`   - AI-generated answers: ${completionResult.malpracticesSummary.aiAnswers}`);

    // Step 9: Get Interview Details
    console.log('\n' + '='.repeat(80));
    console.log('\n📄 Step 9: Fetching detailed interview report...');
    const interviewDetails = await apiCall('GET', `/interview/${interviewId}`);
    
    console.log('✅ Interview details retrieved');
    console.log(`\n📋 Detailed Malpractices Log:`);
    interviewDetails.malpractices.forEach((m, i) => {
      console.log(`\n   ${i + 1}. Type: ${m.type.toUpperCase()}`);
      console.log(`      Severity: ${m.severity.toUpperCase()}`);
      console.log(`      Time: ${new Date(m.detectedAt).toLocaleTimeString()}`);
      console.log(`      Details: ${m.details}`);
    });

    // Step 10: Get Statistics
    console.log('\n' + '='.repeat(80));
    console.log('\n📈 Step 10: Fetching interview statistics...');
    const stats = await apiCall('GET', '/interview/stats/summary');
    
    console.log('✅ Statistics retrieved');
    console.log(`\n📊 Overall Statistics:`);
    console.log(`   - Total interviews: ${stats.totalInterviews}`);
    console.log(`   - Completed: ${stats.completedInterviews}`);
    console.log(`   - Flagged: ${stats.flaggedInterviews}`);
    console.log(`   - Average score: ${stats.averageScore}/100`);
    console.log(`   - Total malpractices: ${stats.totalMalpractices}`);
    console.log(`\n   Breakdown:`);
    console.log(`   - Tab switches: ${stats.malpracticeBreakdown.tabSwitches}`);
    console.log(`   - Voice changes: ${stats.malpracticeBreakdown.voiceChanges}`);
    console.log(`   - AI answers: ${stats.malpracticeBreakdown.aiAnswers}`);

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Demo completed successfully!');
    console.log('\n🎓 College Project Features Demonstrated:');
    console.log('   ✓ AI-based question generation by stream');
    console.log('   ✓ AI-generated answer detection');
    console.log('   ✓ Tab switching detection');
    console.log('   ✓ Voice analysis (multiple speakers)');
    console.log('   ✓ Face detection monitoring');
    console.log('   ✓ Automated scoring with penalties');
    console.log('   ✓ Interview flagging system');
    console.log('   ✓ Comprehensive reporting\n');

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
  }
}

// Run demo
console.log('⏳ Starting demo in 2 seconds...');
console.log('⚠️  Make sure your backend server is running on http://localhost:5000\n');

setTimeout(() => {
  demo().then(() => {
    console.log('\n👋 Thank you for watching the demo!');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}, 2000);
