import prisma from '../../config/db.js';
import { sendToUser } from '../../config/socket.js';

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

  return notification;
};

const getNotifications = async (userId) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

const markAsRead = async (notificationId, userId) => {
  return prisma.notification.update({
    where: { 
      id: notificationId,
      userId // Ensure security: user can only mark their own notifications as read
    },
    data: { isRead: true }
  });
};

const getUnreadCount = async (userId) => {
  const count = await prisma.notification.count({
    where: { 
      userId,
      isRead: false
    }
  });
  return { count };
};

export { createNotification, getNotifications, markAsRead, getUnreadCount };
