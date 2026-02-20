import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import * as donationController from '../controllers/donationController';

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

export { router as donationRoutes };
