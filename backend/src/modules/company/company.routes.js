import express from 'express';
import * as companyController from './company.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', companyController.create);
router.get('/:id', companyController.getById);
router.put('/:id', companyController.update);
router.post('/:id/follow', companyController.follow);
router.delete('/:id/follow', companyController.unfollow);

export default router;
