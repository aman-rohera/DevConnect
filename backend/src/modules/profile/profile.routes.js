import express from 'express';
import * as profileController from './profile.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema, getProfileByIdSchema } from './profile.validation.js';

const router = express.Router();

// All profile endpoints are protected by authentication token verification
router.get('/me', authenticateToken, profileController.getOwnProfile);
router.put('/update', authenticateToken, validate(updateProfileSchema), profileController.updateOwnProfile);
router.get('/username/:username', authenticateToken, profileController.getByUsername);
router.get('/:id', authenticateToken, validate(getProfileByIdSchema), profileController.getProfileById);

export default router;
