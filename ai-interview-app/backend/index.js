// Log unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import candidateRoutes from './routes/candidate.js';
import recruiterRoutes from './routes/recruiter.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import interviewRoutes from './routes/interview.js';
import notificationRoutes from './routes/notification.js';
import Admin from './models/Admin.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/candidate', candidateRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/notifications', notificationRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Create default admin account
const createDefaultAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin@gmail.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await Admin.create({
        name: 'System Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'superadmin'
      });
      console.log('✓ Default admin account created (admin@gmail.com / admin)');
    } else {
      console.log('✓ Default admin account already exists');
    }
  } catch (err) {
    console.error('Error creating default admin:', err);
  }
};

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✓ MongoDB connected successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
    await createDefaultAdmin();
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));
