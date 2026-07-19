import express from 'express';
import * as companyController from './company.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', companyController.create);
router.get('/slug/:slug', companyController.getBySlug);
router.get('/mine', companyController.getMine);
router.get('/:id', companyController.getById);
router.put('/:id', companyController.update);
router.post('/:id/follow', companyController.follow);
router.delete('/:id/follow', companyController.unfollow);
router.get('/:id/dashboard', companyController.getDashboard);
router.post('/:id/invites', companyController.invite);

export default router;
