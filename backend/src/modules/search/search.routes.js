import express from 'express';
import * as searchController from './search.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { userSearchSchema } from './search.validator.js';

const router = express.Router();

// Only authenticated users can search
router.use(authenticateToken);

router.get('/users', validate(userSearchSchema), searchController.searchUsers);

export default router;
