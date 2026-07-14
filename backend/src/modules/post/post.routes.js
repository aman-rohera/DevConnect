import express from 'express';
import * as postController from './post.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', postController.create);
router.get('/feed', postController.getFeed);
router.post('/:id/like', postController.toggleLike);
router.post('/:id/share', postController.share);
router.post('/:id/comments', postController.createComment);
router.get('/:id/comments', postController.getComments);
router.delete('/:id', postController.deleteOne);

export default router;
