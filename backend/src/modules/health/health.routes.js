import express from 'express';
import { getHealth, cronPing, getFullHealthCheck, getSimpleOkHealth } from './health.controller.js';

const router = express.Router();

// Simple lightweight 5-min cron ping route (returns plain "OK" or { status: "ok" })
router.get('/quick', getSimpleOkHealth);
router.get('/ok', getSimpleOkHealth);

// Detailed Health Check (GET /api/health)
router.get('/', getHealth);
router.get('/status', getHealth);

// Comprehensive Full Diagnostic Check (GET /api/health/full, /api/health/full-check)
router.get('/full', getFullHealthCheck);
router.get('/full-check', getFullHealthCheck);
router.get('/all', getFullHealthCheck);

// Cron Job Maintenance Ping & Keep-Alive endpoints
router.get('/cron', cronPing);
router.get('/ping', cronPing);
router.get('/keep-alive', cronPing);

export default router;
