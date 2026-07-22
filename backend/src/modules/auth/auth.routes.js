import express from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema
} from './auth.validation.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticateToken, authController.logoutAll);
router.post('/refresh', authController.refresh);
router.get('/me', authenticateToken, authController.getMe);

// Password recovery OTP endpoints
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Diagnostic live email test endpoint
router.get('/test-email-live', authController.testEmailLive);

export default router;

