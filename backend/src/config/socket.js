import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;
const userSockets = new Map(); // userId -> Set of socketIds (supporting multiple tabs/devices)

/**
 * Initialize Socket.io server
 * @param {object} server - HTTP Server instance
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow React/Vite client connections
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('New WebSocket connection established:', socket.id);

    // Clients authenticate by sending their JWT token after connection
    socket.on('authenticate', (token) => {
      try {
        if (!token) return;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        socket.userId = userId;

        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);
        console.log(`User ${userId} authenticated on socket ${socket.id}`);
        socket.emit('authenticated', { success: true });
      } catch (err) {
        console.error('Socket authentication failed:', err.message);
        socket.emit('authenticated', { success: false, message: 'Invalid authentication token.' });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId && userSockets.has(socket.userId)) {
        const sockets = userSockets.get(socket.userId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(socket.userId);
        }
        console.log(`Socket ${socket.id} removed for user ${socket.userId}`);
      } else {
        console.log('Unauthenticated socket disconnected:', socket.id);
      }
    });
  });

  return io;
};

/**
 * Send real-time event to a specific user (if they are online)
 * @param {string} userId - Recipient user ID
 * @param {string} event - Event name
 * @param {any} data - Event payload
 * @returns {boolean} True if recipient has active sockets online
 */
const sendToUser = (userId, event, data) => {
  if (io && userSockets.has(userId)) {
    const sockets = userSockets.get(userId);
    for (const socketId of sockets) {
      io.to(socketId).emit(event, data);
    }
    return true;
  }
  return false;
};

export { initSocket, sendToUser };
