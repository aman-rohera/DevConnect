import express from 'express';
import * as connectionController from './connection.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', connectionController.getMyConnections);
router.post('/request', connectionController.sendRequest);
router.get('/pending', connectionController.getPending);
router.put('/:connectionId/respond', connectionController.respond);

export default router;
