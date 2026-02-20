import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import * as donationController from '../controllers/donationController';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.post(
  '/create-session',
  [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero'),
    body('paymentMethod').isIn(['card', 'paystack', 'bank_transfer']),
    body('currency').optional().trim().isLength({ min: 3, max: 6 }),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return donationController.createSession(req, res);
  }
);

router.post('/verify', [body('reference').trim().notEmpty()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return donationController.verify(req, res);
});

router.get('/admin/bank-transfers', authMiddleware, requireSuperAdmin, (req, res) => {
  return donationController.listBankTransferDonations(req, res);
});

router.post(
  '/admin/bank-transfers/:id/confirm',
  authMiddleware,
  requireSuperAdmin,
  [body('note').optional().isString().isLength({ max: 500 })],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return donationController.confirmBankTransferDonation(req, res);
  }
);

export { router as donationRoutes };
