import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: false // Made optional since candidate applies first
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter',
    required: true
  },
  stream: {
    type: String,
    required: true,
    enum: ['Computer Science', 'Information Technology', 'Mechanical Engineering', 
           'Electrical Engineering', 'Civil Engineering', 'Business Management', 
           'Marketing', 'Finance', 'Data Science', 'AI/ML']
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  applicationStatus: {
    type: String,
    enum: ['open', 'pending', 'accepted', 'rejected', 'mock'],
    default: 'open' // open = available for applications, pending = candidate applied, accepted/rejected by recruiter, mock = practice interview
  },
  questions: [{
    question: String,
    generatedAt: Date,
    answer: String,
    isAiGenerated: Boolean,
    aiConfidence: Number
  }],
  malpractices: [{
    type: {
      type: String,
      enum: ['tab_switch', 'multiple_voice', 'ai_generated_answer', 'face_not_detected', 'multiple_faces']
    },
    detectedAt: Date,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    details: String
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'flagged'],
    default: 'scheduled'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  startTime: Date,
  startedAt: Date, // When interview was started
  endTime: Date,
  duration: Number, // in minutes
  tabSwitchCount: {
    type: Number,
    default: 0
  },
  voiceChangesDetected: {
    type: Number,
    default: 0
  },
  aiAnswersDetected: {
    type: Number,
    default: 0
  },
  noFaceDetected: {
    type: Number,
    default: 0
  },
  multipleFacesDetected: {
    type: Number,
    default: 0
  },
  currentWebcamSnapshot: {
    type: String, // Base64 encoded image
    default: null
  },
  currentFaceCount: {
    type: Number,
    default: 0
  },
  lastSnapshotUpdate: {
    type: Date,
    default: null
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  flagged: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  reviewed: {
    type: Boolean,
    default: false
  },
  candidateName: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Interview', interviewSchema);
