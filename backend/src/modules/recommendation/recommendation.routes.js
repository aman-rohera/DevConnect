import { Router } from 'express';
import * as recommendationController from './recommendation.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// Get user recommendations based on skills
router.get('/', authenticateToken, recommendationController.getRecommendations);

// Manually trigger a sync (could also be called automatically when profile updates)
router.post('/sync', authenticateToken, recommendationController.syncProfileToNeo4j);

export default router;
