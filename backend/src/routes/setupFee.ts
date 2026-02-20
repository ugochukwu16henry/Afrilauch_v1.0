import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import * as setupFeeController from '../controllers/setupFeeController';

const router = Router();

// GET /api/v1/setup-fee/config — public: centralized pricing config (no auth)
router.get('/config', (req, res) => setupFeeController.config(req, res));

// GET /api/v1/setup-fee/quote?currency=NGN — optional auth (uses role for amount: investor $10, else $7)
router.get('/quote', optionalAuth, (req, res) => setupFeeController.quote(req, res));

// POST /api/v1/setup-fee/create-session — auth required
router.post(
  '/create-session',
  authMiddleware,
  [
    body('currency').optional().trim().isLength({ max: 6 }),
    body('paymentMethod').optional().isIn(['auto', 'stripe', 'paystack', 'bank_transfer', 'other']),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return setupFeeController.createSession(req, res);
  }
);

// POST /api/v1/setup-fee/verify — auth required
router.post(
  '/verify',
  authMiddleware,
  [body('reference').trim().notEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return setupFeeController.verify(req, res);
  }
);

// PUT /api/v1/setup-fee/skip — auth required
router.put(
  '/skip',
  authMiddleware,
  [body('reason').isIn(['cant_afford', 'pay_later', 'exploring', 'other'])],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return setupFeeController.skip(req, res);
  }
);

export { router as setupFeeRoutes };
