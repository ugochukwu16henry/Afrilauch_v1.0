import { Router } from 'express';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as financeController from '../controllers/financeController';

const router = Router();

router.use(authMiddleware);
router.use(requireRoles(UserRole.super_admin, UserRole.finance_admin));

router.get('/summary', financeController.summary);
router.get('/tax-summary', financeController.taxSummary);

export { router as financeRoutes };
