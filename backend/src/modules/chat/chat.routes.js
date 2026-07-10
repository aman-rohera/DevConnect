import express from 'express';
import * as chatController from './chat.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/conversations', chatController.startConversation);
router.get('/conversations', chatController.getMyConversations);
router.post('/messages', chatController.sendMessage);
router.get('/conversations/:id/messages', chatController.getConversationMessages);

export default router;
