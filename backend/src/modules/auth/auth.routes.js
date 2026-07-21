import express from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticateToken, authController.logoutAll);
router.post('/refresh', authController.refresh);
router.get('/me', authenticateToken, authController.getMe);

// Password recovery helper endpoints
// Diagnostic live email test endpoint
router.get('/test-email-live', authController.testEmailLive);

export default router;
