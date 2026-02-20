import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import type { AuthPayload } from '../middleware/auth';
import { getPaymentConfig } from '../config/paymentConfig';
import { createUnifiedCheckoutSession, type UnifiedPaymentMethod } from '../services/unifiedPaymentService';
import { notify } from '../services/notificationService';

const prisma = new PrismaClient() as any;

const STARTED_PROJECT_STATUSES = ['Development', 'Testing', 'Live', 'Maintenance'];

function normalizeMethod(value: string | undefined): UnifiedPaymentMethod {
  const method = (value || 'auto').trim().toLowerCase();
  if (method === 'card') return 'stripe';
  if (method === 'stripe' || method === 'paystack' || method === 'bank_transfer' || method === 'other') return method;
  return 'auto';
}

async function getClientProject(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      client: {
        userId,
      },
    },
    include: {
      client: {
        include: {
          user: { select: { id: true, email: true, role: true } },
        },
      },
    },
  });
}

async function ensureClientMilestoneEligibility(projectId: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  const project = await getClientProject(projectId, userId);
  if (!project) {
    return { ok: false, error: 'Project not found for this client' };
  }

  if ((project.submissionStatus || '').toLowerCase() !== 'approved') {
    return { ok: false, error: 'Project must be approved before milestone payments are enabled' };
  }

  if (!STARTED_PROJECT_STATUSES.includes(project.status)) {
    return { ok: false, error: 'Project must be started before milestone payments are enabled' };
  }

  const [signedAgreements, consultations] = await Promise.all([
    prisma.assignedAgreement.count({
      where: { userId, status: 'Signed' },
    }),
    prisma.consultationBooking.count({
      where: { email: project.client.user.email },
    }),
  ]);

  if (signedAgreements === 0) {
    return { ok: false, error: 'Signed agreement is required before milestone payments' };
  }

  if (consultations === 0) {
    return { ok: false, error: 'Consultation booking is required before milestone payments' };
  }

  return { ok: true };
}

async function getMilestoneLock(projectId: string, milestoneId: string) {
  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    orderBy: [{ sequence: 'asc' }, { dueDate: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, billingStatus: true },
  });

  const firstOpen = milestones.find((milestone) => milestone.billingStatus !== 'paid');
  if (!firstOpen) return { canPay: false, reason: 'All milestones are already paid' };
  if (firstOpen.id !== milestoneId) {
    return { canPay: false, reason: 'Only the current active milestone can be paid' };
  }
  return { canPay: true };
}

async function markMilestoneSuccessful(paymentId: string) {
  const payment = await prisma.milestonePayment.findUnique({ where: { id: paymentId } });
  if (!payment) return null;

  const now = new Date();

  await prisma.$transaction([
    prisma.milestonePayment.update({
      where: { id: paymentId },
      data: {
        status: 'successful',
        confirmedByAdmin: payment.paymentMethod === 'bank_transfer' ? payment.confirmedByAdmin : false,
        confirmedAt: payment.paymentMethod === 'bank_transfer' ? payment.confirmedAt : null,
      },
    }),
    prisma.milestone.update({
      where: { id: payment.milestoneId },
      data: {
        billingStatus: 'paid',
        paidAt: now,
        status: 'Completed',
      },
    }),
  ]);

  return prisma.milestonePayment.findUnique({
    where: { id: paymentId },
    include: {
      milestone: { select: { id: true, title: true, billingStatus: true } },
      project: { select: { id: true, projectName: true } },
      user: { select: { id: true, email: true, name: true } },
    },
  });
}

export async function createMilestonePaymentSession(req: Request, res: Response): Promise<void> {
  const { id: milestoneId } = req.params as { id: string };
  const user = (req as Request & { user: AuthPayload }).user;

  if (user.role !== 'client') {
    res.status(403).json({ error: 'Only clients can pay milestones' });
    return;
  }

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      project: {
        include: {
          client: { include: { user: true } },
        },
      },
    },
  });

  if (!milestone) {
    res.status(404).json({ error: 'Milestone not found' });
    return;
  }

  if (milestone.project.client.userId !== user.userId) {
    res.status(403).json({ error: 'Only the assigned client can pay this milestone' });
    return;
  }

  if (milestone.billingStatus === 'paid') {
    res.status(400).json({ error: 'Milestone is already paid' });
    return;
  }

  const eligibility = await ensureClientMilestoneEligibility(milestone.projectId, user.userId);
  if (!eligibility.ok) {
    res.status(400).json({ error: eligibility.error });
    return;
  }

  const lock = await getMilestoneLock(milestone.projectId, milestone.id);
  if (!lock.canPay) {
    res.status(409).json({ error: lock.reason });
    return;
  }

  const paymentMethod = normalizeMethod((req.body as { paymentMethod?: string })?.paymentMethod);
  const currency = milestone.currency.toUpperCase();

  if (paymentMethod === 'paystack' && currency !== 'NGN') {
    res.status(400).json({ error: 'Paystack is available for NGN milestones only' });
    return;
  }

  const reference = `milestone_${milestone.id}_${Date.now()}`;

  const payment = await prisma.milestonePayment.create({
    data: {
      userId: user.userId,
      projectId: milestone.projectId,
      milestoneId: milestone.id,
      amount: milestone.amount,
      currency,
      paymentMethod,
      status: paymentMethod === 'bank_transfer' ? 'pending_confirmation' : 'pending',
      reference,
      metadata: {
        projectName: milestone.project.projectName,
        milestoneTitle: milestone.title,
      },
    },
  });

  if (paymentMethod === 'bank_transfer') {
    const paymentConfig = getPaymentConfig();
    res.status(201).json({
      paymentId: payment.id,
      milestoneId: milestone.id,
      projectId: milestone.projectId,
      amount: Number(milestone.amount),
      currency,
      paymentMethod,
      status: payment.status,
      reference,
      transferLink: paymentConfig.transferLink,
      bankAccounts: paymentConfig.bankAccounts.filter((account) => account.currency.toUpperCase() === currency),
      message: 'Bank transfer initiated. Upload proof and transfer reference for admin confirmation.',
    });
    return;
  }

  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
  const successUrl = `${baseUrl}/dashboard/project/${milestone.projectId}?payment=success&milestonePaymentId=${payment.id}`;
  const cancelUrl = `${baseUrl}/dashboard/project/${milestone.projectId}?payment=cancelled&milestonePaymentId=${payment.id}`;

  try {
    const session = await createUnifiedCheckoutSession({
      amount: Number(milestone.amount),
      currency,
      reference,
      userEmail: milestone.project.client.user.email,
      successUrl,
      cancelUrl,
      method: paymentMethod,
      metadata: {
        type: 'milestone',
        userId: user.userId,
      },
    });

    await prisma.milestonePayment.update({
      where: { id: payment.id },
      data: {
        paymentMethod: session.gateway,
        providerRef: session.providerRef || null,
        metadata: {
          ...(typeof payment.metadata === 'object' && payment.metadata ? (payment.metadata as Record<string, unknown>) : {}),
          gateway: session.gateway,
          note: session.note || null,
        },
      },
    });

    if (session.gateway === 'simulated') {
      const successful = await markMilestoneSuccessful(payment.id);
      res.status(201).json({
        paymentId: payment.id,
        milestoneId: milestone.id,
        projectId: milestone.projectId,
        amount: Number(milestone.amount),
        currency,
        paymentMethod: session.gateway,
        status: 'successful',
        reference,
        checkoutUrl: session.checkoutUrl,
        payment: successful,
      });
      return;
    }

    res.status(201).json({
      paymentId: payment.id,
      milestoneId: milestone.id,
      projectId: milestone.projectId,
      amount: Number(milestone.amount),
      currency,
      paymentMethod: session.gateway,
      status: 'pending',
      reference,
      checkoutUrl: session.checkoutUrl,
      note: session.note,
    });
  } catch (error) {
    await prisma.milestonePayment.update({
      where: { id: payment.id },
      data: {
        status: 'failed',
        metadata: {
          ...(typeof payment.metadata === 'object' && payment.metadata ? (payment.metadata as Record<string, unknown>) : {}),
          error: error instanceof Error ? error.message : 'Payment provider error',
        },
      },
    }).catch(() => {});

    res.status(502).json({ error: error instanceof Error ? error.message : 'Payment provider error' });
  }
}

export async function submitBankTransferProof(req: Request, res: Response): Promise<void> {
  const { paymentId } = req.params as { paymentId: string };
  const user = (req as Request & { user: AuthPayload }).user;

  if (user.role !== 'client') {
    res.status(403).json({ error: 'Only clients can submit milestone payment proof' });
    return;
  }

  const { proofOfPaymentUrl, transferReference } = req.body as {
    proofOfPaymentUrl?: string;
    transferReference?: string;
  };

  if (!proofOfPaymentUrl?.trim()) {
    res.status(400).json({ error: 'proofOfPaymentUrl is required' });
    return;
  }

  if (!transferReference?.trim()) {
    res.status(400).json({ error: 'transferReference is required' });
    return;
  }

  const payment = await prisma.milestonePayment.findUnique({
    where: { id: paymentId },
    include: {
      milestone: true,
      project: { include: { client: { include: { user: true } } } },
    },
  });

  if (!payment) {
    res.status(404).json({ error: 'Milestone payment not found' });
    return;
  }

  if (payment.userId !== user.userId || payment.project.client.userId !== user.userId) {
    res.status(403).json({ error: 'You can only submit proof for your own milestone payment' });
    return;
  }

  if (payment.paymentMethod !== 'bank_transfer') {
    res.status(400).json({ error: 'Proof upload is available for bank transfer payments only' });
    return;
  }

  const updated = await prisma.milestonePayment.update({
    where: { id: payment.id },
    data: {
      proofOfPaymentUrl: proofOfPaymentUrl.trim(),
      transferReference: transferReference.trim(),
      status: 'pending_confirmation',
    },
    include: {
      milestone: { select: { id: true, title: true } },
      project: { select: { id: true, projectName: true } },
    },
  });

  const admins = await prisma.user.findMany({ where: { role: 'super_admin' }, select: { id: true } });
  await Promise.all(
    admins.map((admin) =>
      notify({
        userId: admin.id,
        type: 'payment',
        title: 'Pending milestone bank transfer',
        message: `Milestone payment proof submitted for ${updated.project.projectName} - ${updated.milestone.title}`,
        link: '/dashboard/admin/payments',
      })
    )
  );

  res.json({
    ok: true,
    payment: updated,
    message: 'Proof submitted. Super Admin will review and confirm.',
  });
}

export async function verifyMilestonePayment(req: Request, res: Response): Promise<void> {
  const { paymentId } = req.params as { paymentId: string };
  const user = (req as Request & { user: AuthPayload }).user;

  if (user.role !== 'client') {
    res.status(403).json({ error: 'Only clients can verify milestone payments' });
    return;
  }

  const payment = await prisma.milestonePayment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== user.userId) {
    res.status(404).json({ error: 'Milestone payment not found' });
    return;
  }

  if (payment.paymentMethod === 'bank_transfer') {
    res.json({ ok: true, status: payment.status, message: 'Awaiting admin confirmation for bank transfer.' });
    return;
  }

  if (payment.status === 'successful') {
    res.json({ ok: true, status: 'successful' });
    return;
  }

  const successful = await markMilestoneSuccessful(payment.id);
  res.json({ ok: true, status: 'successful', payment: successful });
}

export async function listAdminMilestonePayments(req: Request, res: Response): Promise<void> {
  const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';
  const where = status ? { status } : {};

  const items = await prisma.milestonePayment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      project: { select: { id: true, projectName: true } },
      milestone: { select: { id: true, title: true, dueDate: true, billingStatus: true } },
    },
    take: 300,
  });

  res.json({ items });
}

export async function approveMilestonePayment(req: Request, res: Response): Promise<void> {
  const { paymentId } = req.params as { paymentId: string };
  const admin = (req as Request & { user: AuthPayload }).user;
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';

  const payment = await prisma.milestonePayment.findUnique({
    where: { id: paymentId },
    include: { milestone: true, project: true, user: true },
  });

  if (!payment) {
    res.status(404).json({ error: 'Milestone payment not found' });
    return;
  }

  if (payment.status === 'successful') {
    res.json({ ok: true, payment });
    return;
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.milestonePayment.update({
      where: { id: payment.id },
      data: {
        status: 'successful',
        confirmedByAdmin: true,
        confirmedAt: now,
        metadata: {
          ...(typeof payment.metadata === 'object' && payment.metadata ? (payment.metadata as Record<string, unknown>) : {}),
          approvedBy: admin.userId,
          approvedAt: now.toISOString(),
          note: note || null,
        },
      },
    }),
    prisma.milestone.update({
      where: { id: payment.milestoneId },
      data: {
        billingStatus: 'paid',
        paidAt: now,
        status: 'Completed',
      },
    }),
  ]);

  await notify({
    userId: payment.userId,
    type: 'payment',
    title: 'Milestone payment confirmed',
    message: `Your payment for milestone "${payment.milestone.title}" has been confirmed.`,
    link: `/dashboard/project/${payment.projectId}`,
  });

  res.json({ ok: true, status: 'successful' });
}

export async function rejectMilestonePayment(req: Request, res: Response): Promise<void> {
  const { paymentId } = req.params as { paymentId: string };
  const admin = (req as Request & { user: AuthPayload }).user;
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';

  if (!reason) {
    res.status(400).json({ error: 'reason is required' });
    return;
  }

  const payment = await prisma.milestonePayment.findUnique({
    where: { id: paymentId },
    include: { milestone: true, project: true },
  });

  if (!payment) {
    res.status(404).json({ error: 'Milestone payment not found' });
    return;
  }

  await prisma.milestonePayment.update({
    where: { id: payment.id },
    data: {
      status: 'failed',
      metadata: {
        ...(typeof payment.metadata === 'object' && payment.metadata ? (payment.metadata as Record<string, unknown>) : {}),
        rejectedBy: admin.userId,
        rejectedAt: new Date().toISOString(),
        reason,
      },
    },
  });

  if (payment.milestone.billingStatus === 'paid') {
    await prisma.milestone.update({
      where: { id: payment.milestoneId },
      data: { billingStatus: 'pending', paidAt: null, status: 'InProgress' },
    });
  }

  await notify({
    userId: payment.userId,
    type: 'payment',
    title: 'Milestone payment rejected',
    message: `Your milestone transfer could not be confirmed: ${reason}`,
    link: `/dashboard/project/${payment.projectId}`,
  });

  res.json({ ok: true, status: 'failed' });
}
