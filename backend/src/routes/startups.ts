import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, requireRoles, requireSetupPaid } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as startupController from '../controllers/startupController';
import * as startupScoreController from '../controllers/startupScoreController';

const router = Router();

// GET /api/v1/startups — List all startup profiles (admin only); must be before /:id
router.get('/', authMiddleware, (req, res) => startupController.listAll(req, res));

// GET /api/v1/startups/me — Client: my startup profiles; admin: same as list
router.get('/me', authMiddleware, (req, res) => startupController.listMine(req, res));

// POST /api/v1/startups/publish — Client or admin: create/update startup profile (requires setup_paid for client)
router.post(
  '/publish',
  authMiddleware,
  requireSetupPaid,
  [
    body('projectId').isUUID(),
    body('pitchSummary').trim().notEmpty(),
    body('tractionMetrics').optional().trim(),
    body('fundingNeeded').isFloat({ min: 0 }),
    body('equityOffer').optional().isFloat({ min: 0, max: 100 }),
    body('stage').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return startupController.publish(req, res);
  }
);

// POST /api/v1/startups/admin/create — Super Admin direct add to marketplace
router.post(
  '/admin/create',
  authMiddleware,
  requireRoles(UserRole.super_admin),
  [
    body('founderName').trim().notEmpty(),
    body('founderEmail').isEmail(),
    body('businessName').trim().notEmpty(),
    body('projectName').trim().notEmpty(),
    body('pitchSummary').trim().notEmpty(),
    body('fundingNeeded').isFloat({ min: 0 }),
    body('equityOffer').optional().isFloat({ min: 0, max: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return startupController.adminCreate(req, res);
  }
);

// GET /api/v1/startups/marketplace — List approved startups; query: industry, stage, fundingMin, fundingMax
router.get('/marketplace', (req, res) => startupController.marketplace(req, res));

// GET /api/v1/startups/:id — Get startup by StartupProfile id
router.get('/:id', (req, res) => startupController.getById(req, res));

// Startup scoring
router.get('/:id/score', authMiddleware, (req, res) => startupScoreController.getScore(req, res));
router.post('/:id/score/recalculate', authMiddleware, (req, res) => startupScoreController.recalculate(req, res));

// PUT /api/v1/startups/:id/approve — Admin approve visibility
router.put(
  '/:id/approve',
  authMiddleware,
  requireRoles(UserRole.super_admin, UserRole.project_manager),
  [param('id').isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return startupController.approve(req, res);
  }
);

export { router as startupRoutes };
