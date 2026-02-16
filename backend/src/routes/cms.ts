import { Router } from 'express';
import { authMiddleware, requireSuperAdmin, requireRoles, optionalAuth } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as cmsController from '../controllers/cmsController';
import * as revenueSystemController from '../controllers/revenueSystemController';

const router = Router();

// Public read (no auth)
router.get('/page/:pageName', cmsController.getByPage);

// Revenue System control panel (Super Admin + Cofounder) — must be before /:key
const requireRevenueEditor = requireRoles(UserRole.super_admin, UserRole.cofounder);
router.get('/revenue-system', authMiddleware, requireRevenueEditor, revenueSystemController.getRevenueSystem);
router.put('/revenue-system/draft', authMiddleware, requireRevenueEditor, revenueSystemController.saveDraft);
router.post('/revenue-system/publish', authMiddleware, requireRevenueEditor, revenueSystemController.publish);
router.get('/revenue-system/history', authMiddleware, requireRevenueEditor, revenueSystemController.getHistory);
router.post('/revenue-system/restore/:id', authMiddleware, requireRevenueEditor, revenueSystemController.restoreVersion);

// Track Revenue Model section view (optional auth — log userId when present)
router.post('/revenue-model-view', optionalAuth, cmsController.trackRevenueModelView);

router.get('/:key', cmsController.getByKey);

// Super Admin write
router.post('/', authMiddleware, requireSuperAdmin, cmsController.create);
router.put('/page/:pageName', authMiddleware, requireSuperAdmin, cmsController.bulkUpdatePage);
router.put('/:key', authMiddleware, requireSuperAdmin, cmsController.update);
router.delete('/:key', authMiddleware, requireSuperAdmin, cmsController.remove);

export { router as cmsRoutes };
