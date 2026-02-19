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
    aiConfidence: Number,
    // Enhanced evaluation metrics
    answerStartTime: Date, // When candidate started answering
    answerEndTime: Date,   // When candidate submitted answer
    answerDuration: Number, // Time taken in seconds
    wordCount: Number,      // Number of words in answer
    characterCount: Number, // Number of characters
    estimatedReadingTime: Number, // Expected time to read question (seconds)
    responseSpeed: String,  // 'Very Fast', 'Fast', 'Normal', 'Slow', 'Very Slow'
    answerQuality: {        // AI-evaluated quality metrics
      relevance: Number,    // 0-100
      completeness: Number, // 0-100
      clarity: Number,      // 0-100
      technicalDepth: Number, // 0-100
      overallScore: Number   // 0-100
    }
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
  autoSubmitted: {  // Flag to indicate if interview was auto-submitted due to time expiration
    type: Boolean,
    default: false
  },
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
  },
  
  // =====================================================================
  // ADVANCED HR TECH INTEGRATION - Job Description & Requirements
  // =====================================================================
  
  // Job title
  title: {
    type: String,
    default: ''
  },
  
  // Company name
  company: {
    type: String,
    default: ''
  },
  
  // Required skills for skill matching
  requiredSkills: [{
    type: String
  }],
  
  // Preferred skills
  preferredSkills: [{
    type: String
  }],
  
  // Job description details
  jobDescription: {
    type: String,
    default: ''
  },
  
  // Requirements
  requirements: {
    minExperience: { type: Number, default: 0 }, // Years
    maxExperience: { type: Number },
    educationLevel: { type: String }, // e.g., "Bachelor's", "Master's"
    specificRequirements: [{ type: String }]
  },
  
  // Resume scoring for applicants
  applicationScores: [{
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate'
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    breakdown: {
      keywordMatch: Number,
      experienceRelevance: Number,
      educationalAlignment: Number,
      overallFit: Number
    },
    gapAnalysis: [{ type: String }],
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendation: {
      type: String,
      enum: ['Highly Recommended', 'Recommended', 'Consider', 'Not Recommended']
    },
    scoredAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ATS Score for current candidate (quick access)
  atsScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  
  // Resume text extracted from uploaded file
  resumeText: {
    type: String,
    default: ''
  },
  
  // =====================================================================
  // PREMIUM FEATURES - Question Generation & Scoring
  // =====================================================================
  
  // Dynamic question count from recruiter
  questionCount: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
  
  // Interview time limit in minutes
  timeLimit: {
    type: Number,
    default: 30,
    min: 5,
    max: 180
  },
  
  // Custom questions added by recruiter
  customQuestions: [{
    question: { type: String },
    addedBy: { type: String, default: 'recruiter' }, // 'recruiter' or 'pdf'
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Question source tracking
  questionSources: {
    aiGenerated: { type: Number, default: 0 },
    recruiterAdded: { type: Number, default: 0 },
    pdfExtracted: { type: Number, default: 0 }
  },
  
  // JD-aware question generation metadata
  questionGenerationMetadata: {
    jdBased: { type: Boolean, default: false },
    skillsMatched: [{ type: String }],
    generatedAt: { type: Date },
    generationStrategy: { type: String } // 'contextual', 'fallback', 'ml-based'
  },
  
  // Interview transcript for scoring
  transcript: {
    type: String,
    default: ''
  },
  
  // AI Scoring Rubric Results (Post-Interview)
  scoreBreakdown: {
    technicalAccuracy: { type: Number, min: 0, max: 40 },
    depthOfKnowledge: { type: Number, min: 0, max: 20 },
    communicationSkills: { type: Number, min: 0, max: 15 },
    problemSolving: { type: Number, min: 0, max: 15 },
    jdAlignment: { type: Number, min: 0, max: 10 }
  },
  
  // 3 Pros and 2 Cons from Master Prompt
  pros: [{ type: String }],
  cons: [{ type: String }],
  overallAssessment: { type: String },
  recommendation: { 
    type: String,
    enum: ['Strong Hire', 'Hire', 'Maybe', 'No Hire']
  },
  aiConfidenceLevel: { type: Number, min: 0, max: 100 },
  
  // Enhanced AI Evaluation Metrics
  enhancedEvaluation: {
    // Timing Analysis
    averageAnswerTime: { type: Number }, // seconds
    totalThinkingTime: { type: Number }, // seconds
    responseConsistency: { type: String }, // 'Consistent', 'Variable', 'Inconsistent'
    paceAnalysis: { type: String }, // 'Well-paced', 'Rushed', 'Slow'
    
    // Tone & Communication Analysis  
    toneAnalysis: {
      professionalism: { type: Number, min: 0, max: 100 },
      confidence: { type: Number, min: 0, max: 100 },
      clarity: { type: Number, min: 0, max: 100 },
      articulation: { type: Number, min: 0, max: 100 },
      overallTone: { type: String } // 'Excellent', 'Good', 'Average', 'Poor'
    },
    
    // Answer Quality Metrics
    answerDepthScore: { type: Number, min: 0, max: 100 },
    technicalAccuracyScore: { type: Number, min: 0, max: 100 },
    relevanceScore: { type: Number, min: 0, max: 100 },
    completenessScore: { type: Number, min: 0, max: 100 },
    
    // Comparative Analysis
    comparedToAverage: { type: String }, // 'Above Average', 'Average', 'Below Average'
    percentileRank: { type: Number }, // 0-100
    
    // Overall Evaluation
    overallQualityScore: { type: Number, min: 0, max: 100 },
    detailedFeedback: [{ type: String }],
    improvementSuggestions: [{ type: String }],
    evaluatedAt: { type: Date }
  },
  
  // =====================================================================
  // PREMIUM FEATURE - Sentiment & Soft Skill Analysis
  // =====================================================================
  
  sentimentAnalysis: {
    confidence: { type: String }, // 'High', 'Medium', 'Low'
    confidenceScore: { type: Number, min: 0, max: 100 },
    pace: { type: String }, // 'Fast', 'Moderate', 'Slow'
    communicationClarity: { type: String }, // 'Clear', 'Moderate', 'Unclear'
    softSkills: {
      problemSolving: { type: Number, min: 0, max: 100 },
      adaptability: { type: Number, min: 0, max: 100 },
      teamwork: { type: Number, min: 0, max: 100 },
      leadership: { type: Number, min: 0, max: 100 },
      enthusiasm: { type: Number, min: 0, max: 100 }
    },
    sentimentTrend: { type: String }, // 'Positive', 'Neutral', 'Negative'
    fillerWordCount: { type: Number },
    fillerWordPercentage: { type: Number },
    keyObservations: [{ type: String }],
    improvementAreas: [{ type: String }],
    analyzedAt: { type: Date }
  },
  
  // =====================================================================
  // PREMIUM FEATURE - Vector Matching Results
  // =====================================================================
  
  vectorMatchingScore: {
    similarityScore: { type: Number, min: 0, max: 1 }, // Cosine similarity
    similarityPercentage: { type: Number, min: 0, max: 100 },
    matchQuality: { type: String }, // 'Excellent Match', 'Strong Match', etc.
    shouldNotify: { type: Boolean },
    vectorDimension: { type: Number },
    matchedAt: { type: Date }
  },
  
  // =====================================================================
  // IDENTITY VERIFICATION REQUIREMENTS
  // =====================================================================
  
  identityVerificationRequired: {
    type: Boolean,
    default: false // Recruiter can enable this per interview
  },
  
  identityVerificationCompleted: {
    type: Boolean,
    default: false
  },
  
  identityVerificationData: {
    verifiedAt: { type: Date },
    verificationMethod: { type: String },
    faceMatchScore: { type: Number },
    referenceSnapshot: { type: String }, // Photo taken during verification
    verificationIP: { type: String },
    verificationDevice: { type: String }
  },
  
  // =====================================================================
  // CANDIDATE APPLICATION PHOTO (Uploaded during application)
  // =====================================================================
  
  candidateApplicationPhoto: {
    type: String, // Base64 image uploaded when applying
    default: null
  },
  
  candidateApplicationPhotoUploadedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Interview', interviewSchema);
