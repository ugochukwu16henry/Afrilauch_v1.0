import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authMiddleware, requireSuperAdmin, requireRoles } from '../middleware/auth';
import * as superAdminController from '../controllers/superAdminController';
import * as adminSkillsController from '../controllers/adminSkillsController';
import * as emailLogsController from '../controllers/emailLogsController';
import * as equityController from '../controllers/equityController';
import * as businessModuleController from '../controllers/businessModuleController';
import * as featureController from '../controllers/featureController';
import * as adminMessagesController from '../controllers/adminMessagesController';
import * as financeController from '../controllers/financeController';
import * as systemHealthController from '../controllers/systemHealthController';

const router = Router();

router.use(authMiddleware);

// Finance dashboard & tax export — Super Admin and finance_admin (must be before requireSuperAdmin)
router.get('/finance/summary', requireRoles(UserRole.super_admin, UserRole.finance_admin), financeController.summary);
router.get('/finance/tax-summary', requireRoles(UserRole.super_admin, UserRole.finance_admin), financeController.taxSummary);

router.use(requireSuperAdmin);

router.get('/overview', superAdminController.overview);
router.get('/system-health', systemHealthController.health);
router.get('/payments', superAdminController.payments);
router.get('/activity', superAdminController.activity);
router.get('/audit-logs', superAdminController.auditLogs);
router.get('/reports', superAdminController.reports);
router.get('/consultations', superAdminController.consultations);
router.get('/messages', adminMessagesController.list);
router.patch('/messages/:id', adminMessagesController.updateStatus);

// Per-user feature unlock overview (Super Admin only).
router.get('/users/:userId/features', featureController.adminUserFeatures);

// Email logs (view + resend)
router.get('/email-logs', emailLogsController.list);
router.post('/email-logs/:id/resend', emailLogsController.resend);

// Skill management (dynamic skills for talent forms and marketplace filters)
router.get('/skills', adminSkillsController.list);
router.post('/skills', adminSkillsController.create);
router.put('/skills/:id', adminSkillsController.update);
router.delete('/skills/:id', adminSkillsController.remove);

// Company equity (platform cap table)
router.get('/equity/company', equityController.listCompany);
router.post('/equity/company', equityController.createCompany);
router.put('/equity/company/:id', equityController.updateCompany);
router.delete('/equity/company/:id', equityController.deleteCompany);

// Startup equity (per startup cap table)
router.get('/equity/startup/:startupId', equityController.listStartup);
router.post('/equity/startup/:startupId', equityController.createStartup);
router.put('/equity/startup/:startupId/:id', equityController.updateStartup);
router.delete('/equity/startup/:startupId/:id', equityController.deleteStartup);

// Business module audit (per-startup business performance overview)
router.get('/business/:startupId', businessModuleController.adminOverview);

export { router as superAdminRoutes };
