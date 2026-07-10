import express from 'express';
import * as jobController from './job.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', jobController.create);
router.get('/', jobController.list);
router.get('/saved', jobController.getSaved);
router.post('/:id/save', jobController.save);
router.post('/:id/apply', jobController.apply);
router.get('/:id/applications', jobController.listApplications);

export default router;
