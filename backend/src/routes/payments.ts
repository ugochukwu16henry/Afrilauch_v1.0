import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { getPaymentConfig } from '../config/paymentConfig';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/payments/options — global payment methods, currencies, bank accounts
router.get('/options', (_req: Request, res: Response) => {
  const config = getPaymentConfig();
  res.json({
    methods: config.methods,
    currencies: config.supportedCurrencies,
    bankAccounts: config.bankAccounts,
    transferLink: config.transferLink,
  });
});

router.use(authMiddleware);

// POST /api/v1/payments/create — Stub: create payment intent (integrate Stripe/Flutterwave later)
router.post(
  '/create',
  [body('projectId').isUUID(), body('amount').isFloat({ min: 0 }), body('currency').optional().isIn(['USD', 'NGN', 'EUR', 'GBP']), body('type').optional().isIn(['setup', 'milestone', 'subscription'])],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { projectId, amount, currency = 'USD', type = 'milestone' } = req.body;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    // Stub: create payment record and return mock reference
    const payment = await prisma.payment.create({
      data: { projectId, amount, status: 'Pending', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    res.status(201).json({
      paymentId: payment.id,
      amount,
      currency,
      type,
      status: 'Pending',
      message: 'Payment intent created (stub). Integrate Stripe/Flutterwave for real processing.',
    });
  }
);

// POST /api/v1/payments/verify — Stub: verify payment (webhook simulation)
router.post(
  '/verify',
  requireRoles(UserRole.super_admin, UserRole.finance_admin),
  [body('paymentId').isUUID(), body('reference').optional().trim()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { paymentId } = req.body;
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    await prisma.payment.update({ where: { id: paymentId }, data: { status: 'Paid' } });
    res.json({ paymentId, status: 'Paid', message: 'Payment verified (stub).' });
  }
);

// GET /api/v1/projects/:id/payments — List payments for project (mount under projects or here)
// For simplicity we add GET /payments?projectId= here
router.get('/', async (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  if (!projectId) return res.status(400).json({ error: 'projectId query required' });
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { client: true } });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const isAdmin = ['super_admin', 'project_manager', 'finance_admin'].includes(payload.role);
  if (!isAdmin && project.client.userId !== payload.userId) return res.status(403).json({ error: 'Cannot view this project payments' });
  const payments = await prisma.payment.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } });
  res.json(payments);
});

export { router as paymentRoutes };
