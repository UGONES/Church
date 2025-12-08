import express from 'express';
import passport from 'passport';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';
import { initChat } from './src/socket/chatSocket.mjs';
// import { startRtmp } from './rtmp-server.js';

import cloudinary from './src/config/cloudinary.mjs';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './src/config/db.mjs';
import { verifyEmailConnection } from './src/utils/emailService.mjs';
import rateLimiters from './src/middleware/rateLimit.mjs';
import errorHandler from './src/middleware/errorHandlers.mjs';
import { dbHealthCheck } from './src/middleware/validation.mjs';

// Routes
import analyticsRoutes from './src/routes/analytics.mjs';
import authRoutes from './src/routes/auth.mjs';
import userRoutes from './src/routes/users.mjs';
import eventRoutes from './src/routes/events.mjs';
import sermonRoutes from './src/routes/sermons.mjs';
import donationRoutes from './src/routes/donations.mjs';
import prayerRoutes from './src/routes/prayers.mjs';
import testimonialRoutes from './src/routes/testimonials.mjs';
import ministryRoutes from './src/routes/ministries.mjs';
import volunteerRoutes from './src/routes/volunteers.mjs';
import blogRoutes from './src/routes/blogs.mjs';
import adminRoutes from './src/routes/admin.mjs';
import settingsRoutes from './src/routes/settings.mjs';
import webhookRoutes from './src/routes/webhooks.mjs';
import socialAuthRoutes from './src/routes/socialAuth.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './src/.env') });

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
app.use(rateLimiters.generalLimiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use(express.static(path.resolve(__dirname, 'public')));

// Favicon handler
app.get('/favicon.ico', (_req, res) => {
  const faviconPath = path.join(__dirname, 'public', 'church-logo.png');

  if (fs.existsSync(faviconPath)) {
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400'
    });
    res.sendFile(faviconPath);
  } else {
    res.status(204).end();
  }
});

app.use((req, _res, next) => {
  console.log(`📥 [${req.method}] ${req.url}`);
  next();
});

// Database connection
connectDB();

// Root routes
app.get('/', (_req, res) => res.json({
  message: '🚀 Church API Server is running!', status: 'OK ✅', timestamp: new Date().toISOString()
}));

app.get('/health', (_req, res) => res.status(200).json({
  status: 'OK', message: 'Server is running', timestamp: new Date().toISOString()
}));

app.use('/api', dbHealthCheck);

app.get('/api/stream-status', (_req, res) => res.status(200).json({
  status: 'RTMP server is running', port: 8000, timestamp: new Date().toISOString()
}));


// Use routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sermons', sermonRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/prayers', prayerRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/ministries', ministryRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/auth/social', socialAuthRoutes);

// Catch-all for missing routes
app.use((req, res, _next) => {
  console.warn(`🚫 Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found", path: req.originalUrl, method: req.method });
});

// Error handling middleware
app.use(errorHandler);

// Create HTTP server and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize Socket.IO chat
initChat(io, { jwtSecret: process.env.JWT_SECRET });

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Verify email connection
    const emailConnected = await verifyEmailConnection();
    if (!emailConnected) {
      console.warn('⚠️  Email service not configured. Verification emails will not be sent.');
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port http://localhost:${PORT}`);
      console.log(`📡 Socket.IO server running on ws://localhost:${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/api-docs`);
      if (emailConnected) {
        console.log('✅ Email service: Ready to send verification emails');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

app.set('io', io);

// console.log('🚀 Starting RTMP Server from dedicated starter...');
// startRtmp().catch(error => {
//   console.error('💥 Fatal error:', error);
//   process.exit(1);
// });

startServer();

export default app;