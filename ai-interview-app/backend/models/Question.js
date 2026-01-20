import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  stream: {
    type: String,
    required: true,
    enum: ['Computer Science', 'Information Technology', 'Mechanical Engineering', 
           'Electrical Engineering', 'Civil Engineering', 'Business Management', 
           'Marketing', 'Finance', 'Data Science', 'AI/ML']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  question: {
    type: String,
    required: true
  },
  category: String, // e.g., 'Programming', 'Database', 'Networking', 'Theory'
  keywords: [String],
  isAiGenerated: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

questionSchema.index({ stream: 1, difficulty: 1 });

export default mongoose.model('Question', questionSchema);
