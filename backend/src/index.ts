import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import alertsRouter from './routes/alerts';
import riskRouter from './routes/risk';
import notificationsRouter from './routes/notifications';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — allow Expo web and mobile clients
app.use(cors({
  origin: [
    'http://localhost:8081',  // Expo web dev
    'http://localhost:19006', // Expo web alternate
    'exp://*',                // Expo Go
    /^https:\/\/.*\.anchor\.app$/,
  ],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const checkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // limit alert checks to 10/min per IP
  message: { error: 'Too many alert checks. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Routes
app.use('/api/alerts', checkLimiter, alertsRouter);
app.use('/api/risk', riskRouter);
app.use('/api/notifications', notificationsRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Anchor API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY not set — AI alert generation will be skipped');
  }
});

export default app;
