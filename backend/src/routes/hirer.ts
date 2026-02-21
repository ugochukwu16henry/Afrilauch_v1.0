import { Router } from 'express';
import { authMiddleware, requireRoles, optionalAuth } from '../middleware/auth';
import { formRateLimiter, verifyRecaptcha } from '../middleware/antispam';
import { UserRole } from '@prisma/client';
import * as hirerController from '../controllers/hirerController';

const router = Router();

// Register: rate limit + optional reCAPTCHA, then optional auth
router.post('/register', formRateLimiter, verifyRecaptcha, optionalAuth, hirerController.register);

router.use(authMiddleware);

// Own profile
router.get('/profile', requireRoles(UserRole.hirer, UserRole.hiring_company), hirerController.profile);

// Hirer: sign Fair Treatment Agreement
router.post('/fair-treatment/sign', requireRoles(UserRole.hirer, UserRole.hiring_company), hirerController.signFairTreatment);

// Super Admin / Co-Founder: list all hirers (individuals/companies)
router.get('/', requireRoles(UserRole.super_admin, UserRole.cofounder), hirerController.list);

export const hirerRoutes = router;
