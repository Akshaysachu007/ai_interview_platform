import mongoose from 'mongoose';

const systemLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  targetUser: { type: mongoose.Schema.Types.ObjectId },
  targetUserType: { type: String, enum: ['candidate', 'recruiter', 'admin'] },
  details: { type: String },
  ipAddress: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model('SystemLog', systemLogSchema);
