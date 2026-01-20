import mongoose from 'mongoose';

const recruiterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  companyName: { type: String },
  companyWebsite: { type: String },
  industry: { type: String },
  companySize: { type: String },
  location: { type: String },
  bio: { type: String },
  logo: { type: String },
  verified: { type: Boolean, default: false },
  subscriptionPlan: { type: String, enum: ['none', 'weekly', 'monthly'], default: 'none' },
  subscriptionExpiry: { type: Date },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Recruiter', recruiterSchema);
