import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import recordRoutes from './routes/records.js';
import referralRoutes from './routes/referrals.js';
import teleconRoutes from './routes/telecon.js';
import medicineRoutes from './routes/medicines.js';
import analyticsRoutes from './routes/analytics.js';
import followupRoutes from './routes/followups.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Swasthya Setu Healthcare API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/teleconsultations', teleconRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve static frontend in production if built
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Serve frontend index for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Swasthya Setu API server is running on port ' + PORT);
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 SWASTHYA SETU API Server running on port ${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Demo Auth: http://localhost:${PORT}/api/auth/demo-credentials`);
  console.log(`=================================================`);
});
