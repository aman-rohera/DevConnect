import express from 'express';
import * as postController from './post.controller.js';
import { authenticateToken, optionalAuthenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.get('/feed', authenticateToken, postController.getFeed);
router.get('/:id', optionalAuthenticateToken, postController.getById);

router.use(authenticateToken);

router.post('/', postController.create);
router.post('/:id/like', postController.toggleLike);
router.post('/:id/share', postController.share);
router.post('/:id/comments', postController.createComment);
router.get('/:id/comments', postController.getComments);
router.get('/:id/reposters', postController.getReposters);
router.delete('/:id', postController.deleteOne);

export default router;
