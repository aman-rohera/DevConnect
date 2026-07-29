import prisma from '../../config/db.js';
import { sendToUser } from '../../config/socket.js';
import cache from '../../config/cache.js';

const createNotification = async (userId, type, content) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      content,
      isRead: false
    }
  });

  // Push real-time notification via WebSockets
  sendToUser(userId, 'new_notification', notification);

  await cache.del(`notification:unread:${userId}`);
  return notification;
};

const getNotifications = async (userId) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

const markAsRead = async (notificationId, userId) => {
  const result = await prisma.notification.update({
    where: { 
      id: notificationId,
      userId // Ensure security: user can only mark their own notifications as read
    },
    data: { isRead: true }
  });

  await cache.del(`notification:unread:${userId}`);
  return result;
};

const getUnreadCount = async (userId) => {
  const cacheKey = `notification:unread:${userId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const count = await prisma.notification.count({
    where: { 
      userId,
      isRead: false
    }
  });
  
  const result = { count };
  await cache.set(cacheKey, result, 60); // Cache for 60 seconds
  return result;
};

const markAllAsRead = async (userId) => {
  const result = await prisma.notification.updateMany({
    where: { 
      userId,
      isRead: false
    },
    data: { isRead: true }
  });

  await cache.del(`notification:unread:${userId}`);
  return result;
};

export { createNotification, getNotifications, markAsRead, getUnreadCount, markAllAsRead };
