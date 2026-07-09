import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import './src/config/db.js';
import dotenv from 'dotenv';
import authRoutes from './src/modules/auth/auth.routes.js';
import profileRoutes from './src/modules/profile/profile.routes.js';
import recommendationRoutes from './src/modules/recommendation/recommendation.routes.js';
import connectionRoutes from './src/modules/connection/connection.routes.js';
import postRoutes from './src/modules/post/post.routes.js';
import errorHandler from './src/middleware/error.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());        // Security headers
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean),
  credentials: true,      // Allow cookies
}));
app.use(express.json());  // Parses JSON data
app.use(cookieParser());  // Parse Cookie header and populate req.cookies
app.use(compression());   // Compress response bodies

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// Mount Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/posts', postRoutes);

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'Server is healthy and running',
    timestamp: new Date()
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
