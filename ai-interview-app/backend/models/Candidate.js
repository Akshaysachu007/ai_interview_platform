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
    required: false // Optional, can be set later
  },
  // Notification preferences
  notificationsEnabled: { type: Boolean, default: true },
}, {
  timestamps: true // Adds createdAt and updatedAt
});

export default mongoose.model('Candidate', candidateSchema);
