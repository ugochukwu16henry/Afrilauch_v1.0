import { Router } from 'express';
import { authMiddleware, requireRoles, optionalAuth } from '../middleware/auth';
import { formRateLimiter, verifyRecaptcha } from '../middleware/antispam';
import { UserRole } from '@prisma/client';
import * as talentController from '../controllers/talentController';

const router = Router();

// Public: list approved talents (marketplace)
router.get('/marketplace', talentController.marketplace);

// Apply: optional auth; rate limit + optional reCAPTCHA
router.post('/apply', formRateLimiter, verifyRecaptcha, optionalAuth, talentController.apply);

// Below: auth required
router.use(authMiddleware);

// Own profile
router.get('/profile', requireRoles(UserRole.talent), talentController.profile);
router.put('/profile', requireRoles(UserRole.talent), talentController.updateProfile);

// Super Admin / Co-Founder: list all talents, approve/reject
router.get('/', requireRoles(UserRole.super_admin, UserRole.cofounder), talentController.list);
router.post('/admin/create', requireRoles(UserRole.super_admin), talentController.adminCreate);
router.put('/:id/approve', requireRoles(UserRole.super_admin, UserRole.cofounder), talentController.approve);
router.patch('/:id', requireRoles(UserRole.super_admin, UserRole.cofounder), talentController.updateVisibility);

export const talentRoutes = router;
