import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  skills: { type: [String], default: [] },
  bio: { type: String },
  avatar: { type: String },
  completed: { type: Boolean, default: false },
  // Stream selection for receiving relevant interview notifications
  stream: {
    type: String,
    enum: ['Computer Science', 'Information Technology', 'Mechanical Engineering', 
           'Electrical Engineering', 'Civil Engineering', 'Business Management', 
           'Marketing', 'Finance', 'Data Science', 'AI/ML'],
    required: false 
  },
 
  notificationsEnabled: { type: Boolean, default: true },
  
 
  resumeText: { type: String }, 
  resumeUrl: { type: String }, 
  
  // Extracted Personal Details
  personalDetails: {
    fullName: { type: String },
    linkedinUrl: { type: String },
    location: { type: String },
    phone: { type: String }
  },
  
  // Work Experience
  workExperience: [{
    company: { type: String },
    role: { type: String },
    duration: { type: String },
    description: { type: String }
  }],
  
  // Education
  education: [{
    institution: { type: String },
    degree: { type: String },
    field: { type: String },
    year: { type: String }
  }],
  
  // Certifications
  certifications: [{ type: String }],
  
  // Enhanced Skills categorization
  extractedSkills: {
    hardSkills: [{ type: String }], // Technical skills
    softSkills: [{ type: String }]  // Soft skills
  },
  
  // Profile completeness tracking
  profileCompleteness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Last resume update
  lastResumeUpdate: { type: Date },
  
  // AI-generated profile insights
  profileSummary: { type: String },
  
  // =====================================================================
  // IDENTITY VERIFICATION
  // =====================================================================
  identityVerification: {
    isVerified: { type: Boolean, default: false },
    verificationMethod: {
      type: String,
      enum: ['none', 'photo_id', 'face_match', 'government_id', 'live_photo'],
      default: 'none'
    },
    verifiedAt: { type: Date },
    
    // Store reference photo for face matching
    referencePhoto: { type: String }, // Base64 image
    
    // ID Document verification
    idDocument: {
      type: { type: String }, // 'passport', 'drivers_license', 'national_id'
      documentNumber: { type: String },
      documentImage: { type: String }, // Base64 or URL
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date }
    },
    
    // Face match score (if using face recognition)
    faceMatchScore: { type: Number, min: 0, max: 100 },
    
    // Verification attempts and history
    verificationAttempts: [{
      attemptedAt: { type: Date },
      method: { type: String },
      success: { type: Boolean },
      failureReason: { type: String },
      matchScore: { type: Number }
    }],
    
    // Additional security
    verificationIP: { type: String },
    verificationDevice: { type: String },
    
    // Manual verification by admin/recruiter
    manuallyVerified: { type: Boolean, default: false },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'verifiedByModel'
    },
    verifiedByModel: {
      type: String,
      enum: ['Admin', 'Recruiter']
    },
    verificationNotes: { type: String }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// =====================================================================
// INDEXES FOR PERFORMANCE
// =====================================================================
candidateSchema.index({ email: 1 });
candidateSchema.index({ stream: 1 });
candidateSchema.index({ 'extractedSkills.hardSkills': 1 });
candidateSchema.index({ profileCompleteness: -1 });

export default mongoose.model('Candidate', candidateSchema);
