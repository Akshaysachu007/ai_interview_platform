import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  type: {
    type: String,
    enum: ['new_interview', 'application_accepted', 'application_rejected', 'interview_reminder', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // Related interview (if applicable)
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: false
  },
  // Recruiter who created the interview (if applicable)
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter',
    required: false
  },
  // Stream of the interview
  stream: {
    type: String,
    required: false
  },
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  // Click/viewed status
  isClicked: {
    type: Boolean,
    default: false
  },
  // When it was read
  readAt: {
    type: Date,
    required: false
  },
  // Additional data
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for faster queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });





export default mongoose.model('Notification', notificationSchema);
