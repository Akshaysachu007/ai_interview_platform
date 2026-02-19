// Premium Interview System Integration Service
// Orchestrates all advanced features: Resume Parsing, Vector Matching, Question Generation, Scoring
// import ResumeParserService from './resumeParserService.js'; // Removed - using simple Python parser
import VectorMatchingService from './vectorMatchingService.js';
import MasterPromptService from './masterPromptService.js';
import LeaderboardService from './leaderboardService.js';
import mongoose from 'mongoose';

/**
 * ENTERPRISE INTEGRATION SERVICE
 * This service orchestrates all premium features into cohesive workflows:
 * 
 * 1. Candidate Application Flow:
 *    Resume Upload → Parse → Vector Match → Auto-Notify
 * 
 * 2. Interview Creation Flow:
 *    JD Input → Dynamic Question Generation (recruiter controls count)
 * 
 * 3. Interview Completion Flow:
 *    Transcript → Scoring Rubric → Sentiment Analysis → Leaderboard Update
 */
class IntegrationService {

  /**
   * WORKFLOW 1: Complete Candidate Application Processing
   * Handles: Resume parsing, skill extraction, vector matching, and notification
   * 
   * @param {Object} params - Application parameters
   * @param {string} params.candidateId - Candidate ID
   * @param {string} params.resumeText - Raw resume text
   * @param {string} params.interviewId - Interview/Job ID to apply for
   * @returns {Promise<Object>} Application result with matching score
   */
  static async processCandidateApplication({ candidateId, resumeText, interviewId }) {
    console.log(`\n${'='.repeat(90)}`);
    console.log('🚀 WORKFLOW 1: COMPLETE CANDIDATE APPLICATION PROCESSING');
    console.log(`${'='.repeat(90)}\n`);

    try {
      const Candidate = mongoose.model('Candidate');
      const Interview = mongoose.model('Interview');

      // Step 1: Parse resume (Note: Use simple parser endpoint instead)
      console.log('STEP 1: Resume Parsing...');
      // TODO: Replace with SimpleResumeParser if needed for integration flows
      const parseResult = { success: false, error: 'Use simple Python parser endpoint' };

      if (!parseResult.success) {
        throw new Error('Resume parsing failed');
      }

      const profileData = parseResult.data;

      // Step 2: Update candidate profile
      console.log('STEP 2: Updating candidate profile...');
      await Candidate.findByIdAndUpdate(candidateId, {
        resumeText: resumeText,
        personalDetails: profileData.personalDetails,
        workExperience: profileData.workExperience,
        education: profileData.education,
        certifications: profileData.certifications,
        extractedSkills: profileData.skills,
        yearsOfExperience: profileData.yearsOfExperience,
        profileSummary: profileData.profileSummary,
        profileCompleteness: profileData.profileCompleteness,
        lastResumeUpdate: new Date()
      });

      // Step 3: Get job description
      console.log('STEP 3: Fetching job description...');
      const interview = await Interview.findById(interviewId);
      
      if (!interview) {
        throw new Error('Interview not found');
      }

      // Step 4: Vector matching
      console.log('STEP 4: Performing vector matching...');
      const matchResult = await VectorMatchingService.matchCandidateToJob(
        profileData,
        {
          title: interview.title,
          stream: interview.stream,
          jobDescription: interview.jobDescription,
          requiredSkills: interview.requiredSkills,
          preferredSkills: interview.preferredSkills,
          requirements: interview.requirements
        }
      );

      // Step 5: Resume scoring against JD
      console.log('STEP 5: Scoring resume against JD...');
      const AIService = (await import('./aiService.js')).default;
      const scoringResult = await AIService.scoreResumeAgainstJD(profileData, {
        requiredSkills: interview.requiredSkills,
        stream: interview.stream,
        jobDescription: interview.jobDescription,
        requirements: interview.requirements
      });

      // Step 6: Update interview with application score
      console.log('STEP 6: Updating interview with application score...');
      await Interview.findByIdAndUpdate(interviewId, {
        $push: {
          applicationScores: {
            candidateId: candidateId,
            score: scoringResult.overallScore,
            breakdown: scoringResult.breakdown,
            gapAnalysis: scoringResult.gapAnalysis,
            strengths: scoringResult.strengths,
            weaknesses: scoringResult.weaknesses,
            recommendation: scoringResult.recommendation,
            scoredAt: new Date()
          }
        }
      });

      // Step 7: Determine if candidate should be notified
      const shouldNotify = matchResult.shouldNotify && scoringResult.overallScore >= 60;

      console.log(`\n✅ APPLICATION PROCESSING COMPLETE`);
      console.log(`   Profile Completeness: ${profileData.profileCompleteness}%`);
      console.log(`   Vector Match: ${matchResult.similarityPercentage}%`);
      console.log(`   Resume Score: ${scoringResult.overallScore}/100`);
      console.log(`   Should Notify: ${shouldNotify ? '✅ YES' : '❌ NO'}`);
      console.log(`   Recommendation: ${scoringResult.recommendation}`);
      console.log(`${'='.repeat(90)}\n`);

      return {
        success: true,
        candidateId,
        interviewId,
        profileData,
        vectorMatch: matchResult,
        resumeScore: scoringResult,
        shouldNotify,
        applicationProcessedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Application processing error:', error.message);
      throw error;
    }
  }

  /**
   * WORKFLOW 2: Dynamic Interview Creation with JD-Aware Questions
   * Handles: Question generation based on JD, recruiter count, and candidate skills
   * 
   * @param {Object} params - Interview creation parameters
   * @param {string} params.recruiterId - Recruiter ID
   * @param {string} params.jobDescription - Full job description
   * @param {Array} params.requiredSkills - Required skills
   * @param {number} params.questionCount - Number of questions (from recruiter)
   * @param {string} params.stream - Technical stream
   * @param {string} params.difficulty - Difficulty level
   * @param {string} params.title - Job title
   * @param {string} params.company - Company name
   * @returns {Promise<Object>} Created interview with generated questions
   */
  static async createInterviewWithDynamicQuestions({
    recruiterId,
    jobDescription,
    requiredSkills = [],
    preferredSkills = [],
    questionCount = 5,
    stream,
    difficulty = 'Medium',
    title,
    company,
    requirements = {}
  }) {
    console.log(`\n${'='.repeat(90)}`);
    console.log('🚀 WORKFLOW 2: DYNAMIC INTERVIEW CREATION WITH JD-AWARE QUESTIONS');
    console.log(`${'='.repeat(90)}\n`);

    try {
      const Interview = mongoose.model('Interview');

      // Step 1: Generate contextual questions using Master Prompt
      console.log('STEP 1: Generating contextual questions...');
      const questions = await MasterPromptService.generateContextualQuestions({
        jobDescription,
        candidateSkills: requiredSkills, // Use required skills as baseline
        questionCount,
        stream,
        difficulty
      });

      // Step 2: Create interview with generated questions
      console.log('STEP 2: Creating interview record...');
      const interview = await Interview.create({
        recruiterId,
        stream,
        difficulty,
        title,
        company,
        jobDescription,
        requiredSkills,
        preferredSkills,
        requirements,
        questionCount,
        questions: questions.map(q => ({
          question: q.question,
          generatedAt: new Date(),
          isAiGenerated: true,
          category: q.category,
          aiConfidence: q.relevanceScore
        })),
        questionGenerationMetadata: {
          jdBased: true,
          skillsMatched: requiredSkills,
          generatedAt: new Date(),
          generationStrategy: 'contextual-master-prompt'
        },
        applicationStatus: 'open',
        status: 'scheduled'
      });

      console.log(`\n✅ INTERVIEW CREATION COMPLETE`);
      console.log(`   Interview ID: ${interview._id}`);
      console.log(`   Questions Generated: ${questions.length}`);
      console.log(`   Technical: ${questions.filter(q => q.type === 'technical').length}`);
      console.log(`   Behavioral: ${questions.filter(q => q.type === 'behavioral').length}`);
      console.log(`   JD-Aware: ✅`);
      console.log(`${'='.repeat(90)}\n`);

      return {
        success: true,
        interview,
        questions,
        metadata: {
          questionCount,
          jdBased: true,
          generatedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Interview creation error:', error.message);
      throw error;
    }
  }

  /**
   * WORKFLOW 3: Complete Interview Scoring & Analysis
   * Handles: Transcript analysis, scoring rubric, sentiment analysis, leaderboard update
   * 
   * @param {Object} params - Scoring parameters
   * @param {string} params.interviewId - Interview ID
   * @param {string} params.transcript - Full interview transcript
   * @returns {Promise<Object>} Complete scoring results
   */
  static async scoreCompletedInterview({ interviewId, transcript }) {
    console.log(`\n${'='.repeat(90)}`);
    console.log('🚀 WORKFLOW 3: COMPLETE INTERVIEW SCORING & ANALYSIS');
    console.log(`${'='.repeat(90)}\n`);

    try {
      const Interview = mongoose.model('Interview');
      const Candidate = mongoose.model('Candidate');

      // Step 1: Get interview and candidate data
      console.log('STEP 1: Fetching interview data...');
      const interview = await Interview.findById(interviewId).populate('candidateId');
      
      if (!interview) {
        throw new Error('Interview not found');
      }

      const candidate = await Candidate.findById(interview.candidateId);

      // Step 2: Score interview using Master Prompt (Task 3)
      console.log('STEP 2: Scoring interview transcript...');
      const scoringResult = await MasterPromptService.scoreInterviewTranscript({
        candidateTranscript: transcript,
        jobDescription: interview.jobDescription,
        questions: interview.questions,
        candidateProfile: {
          name: candidate?.name,
          yearsOfExperience: candidate?.yearsOfExperience,
          skills: candidate?.extractedSkills
        }
      });

      // Step 3: Sentiment & soft skill analysis
      console.log('STEP 3: Analyzing sentiment and soft skills...');
      const sentimentResult = await MasterPromptService.analyzeSentimentAndSoftSkills(transcript);

      // Step 4: Update interview with results
      console.log('STEP 4: Updating interview record...');
      await Interview.findByIdAndUpdate(interviewId, {
        transcript,
        score: scoringResult.matchScore,
        scoreBreakdown: scoringResult.breakdown,
        pros: scoringResult.pros,
        cons: scoringResult.cons,
        overallAssessment: scoringResult.overallAssessment,
        recommendation: scoringResult.recommendation,
        aiConfidenceLevel: scoringResult.confidenceLevel,
        sentimentAnalysis: sentimentResult,
        status: 'completed',
        completedAt: new Date()
      });

      // Step 5: Update leaderboard (if multiple candidates)
      console.log('STEP 5: Checking leaderboard...');
      // Leaderboard is generated on-demand by recruiters

      console.log(`\n✅ INTERVIEW SCORING COMPLETE`);
      console.log(`   Match Score: ${scoringResult.matchScore}/100`);
      console.log(`   Recommendation: ${scoringResult.recommendation}`);
      console.log(`   Confidence: ${sentimentResult.confidence}`);
      console.log(`   Communication: ${sentimentResult.communicationClarity}`);
      console.log(`   Pros: ${scoringResult.pros.length}, Cons: ${scoringResult.cons.length}`);
      console.log(`${'='.repeat(90)}\n`);

      return {
        success: true,
        interviewId,
        scoring: scoringResult,
        sentiment: sentimentResult,
        finalScore: scoringResult.matchScore,
        recommendation: scoringResult.recommendation,
        scoredAt: new Date()
      };

    } catch (error) {
      console.error('❌ Interview scoring error:', error.message);
      throw error;
    }
  }

  /**
   * WORKFLOW 4: Batch Candidate Matching for Job Posting
   * Matches multiple candidates against a job and generates notifications
   * 
   * @param {string} interviewId - Interview/Job posting ID
   * @param {Array} candidateIds - Array of candidate IDs to match (optional)
   * @returns {Promise<Object>} Batch matching results
   */
  static async batchMatchCandidatesForJob(interviewId, candidateIds = null) {
    console.log(`\n${'='.repeat(90)}`);
    console.log('🚀 WORKFLOW 4: BATCH CANDIDATE MATCHING');
    console.log(`${'='.repeat(90)}\n`);

    try {
      const Interview = mongoose.model('Interview');
      const Candidate = mongoose.model('Candidate');

      // Get interview/job
      const interview = await Interview.findById(interviewId);
      if (!interview) {
        throw new Error('Interview not found');
      }

      // Get candidates
      let candidates;
      if (candidateIds) {
        candidates = await Candidate.find({ _id: { $in: candidateIds } });
      } else {
        // Match against all candidates in the same stream
        candidates = await Candidate.find({ 
          stream: interview.stream,
          profileCompleteness: { $gte: 50 } // Only consider complete profiles
        });
      }

      console.log(`   Processing ${candidates.length} candidates...\n`);

      // Batch vector matching
      const jobDescription = {
        title: interview.title,
        stream: interview.stream,
        jobDescription: interview.jobDescription,
        requiredSkills: interview.requiredSkills,
        preferredSkills: interview.preferredSkills,
        requirements: interview.requirements
      };

      const matches = await VectorMatchingService.batchMatchCandidates(
        candidates.map(c => ({
          _id: c._id,
          personalDetails: c.personalDetails,
          workExperience: c.workExperience,
          education: c.education,
          certifications: c.certifications,
          skills: c.extractedSkills,
          yearsOfExperience: c.yearsOfExperience,
          profileSummary: c.profileSummary
        })),
        jobDescription
      );

      // Filter strong matches
      const strongMatches = matches.filter(m => m.shouldNotify);

      console.log(`✅ BATCH MATCHING COMPLETE`);
      console.log(`   Total Candidates: ${candidates.length}`);
      console.log(`   Strong Matches (≥80%): ${strongMatches.length}`);
      console.log(`   Notification Ready: ${strongMatches.length}`);
      console.log(`${'='.repeat(90)}\n`);

      return {
        success: true,
        interviewId,
        totalCandidates: candidates.length,
        matches,
        strongMatches,
        notificationList: strongMatches.map(m => ({
          candidateId: m.candidateId,
          candidateEmail: m.candidateEmail,
          matchScore: m.similarityPercentage,
          message: `🎯 ${m.similarityPercentage}% Match - ${interview.title} at ${interview.company}`
        })),
        processedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Batch matching error:', error.message);
      throw error;
    }
  }

  /**
   * WORKFLOW 5: Generate Recruiter Dashboard with Leaderboard
   * 
   * @param {string} recruiterId - Recruiter ID
   * @param {string} interviewId - Specific interview ID (optional)
   * @returns {Promise<Object>} Dashboard data with leaderboard
   */
  static async generateRecruiterDashboard(recruiterId, interviewId = null) {
    console.log(`\n${'='.repeat(90)}`);
    console.log('🚀 WORKFLOW 5: RECRUITER DASHBOARD GENERATION');
    console.log(`${'='.repeat(90)}\n`);

    try {
      // Get overall analytics
      const analytics = await LeaderboardService.getRecruiterAnalytics(recruiterId);

      // Get leaderboard for specific interview if provided
      let leaderboard = null;
      if (interviewId) {
        leaderboard = await LeaderboardService.generateLeaderboard(interviewId, 10);
      }

      console.log(`✅ DASHBOARD GENERATED`);
      console.log(`   Total Interviews: ${analytics.analytics.overview.totalInterviews}`);
      console.log(`   Completion Rate: ${analytics.analytics.overview.completionRate}%`);
      console.log(`   Average Score: ${analytics.analytics.overview.averageScore}`);
      if (leaderboard) {
        console.log(`   Leaderboard Candidates: ${leaderboard.leaderboard.length}`);
      }
      console.log(`${'='.repeat(90)}\n`);

      return {
        success: true,
        recruiterId,
        analytics: analytics.analytics,
        leaderboard: leaderboard?.leaderboard || null,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Dashboard generation error:', error.message);
      throw error;
    }
  }
}

export default IntegrationService;
