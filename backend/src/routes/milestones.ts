import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, requireRoles, requireSuperAdmin } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as milestoneController from '../controllers/milestoneController';
import * as milestonePaymentController from '../controllers/milestonePaymentController';

const router = Router();

router.use(authMiddleware);

router.post(
  '/:id/payments/create-session',
  [param('id').isUUID(), body('paymentMethod').optional().isIn(['auto', 'stripe', 'paystack', 'bank_transfer', 'other', 'card'])],
  requireRoles(UserRole.client),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return milestonePaymentController.createMilestonePaymentSession(req, res);
  }
);

router.post(
  '/payments/:paymentId/submit-proof',
  [param('paymentId').isUUID(), body('proofOfPaymentUrl').trim().notEmpty(), body('transferReference').trim().notEmpty()],
  requireRoles(UserRole.client),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return milestonePaymentController.submitBankTransferProof(req, res);
  }
);

router.post(
  '/payments/:paymentId/verify',
  [param('paymentId').isUUID()],
  requireRoles(UserRole.client),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return milestonePaymentController.verifyMilestonePayment(req, res);
  }
);

router.get('/admin/payments', requireSuperAdmin, (req, res) => milestonePaymentController.listAdminMilestonePayments(req, res));

router.post('/admin/payments/:paymentId/approve', [param('paymentId').isUUID(), body('note').optional().trim()], requireSuperAdmin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return milestonePaymentController.approveMilestonePayment(req, res);
});

router.post('/admin/payments/:paymentId/reject', [param('paymentId').isUUID(), body('reason').trim().notEmpty()], requireSuperAdmin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return milestonePaymentController.rejectMilestonePayment(req, res);
});

// PUT /api/v1/milestones/:id
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('currency').optional().trim().isLength({ min: 3, max: 6 }),
    body('sequence').optional().isInt({ min: 1 }),
    body('status').optional().isIn(['Pending', 'InProgress', 'Completed', 'pending', 'paid', 'overdue']),
    body('dueDate').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return milestoneController.updateMilestone(req, res);
  }
);

// DELETE /api/v1/milestones/:id
router.delete(
  '/:id',
  [param('id').isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return milestoneController.deleteMilestone(req, res);
  }
);

export { router as milestoneRoutes };
