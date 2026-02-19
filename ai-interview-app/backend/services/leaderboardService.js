// Comparative Leaderboard & Advanced Analytics Service
// Provides "Top 5" stack-rank and anti-cheating analysis
import mongoose from 'mongoose';

/**
 * PREMIUM FEATURES:
 * 1. Comparative Leaderboard - Rank candidates by AI scores
 * 2. Anti-Cheating Vision AI Integration
 * 3. Performance Analytics
 */
class LeaderboardService {

  /**
   * Generate comparative leaderboard for an interview/job posting
   * Ranks all candidates who applied and completed the interview
   * 
   * @param {string} interviewId - Interview ID
   * @param {number} topN - Number of top candidates to return (default: 5)
   * @returns {Promise<Array>} Ranked list of top candidates
   */
  static async generateLeaderboard(interviewId, topN = 5) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🏆 COMPARATIVE LEADERBOARD GENERATION');
    console.log(`${'='.repeat(80)}`);
    console.log(`   Interview ID: ${interviewId}`);
    console.log(`   Top N: ${topN}`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      // Import models
      const Interview = mongoose.model('Interview');
      const Candidate = mongoose.model('Candidate');

      // Find the interview
      const interview = await Interview.findById(interviewId);
      if (!interview) {
        throw new Error('Interview not found');
      }

      // Get all candidates who completed this interview
      // Filter by interviews where this interview ID is referenced and status is completed
      const completedInterviews = await Interview.find({
        recruiterId: interview.recruiterId,
        title: interview.title,
        status: 'completed',
        score: { $exists: true, $ne: null }
      }).populate('candidateId');

      console.log(`   Found ${completedInterviews.length} completed interviews\n`);

      // Build leaderboard entries
      const leaderboardEntries = await Promise.all(
        completedInterviews.map(async (int) => {
          const candidate = int.candidateId;
          
          if (!candidate) return null;

          // Calculate composite score with anti-cheating penalty
          const baseScore = int.score || 0;
          const malpracticePenalty = this.calculateMalpracticePenalty(int);
          const finalScore = Math.max(0, baseScore - malpracticePenalty);

          // Get sentiment analysis if available
          const sentimentData = int.sentimentAnalysis || {};

          // Get application score if available
          const applicationScore = interview.applicationScores?.find(
            score => score.candidateId?.toString() === candidate._id.toString()
          );

          return {
            candidateId: candidate._id,
            candidateName: candidate.name,
            candidateEmail: candidate.email,
            interviewId: int._id,
            
            // Scores
            interviewScore: int.score || 0,
            malpracticePenalty,
            finalScore,
            applicationScore: applicationScore?.score || 0,
            
            // Performance breakdown
            breakdown: int.scoreBreakdown || {},
            
            // Soft skills & sentiment
            confidence: sentimentData.confidence || 'N/A',
            confidenceScore: sentimentData.confidenceScore || 0,
            communicationClarity: sentimentData.communicationClarity || 'N/A',
            softSkills: sentimentData.softSkills || {},
            
            // Anti-cheating metrics
            tabSwitchCount: int.tabSwitchCount || 0,
            voiceChangesDetected: int.voiceChangesDetected || 0,
            aiAnswersDetected: int.aiAnswersDetected || 0,
            noFaceDetected: int.noFaceDetected || 0,
            multipleFacesDetected: int.multipleFacesDetected || 0,
            totalMalpractices: int.malpractices?.length || 0,
            flagged: int.flagged || false,
            
            // Timing
            duration: int.duration || 0,
            completedAt: int.completedAt,
            
            // Recommendation
            recommendation: int.recommendation || 'N/A',
            
            // Calculate overall rating
            overallRating: this.calculateOverallRating({
              finalScore,
              malpractices: int.malpractices?.length || 0,
              confidence: sentimentData.confidenceScore || 0,
              applicationScore: applicationScore?.score || 0
            })
          };
        })
      );

      // Filter out null entries and sort by final score
      const validEntries = leaderboardEntries
        .filter(entry => entry !== null)
        .sort((a, b) => b.finalScore - a.finalScore);

      // Get top N
      const topCandidates = validEntries.slice(0, topN);

      // Add rank
      topCandidates.forEach((candidate, index) => {
        candidate.rank = index + 1;
        candidate.medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      });

      console.log(`✅ Leaderboard Generated`);
      console.log(`   Total Candidates: ${validEntries.length}`);
      console.log(`   Top ${topN} Candidates:\n`);
      
      topCandidates.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.medal} ${c.candidateName} - Score: ${c.finalScore.toFixed(1)}`);
      });
      console.log(`${'='.repeat(80)}\n`);

      return {
        success: true,
        interview: {
          id: interview._id,
          title: interview.title || interview.stream,
          company: interview.company,
          stream: interview.stream
        },
        totalCandidates: validEntries.length,
        topN,
        leaderboard: topCandidates,
        allCandidates: validEntries, // Include all for recruiter's full view
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Leaderboard generation error:', error.message);
      throw error;
    }
  }

  /**
   * Calculate malpractice penalty based on anti-cheating detections
   * @param {Object} interview - Interview object with malpractice data
   * @returns {number} Penalty score to subtract
   */
  static calculateMalpracticePenalty(interview) {
    let penalty = 0;

    // Tab switches - minor penalty
    penalty += (interview.tabSwitchCount || 0) * 0.5;

    // Voice changes - moderate penalty
    penalty += (interview.voiceChangesDetected || 0) * 2;

    // AI-generated answers - severe penalty
    penalty += (interview.aiAnswersDetected || 0) * 5;

    // No face detected - moderate penalty
    penalty += (interview.noFaceDetected || 0) * 1.5;

    // Multiple faces - severe penalty
    penalty += (interview.multipleFacesDetected || 0) * 4;

    // Flagged interview - additional penalty
    if (interview.flagged) {
      penalty += 10;
    }

    // Malpractice severity scores
    (interview.malpractices || []).forEach(malpractice => {
      if (malpractice.severity === 'high') penalty += 5;
      else if (malpractice.severity === 'medium') penalty += 2;
      else penalty += 0.5;
    });

    return Math.min(penalty, 50); // Cap penalty at 50 points
  }

  /**
   * Calculate overall rating (A+, A, B+, B, C, D, F)
   * @param {Object} params - Rating parameters
   * @returns {string} Letter grade
   */
  static calculateOverallRating({ finalScore, malpractices, confidence, applicationScore }) {
    // Start with final score
    let rating = finalScore;

    // Boost for high confidence
    if (confidence > 80) rating += 5;

    // Boost for strong application
    if (applicationScore > 80) rating += 5;

    // Penalty for malpractices
    if (malpractices > 5) rating -= 10;
    else if (malpractices > 3) rating -= 5;

    // Determine letter grade
    if (rating >= 95) return 'A+';
    if (rating >= 90) return 'A';
    if (rating >= 85) return 'A-';
    if (rating >= 80) return 'B+';
    if (rating >= 75) return 'B';
    if (rating >= 70) return 'B-';
    if (rating >= 65) return 'C+';
    if (rating >= 60) return 'C';
    if (rating >= 55) return 'C-';
    if (rating >= 50) return 'D';
    return 'F';
  }

  /**
   * Get detailed anti-cheating analysis for a candidate
   * @param {string} interviewId - Interview ID
   * @returns {Promise<Object>} Detailed anti-cheating report
   */
  static async getAntiCheatingReport(interviewId) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔍 ANTI-CHEATING ANALYSIS REPORT');
    console.log(`${'='.repeat(80)}\n`);

    try {
      const Interview = mongoose.model('Interview');
      const interview = await Interview.findById(interviewId).populate('candidateId');

      if (!interview) {
        throw new Error('Interview not found');
      }

      // Analyze malpractices
      const malpractices = interview.malpractices || [];
      const malpracticesByType = {};
      const malpracticesBySeverity = { low: 0, medium: 0, high: 0 };

      malpractices.forEach(m => {
        malpracticesByType[m.type] = (malpracticesByType[m.type] || 0) + 1;
        malpracticesBySeverity[m.severity] = (malpracticesBySeverity[m.severity] || 0) + 1;
      });

      // Calculate integrity score (0-100, higher is better)
      const integrityScore = Math.max(0, 100 - this.calculateMalpracticePenalty(interview) * 2);

      // Determine risk level
      let riskLevel = 'Low';
      if (interview.flagged || malpracticesBySeverity.high > 2) riskLevel = 'High';
      else if (malpractices.length > 5 || malpracticesBySeverity.high > 0) riskLevel = 'Medium';

      const report = {
        candidateName: interview.candidateId?.name || 'Unknown',
        candidateEmail: interview.candidateId?.email || 'Unknown',
        interviewId: interview._id,
        
        // Summary metrics
        integrityScore,
        riskLevel,
        flagged: interview.flagged,
        totalMalpractices: malpractices.length,
        
        // Detailed counts
        tabSwitches: interview.tabSwitchCount || 0,
        voiceChanges: interview.voiceChangesDetected || 0,
        aiAnswers: interview.aiAnswersDetected || 0,
        noFaceDetections: interview.noFaceDetected || 0,
        multipleFaces: interview.multipleFacesDetected || 0,
        
        // Breakdown
        malpracticesByType,
        malpracticesBySeverity,
        
        // Timeline
        malpracticeTimeline: malpractices.map(m => ({
          type: m.type,
          severity: m.severity,
          timestamp: m.detectedAt,
          details: m.details
        })),
        
        // Recommendation
        recommendation: integrityScore >= 80 ? 'Proceed' : 
                       integrityScore >= 60 ? 'Review' : 
                       'Flag for Manual Review',
        
        // Penalty applied
        penalty: this.calculateMalpracticePenalty(interview),
        
        generatedAt: new Date()
      };

      console.log(`✅ Anti-Cheating Report Generated`);
      console.log(`   Integrity Score: ${integrityScore}/100`);
      console.log(`   Risk Level: ${riskLevel}`);
      console.log(`   Total Malpractices: ${malpractices.length}`);
      console.log(`   Recommendation: ${report.recommendation}`);
      console.log(`${'='.repeat(80)}\n`);

      return {
        success: true,
        report
      };

    } catch (error) {
      console.error('❌ Anti-cheating report error:', error.message);
      throw error;
    }
  }

  /**
   * Get analytics dashboard data for recruiter
   * @param {string} recruiterId - Recruiter ID
   * @returns {Promise<Object>} Analytics data
   */
  static async getRecruiterAnalytics(recruiterId) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 RECRUITER ANALYTICS DASHBOARD');
    console.log(`${'='.repeat(80)}\n`);

    try {
      const Interview = mongoose.model('Interview');

      // Get all interviews for this recruiter
      const allInterviews = await Interview.find({ recruiterId });
      const completedInterviews = allInterviews.filter(i => i.status === 'completed');

      // Calculate statistics
      const totalInterviews = allInterviews.length;
      const totalCompleted = completedInterviews.length;
      const averageScore = completedInterviews.length > 0
        ? completedInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / completedInterviews.length
        : 0;

      // Count by status
      const statusCounts = {};
      allInterviews.forEach(i => {
        statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;
      });

      // Count flagged interviews
      const flaggedCount = allInterviews.filter(i => i.flagged).length;

      // Get top performers
      const topPerformers = completedInterviews
        .filter(i => i.score >= 80)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(i => ({
          candidateName: i.candidateName,
          score: i.score,
          stream: i.stream,
          completedAt: i.completedAt
        }));

      // Distribution by stream
      const streamDistribution = {};
      allInterviews.forEach(i => {
        streamDistribution[i.stream] = (streamDistribution[i.stream] || 0) + 1;
      });

      const analytics = {
        overview: {
          totalInterviews,
          totalCompleted,
          completionRate: totalInterviews > 0 ? (totalCompleted / totalInterviews * 100).toFixed(1) : 0,
          averageScore: averageScore.toFixed(1),
          flaggedCount,
          flaggedPercentage: totalCompleted > 0 ? (flaggedCount / totalCompleted * 100).toFixed(1) : 0
        },
        statusCounts,
        topPerformers,
        streamDistribution,
        generatedAt: new Date()
      };

      console.log(`✅ Analytics Generated`);
      console.log(`   Total Interviews: ${totalInterviews}`);
      console.log(`   Completed: ${totalCompleted}`);
      console.log(`   Average Score: ${averageScore.toFixed(1)}`);
      console.log(`   Top Performers: ${topPerformers.length}`);
      console.log(`${'='.repeat(80)}\n`);

      return {
        success: true,
        analytics
      };

    } catch (error) {
      console.error('❌ Analytics error:', error.message);
      throw error;
    }
  }

  /**
   * Compare candidate against all others in the same stream
   * @param {string} candidateId - Candidate ID
   * @param {string} stream - Stream to compare within
   * @returns {Promise<Object>} Comparative analysis
   */
  static async compareCandidateWithPeers(candidateId, stream) {
    try {
      const Interview = mongoose.model('Interview');

      // Get candidate's interview
      const candidateInterview = await Interview.findOne({
        candidateId,
        stream,
        status: 'completed'
      });

      if (!candidateInterview) {
        throw new Error('Candidate interview not found');
      }

      // Get all completed interviews in the same stream
      const allInStream = await Interview.find({
        stream,
        status: 'completed',
        score: { $exists: true }
      });

      const scores = allInStream.map(i => i.score).sort((a, b) => a - b);
      const candidateScore = candidateInterview.score;

      // Calculate percentile
      const lowerCount = scores.filter(s => s < candidateScore).length;
      const percentile = (lowerCount / scores.length) * 100;

      // Calculate statistics
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const median = scores[Math.floor(scores.length / 2)];

      return {
        candidateScore,
        percentile: Math.round(percentile),
        avgScore: Math.round(avgScore * 10) / 10,
        median,
        totalCandidates: scores.length,
        rank: scores.length - lowerCount,
        stream,
        performance: percentile >= 80 ? 'Excellent' :
                    percentile >= 60 ? 'Above Average' :
                    percentile >= 40 ? 'Average' :
                    percentile >= 20 ? 'Below Average' : 'Needs Improvement'
      };

    } catch (error) {
      console.error('❌ Peer comparison error:', error.message);
      throw error;
    }
  }
}

export default LeaderboardService;
