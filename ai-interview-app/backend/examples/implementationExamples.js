// Quick Implementation Examples
// Copy these examples into your route files to use the premium features

import IntegrationService from '../services/integrationService.js';
import ResumeParserService from '../services/resumeParserService.js';
import VectorMatchingService from '../services/vectorMatchingService.js';
import MasterPromptService from '../services/masterPromptService.js';
import LeaderboardService from '../services/leaderboardService.js';

/**
 * EXAMPLE 1: Candidate Resume Upload & Application
 * Route: POST /api/candidate/apply
 */
export async function handleCandidateApplication(req, res) {
  try {
    const { candidateId, resumeText, interviewId } = req.body;

    // Process complete application workflow
    const result = await IntegrationService.processCandidateApplication({
      candidateId,
      resumeText,
      interviewId
    });

    // Send notification if strong match
    if (result.shouldNotify) {
      // TODO: Send email/notification to candidate
      console.log(`✅ Strong match! Notify candidate: ${result.vectorMatch.similarityPercentage}%`);
    }

    res.json({
      success: true,
      message: result.shouldNotify 
        ? 'Your profile matches well! You will receive a notification.' 
        : 'Application submitted successfully.',
      matchScore: result.vectorMatch.similarityPercentage,
      resumeScore: result.resumeScore.overallScore,
      recommendation: result.resumeScore.recommendation
    });

  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * EXAMPLE 2: Recruiter Creates Interview with Dynamic Questions
 * Route: POST /api/recruiter/create-interview
 */
export async function createInterviewWithQuestions(req, res) {
  try {
    const {
      jobDescription,
      requiredSkills,
      preferredSkills,
      questionCount, // ⭐ Recruiter controls this
      stream,
      difficulty,
      title,
      company,
      requirements
    } = req.body;

    const recruiterId = req.user.id; // From auth middleware

    const result = await IntegrationService.createInterviewWithDynamicQuestions({
      recruiterId,
      jobDescription,
      requiredSkills,
      preferredSkills,
      questionCount: questionCount || 5, // Default to 5
      stream,
      difficulty: difficulty || 'Medium',
      title,
      company,
      requirements
    });

    res.json({
      success: true,
      message: `Interview created with ${result.questions.length} JD-aware questions`,
      interview: result.interview,
      questions: result.questions,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Interview creation error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * EXAMPLE 3: Score Completed Interview
 * Route: POST /api/interview/:id/score
 */
export async function scoreCompletedInterview(req, res) {
  try {
    const { id: interviewId } = req.params;
    const { transcript } = req.body;

    // Complete scoring workflow
    const result = await IntegrationService.scoreCompletedInterview({
      interviewId,
      transcript
    });

    res.json({
      success: true,
      message: 'Interview scored successfully',
      score: result.finalScore,
      recommendation: result.recommendation,
      scoring: result.scoring,
      sentiment: result.sentiment
    });

  } catch (error) {
    console.error('Scoring error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * EXAMPLE 4: Get Leaderboard for Interview
 * Route: GET /api/recruiter/interview/:id/leaderboard
 */
export async function getLeaderboard(req, res) {
  try {
    const { id: interviewId } = req.params;
    const { topN } = req.query; // Optional: ?topN=10

    const leaderboard = await LeaderboardService.generateLeaderboard(
      interviewId,
      parseInt(topN) || 5 // Default top 5
    );

    res.json({
      success: true,
      interview: leaderboard.interview,
      leaderboard: leaderboard.leaderboard,
      totalCandidates: leaderboard.totalCandidates
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * EXAMPLE 5: Batch Match Candidates for Job Notification
 * Route: POST /api/recruiter/interview/:id/match-candidates
 */
export async function batchMatchCandidates(req, res) {
  try {
    const { id: interviewId } = req.params;
    const { candidateIds } = req.body; // Optional: specific candidates

    const result = await IntegrationService.batchMatchCandidatesForJob(
      interviewId,
      candidateIds
    );

    // Send notifications to strong matches
    const notifications = result.notificationList;
    console.log(`📧 Sending notifications to ${notifications.length} candidates`);

    // TODO: Implement actual notification sending
    // for (const notification of notifications) {
    //   await sendEmail(notification.candidateEmail, notification.message);
    // }

    res.json({
      success: true,
      totalCandidates: result.totalCandidates,
      strongMatches: result.strongMatches.length,
      notificationsSent: notifications.length,
      matches: result.matches
    });

  } catch (error) {
    console.error('Batch matching error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * EXAMPLE 6: Resume Parsing Only (Standalone)
 * Route: POST /api/candidate/parse-resume
 */
export async function parseResume(req, res) {
  try {
    const { resumeText } = req.body;

    const result = await ResumeParserService.parseResumeWithLLM(resumeText);

    res.json({
      success: result.success,
      profile: result.data,
      completeness: result.data.profileCompleteness,
      parsedAt: result.parsedAt
    });

  } catch (error) {
    console.error('Resume parsing error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * EXAMPLE 7: Get Anti-Cheating Report
 * Route: GET /api/recruiter/interview/:id/anti-cheat-report
 */
export async function getAntiCheatingReport(req, res) {
  try {
    const { id: interviewId } = req.params;

    const result = await LeaderboardService.getAntiCheatingReport(interviewId);

    res.json({
      success: true,
      report: result.report
    });

  } catch (error) {
    console.error('Anti-cheat report error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * EXAMPLE 8: Get Recruiter Dashboard with Analytics
 * Route: GET /api/recruiter/dashboard
 */
export async function getRecruiterDashboard(req, res) {
  try {
    const recruiterId = req.user.id;
    const { interviewId } = req.query; // Optional specific interview

    const result = await IntegrationService.generateRecruiterDashboard(
      recruiterId,
      interviewId
    );

    res.json({
      success: true,
      analytics: result.analytics,
      leaderboard: result.leaderboard
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * EXAMPLE 9: Sentiment Analysis Only (During Interview)
 * Route: POST /api/interview/:id/analyze-sentiment
 */
export async function analyzeSentiment(req, res) {
  try {
    const { transcript } = req.body;

    const result = await MasterPromptService.analyzeSentimentAndSoftSkills(transcript);

    res.json({
      success: true,
      sentiment: result
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * EXAMPLE 10: Compare Candidate with Peers
 * Route: GET /api/candidate/:id/peer-comparison
 */
export async function compareCandidateWithPeers(req, res) {
  try {
    const { id: candidateId } = req.params;
    const { stream } = req.query;

    const result = await LeaderboardService.compareCandidateWithPeers(
      candidateId,
      stream
    );

    res.json({
      success: true,
      comparison: result
    });

  } catch (error) {
    console.error('Peer comparison error:', error);
    res.status(500).json({ error: error.message });
  }
}

// =============================================================================
// USAGE IN YOUR ROUTE FILES
// =============================================================================

/*
// In routes/candidate.js
import { 
  handleCandidateApplication, 
  parseResume 
} from '../examples/implementationExamples.js';

router.post('/apply', auth, handleCandidateApplication);
router.post('/parse-resume', auth, parseResume);


// In routes/recruiter.js
import { 
  createInterviewWithQuestions,
  getLeaderboard,
  batchMatchCandidates,
  getRecruiterDashboard,
  getAntiCheatingReport
} from '../examples/implementationExamples.js';

router.post('/create-interview', auth, createInterviewWithQuestions);
router.get('/interview/:id/leaderboard', auth, getLeaderboard);
router.post('/interview/:id/match-candidates', auth, batchMatchCandidates);
router.get('/dashboard', auth, getRecruiterDashboard);
router.get('/interview/:id/anti-cheat-report', auth, getAntiCheatingReport);


// In routes/interview.js
import { 
  scoreCompletedInterview,
  analyzeSentiment
} from '../examples/implementationExamples.js';

router.post('/:id/score', auth, scoreCompletedInterview);
router.post('/:id/analyze-sentiment', auth, analyzeSentiment);
*/

// =============================================================================
// TESTING COMMANDS
// =============================================================================

/*
// Test Resume Parsing
curl -X POST http://localhost:5000/api/candidate/parse-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "John Doe\njohn@example.com\nSoftware Engineer with 5 years experience in JavaScript, React, Node.js..."
  }'


// Test Interview Creation
curl -X POST http://localhost:5000/api/recruiter/create-interview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jobDescription": "We are looking for a Senior Full-Stack Developer...",
    "requiredSkills": ["JavaScript", "React", "Node.js"],
    "questionCount": 10,
    "stream": "Computer Science",
    "title": "Senior Developer",
    "company": "Tech Corp"
  }'


// Test Leaderboard
curl http://localhost:5000/api/recruiter/interview/INTERVIEW_ID/leaderboard?topN=5 \
  -H "Authorization: Bearer YOUR_TOKEN"
*/
