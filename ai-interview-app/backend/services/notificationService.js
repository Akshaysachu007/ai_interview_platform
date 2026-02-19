// Notification Service - Handles creating and sending notifications
import Notification from '../models/Notification.js';
import Candidate from '../models/Candidate.js';
import AIService from './aiService.js';

class NotificationService {
  /**
   * Send notification to candidates when new interview is created
   * ENHANCED: Now includes smart skill matching (60% threshold)
   * @param {Object} interview - Interview document
   * @param {Object} recruiter - Recruiter document
   */
  static async notifyNewInterview(interview, recruiter) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📢 SENDING SMART NOTIFICATIONS FOR NEW INTERVIEW`);
      console.log(`   Stream: ${interview.stream}`);
      console.log(`   Difficulty: ${interview.difficulty}`);
      console.log(`   Required Skills: ${interview.requiredSkills?.length || 0}`);
      console.log(`${'='.repeat(60)}\n`);

      // Find all candidates who:
      // 1. Have the same stream as the interview
      // 2. Have notifications enabled
      const candidates = await Candidate.find({
        stream: interview.stream,
        notificationsEnabled: true
      }).select('_id name email stream skills extractedSkills');

      console.log(`✅ Found ${candidates.length} candidates with stream: ${interview.stream}`);

      if (candidates.length === 0) {
        console.log('⚠️ No candidates to notify');
        return { success: true, notificationsSent: 0 };
      }

      // TASK 2: Smart Notification Logic - Only notify if 60%+ skill match
      const notifications = [];
      let matchedCount = 0;
      let skippedCount = 0;

      for (const candidate of candidates) {
        // Combine all candidate skills
        const candidateSkills = [
          ...(candidate.skills || []),
          ...(candidate.extractedSkills?.hardSkills || []),
          ...(candidate.extractedSkills?.softSkills || [])
        ];

        // Check if interview has required skills for matching
        if (interview.requiredSkills && interview.requiredSkills.length > 0) {
          const matchResult = AIService.calculateSkillMatch(
            candidateSkills,
            interview.requiredSkills
          );

          // Only notify if match is 60% or higher
          if (!matchResult.shouldNotify) {
            skippedCount++;
            console.log(`   ⏭️ Skipped ${candidate.name} (${matchResult.matchPercentage}% match - below 60% threshold)`);
            continue;
          }

          // Create smart notification with match percentage
          notifications.push({
            recipientId: candidate._id,
            type: 'new_interview',
            title: `🎯 ${matchResult.matchPercentage}% Match - ${interview.title || interview.stream}`,
            message: `An interview application is available that matches your skill set: ${interview.title || interview.stream} at ${interview.company || recruiter.company || recruiter.name}. You match ${matchResult.totalMatched}/${matchResult.totalRequired} required skills!`,
            interviewId: interview._id,
            recruiterId: interview.recruiterId,
            stream: interview.stream,
            metadata: {
              difficulty: interview.difficulty,
              recruiterName: recruiter.name,
              recruiterCompany: recruiter.company || interview.company,
              interviewStatus: interview.applicationStatus,
              skillMatchPercentage: matchResult.matchPercentage,
              matchedSkills: matchResult.matchedSkills,
              missingSkills: matchResult.missingSkills,
              totalRequired: matchResult.totalRequired,
              totalMatched: matchResult.totalMatched
            }
          });

          matchedCount++;
          console.log(`   ✅ Matched ${candidate.name} (${matchResult.matchPercentage}% match)`);

        } else {
          // No skill requirements - notify all candidates in stream (legacy behavior)
          notifications.push({
            recipientId: candidate._id,
            type: 'new_interview',
            title: `New ${interview.stream} Interview Available!`,
            message: `A new ${interview.difficulty} level interview for ${interview.stream} has been posted by ${interview.company || recruiter.company || recruiter.name}. Apply now!`,
            interviewId: interview._id,
            recruiterId: interview.recruiterId,
            stream: interview.stream,
            metadata: {
              difficulty: interview.difficulty,
              recruiterName: recruiter.name,
              recruiterCompany: recruiter.company,
              interviewStatus: interview.applicationStatus
            }
          });
          matchedCount++;
        }
      }

      console.log(`\n📊 Matching Summary:`);
      console.log(`   Total Candidates: ${candidates.length}`);
      console.log(`   Matched (≥60%): ${matchedCount}`);
      console.log(`   Skipped (<60%): ${skippedCount}`);

      // Bulk insert notifications
      if (notifications.length > 0) {
        const result = await Notification.insertMany(notifications);
        console.log(`\n✅ Successfully created ${result.length} smart notifications!`);
        console.log(`${'='.repeat(60)}\n`);

        return {
          success: true,
          notificationsSent: result.length,
          matchedCandidates: matchedCount,
          skippedCandidates: skippedCount,
          notifications: result
        };
      } else {
        console.log(`\n⚠️ No candidates met the 60% skill match threshold`);
        console.log(`${'='.repeat(60)}\n`);
        
        return {
          success: true,
          notificationsSent: 0,
          matchedCandidates: 0,
          skippedCandidates: skippedCount
        };
      }

    } catch (error) {
      console.error('❌ Error sending notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Notify candidate about application status change
   * @param {String} candidateId - Candidate ID
   * @param {Object} interview - Interview document
   * @param {String} status - 'accepted' or 'rejected'
   */
  static async notifyApplicationStatus(candidateId, interview, status, recruiter) {
    try {
      const isAccepted = status === 'accepted';
      
      const notification = new Notification({
        recipientId: candidateId,
        type: isAccepted ? 'application_accepted' : 'application_rejected',
        title: isAccepted ? '🎉 Application Accepted!' : 'Application Update',
        message: isAccepted
          ? `Your application for ${interview.stream} interview has been accepted! You can now start the interview.`
          : `Your application for ${interview.stream} interview was not accepted this time. Keep applying!`,
        interviewId: interview._id,
        recruiterId: interview.recruiterId,
        stream: interview.stream,
        metadata: {
          difficulty: interview.difficulty,
          recruiterName: recruiter?.name,
          recruiterCompany: recruiter?.company,
          status: status
        }
      });

      await notification.save();

      console.log(`✅ Sent ${status} notification to candidate ${candidateId}`);

      return { success: true, notification };

    } catch (error) {
      console.error('❌ Error sending application status notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread notification count for a candidate
   * @param {String} candidateId - Candidate ID
   */
  static async getUnreadCount(candidateId) {
    try {
      const count = await Notification.countDocuments({
        recipientId: candidateId,
        isRead: false
      });
      return count;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   * @param {String} notificationId - Notification ID
   */
  static async markAsRead(notificationId) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        {
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      );
      return { success: true, notification };
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read for a candidate
   * @param {String} candidateId - Candidate ID
   */
  static async markAllAsRead(candidateId) {
    try {
      const result = await Notification.updateMany(
        { recipientId: candidateId, isRead: false },
        {
          isRead: true,
          readAt: new Date()
        }
      );
      return { success: true, modifiedCount: result.modifiedCount };
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete notification
   * @param {String} notificationId - Notification ID
   */
  static async deleteNotification(notificationId) {
    try {
      await Notification.findByIdAndDelete(notificationId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  }
}

export default NotificationService;
