import express from 'express';
import * as postController from './post.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', postController.create);
router.get('/feed', postController.getFeed);

export default router;
