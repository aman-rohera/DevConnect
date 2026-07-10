import express from 'express';
import * as controller from './company-request.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createCompanyRequestSchema } from './company-request.validation.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', validate(createCompanyRequestSchema), controller.createRequest);
router.get('/me', controller.getMyRequests);

export default router;
