import express from 'express';
import * as controller from './admin.controller.js';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as schemas from './admin.validation.js';

const router = express.Router();

// Apply auth and admin check to all routes in this module
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

// Dashboard
router.get('/dashboard-stats', controller.getDashboardStats);

// Users
router.get('/users', validate(schemas.paginationSchema), controller.getUsers);
router.get('/users/:id', validate(schemas.paramIdSchema), controller.getUserById);
router.put('/users/:id', validate(schemas.updateUserSchema), controller.updateUser);
router.delete('/users/:id', validate(schemas.paramIdSchema), controller.deleteUser);

// Company Requests
router.get('/company-requests', validate(schemas.paginationSchema), controller.getCompanyRequests);
router.get('/company-requests/:id', validate(schemas.paramIdSchema), controller.getCompanyRequestById);
router.put('/company-requests/:id/approve', validate(schemas.paramIdSchema), controller.approveCompanyRequest);
router.put('/company-requests/:id/reject', validate(schemas.rejectCompanyRequestSchema), controller.rejectCompanyRequest);

// Companies
router.get('/companies', validate(schemas.paginationSchema), controller.getCompanies);
router.get('/companies/:id', validate(schemas.paramIdSchema), controller.getCompanyById);
router.put('/companies/:id/suspend', validate(schemas.suspendCompanySchema), controller.updateCompanyStatus);
router.delete('/companies/:id', validate(schemas.paramIdSchema), controller.deleteCompany);

// Jobs
router.get('/jobs', validate(schemas.paginationSchema), controller.getJobs);
router.put('/jobs/:id/suspend', validate(schemas.suspendJobSchema), controller.updateJobStatus);
router.delete('/jobs/:id', validate(schemas.paramIdSchema), controller.deleteJob);

// Posts
router.get('/posts', validate(schemas.paginationSchema), controller.getPosts);
router.delete('/posts/:id', validate(schemas.paramIdSchema), controller.deletePost);

// Reports
router.get('/reports', validate(schemas.paginationSchema), controller.getReports);
router.get('/reports/:id', validate(schemas.paramIdSchema), controller.getReportById);
router.put('/reports/:id/resolve', validate(schemas.paramIdSchema), controller.resolveReport);
router.put('/reports/:id/reject', validate(schemas.paramIdSchema), controller.rejectReport);

export default router;
