import express from 'express';
import cors from 'cors';
import './src/config/db.js';
import dotenv from 'dotenv';
import authRoutes from './src/modules/auth/auth.routes.js';
import profileRoutes from './src/modules/profile/profile.routes.js';
import recommendationRoutes from './src/modules/recommendation/recommendation.routes.js';
import connectionRoutes from './src/modules/connection/connection.routes.js';
import postRoutes from './src/modules/post/post.routes.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());          // Enables Cross-Origin Resource Sharing (allows React frontend to connect)
app.use(express.json());  // Parses incoming request bodies containing JSON data

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
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
