import express from 'express';
import * as notificationController from './notification.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllRead);
router.put('/:id/read', notificationController.markRead);

export default router;
