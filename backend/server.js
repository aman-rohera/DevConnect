import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import './src/config/db.js';
import { initSocket } from './src/config/socket.js';
import errorHandler from './src/middleware/error.js';

// Route Imports
import authRoutes from './src/modules/auth/auth.routes.js';
import profileRoutes from './src/modules/profile/profile.routes.js';
import recommendationRoutes from './src/modules/recommendation/recommendation.routes.js';
import connectionRoutes from './src/modules/connection/connection.routes.js';
import postRoutes from './src/modules/post/post.routes.js';
import companyRoutes from './src/modules/company/company.routes.js';
import jobRoutes from './src/modules/job/job.routes.js';
import chatRoutes from './src/modules/chat/chat.routes.js';
import notificationRoutes from './src/modules/notification/notification.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
initSocket(server);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Mount Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

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
  server.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export { server };
export default app;
