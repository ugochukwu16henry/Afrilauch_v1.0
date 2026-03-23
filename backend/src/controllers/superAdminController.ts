import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { convertToUsd } from '../services/currencyService';
import { comparePassword } from '../utils/hash';
import { createAuditLog } from '../services/auditLogService';
import { getClientIp } from '../services/securityService';
import { deleteUserProfileImages } from '../services/profileSettingsService';
import type { AuthPayload } from '../middleware/auth';
import {
  createEarlyAccessInviteToken,
  EARLY_ACCESS_REF,
  getEarlyAccessInviteExpiryPolicy,
  getEarlyAccessStatus,
} from '../services/earlyAccessService';

const prisma = new PrismaClient();

function buildStatusReason(reason: string, suspensionExpiresAt?: string): string {
  return JSON.stringify({ reason, suspensionExpiresAt: suspensionExpiresAt || null });
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** GET /api/v1/super-admin/overview — Top metrics for Super Admin dashboard */
export async function overview(_req: Request, res: Response): Promise<void> {
  const [
    totalUsers,
    totalClients,
    totalInvestors,
    projectsAll,
    agreementsSignedCount,
    userPaymentsCompleted,
    projectPaymentsPaid,
    pendingManualPayments,
    pendingTalents,
    pendingStartups,
    earlyFounderCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.investor.count(),
    prisma.project.findMany({ select: { id: true, status: true } }),
    prisma.assignedAgreement.count({ where: { status: 'Signed' } }),
    prisma.userPayment.findMany({
      where: { status: 'completed' },
      select: { amount: true, currency: true, type: true },
    }),
    prisma.payment.findMany({
      where: { status: 'Paid' },
      select: { amount: true },
    }),
    prisma.manualPayment.count({ where: { status: 'Pending' } }),
    prisma.talent.count({ where: { status: 'pending' } }),
    prisma.startupProfile.count({ where: { visibilityStatus: 'pending_approval' } }),
    prisma.earlyAccessUser.count({
      where: { status: { in: ['active', 'completed'] } },
    }),
  ]);

  const ideasSubmitted = projectsAll.length; // each project starts as an idea
  const activeProjects = projectsAll.filter(
    (p) => !['IdeaSubmitted', 'ReviewValidation', 'ProposalSent'].includes(p.status)
  ).length;

  let setupFeesUsd = 0;
  let consultationPaymentsUsd = 0;
  for (const p of userPaymentsCompleted) {
    const usd = await convertToUsd(Number(p.amount), p.currency);
    if (p.type === 'setup_fee') setupFeesUsd += usd;
    else if (p.type === 'consultation') consultationPaymentsUsd += usd;
  }
  const milestoneRevenueUsd = projectPaymentsPaid.reduce((s, p) => s + Number(p.amount), 0);
  const totalRevenueUsd = setupFeesUsd + consultationPaymentsUsd + milestoneRevenueUsd;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [userPaymentsMonth, userPaymentsYear, projectPaymentsMonth, projectPaymentsYear] = await Promise.all([
    prisma.userPayment.findMany({
      where: { status: 'completed', completedAt: { gte: startOfMonth } },
      select: { amount: true, currency: true, type: true },
    }),
    prisma.userPayment.findMany({
      where: { status: 'completed', completedAt: { gte: startOfYear } },
      select: { amount: true, currency: true, type: true },
    }),
    prisma.payment.findMany({
      where: { status: 'Paid', createdAt: { gte: startOfMonth } },
      select: { amount: true },
    }),
    prisma.payment.findMany({
      where: { status: 'Paid', createdAt: { gte: startOfYear } },
      select: { amount: true },
    }),
  ]);

  let revenueMonthlyUsd = 0;
  for (const p of userPaymentsMonth) {
    revenueMonthlyUsd += await convertToUsd(Number(p.amount), p.currency);
  }
  revenueMonthlyUsd += projectPaymentsMonth.reduce((s, p) => s + Number(p.amount), 0);

  let revenueYearlyUsd = 0;
  for (const p of userPaymentsYear) {
    revenueYearlyUsd += await convertToUsd(Number(p.amount), p.currency);
  }
  revenueYearlyUsd += projectPaymentsYear.reduce((s, p) => s + Number(p.amount), 0);

  res.json({
    totalUsers,
    totalClients,
    totalInvestors,
    ideasSubmitted,
    activeProjects,
    agreementsSigned: agreementsSignedCount,
    totalRevenueUsd: Math.round(totalRevenueUsd * 100) / 100,
    revenueMonthlyUsd: Math.round(revenueMonthlyUsd * 100) / 100,
    revenueYearlyUsd: Math.round(revenueYearlyUsd * 100) / 100,
    setupFeesCollectedUsd: Math.round(setupFeesUsd * 100) / 100,
    consultationPaymentsUsd: Math.round(consultationPaymentsUsd * 100) / 100,
    investorFeesUsd: 0, // placeholder until investor fee model exists
    // New: operational overview for Super Admin Master Control System
    pendingManualPayments,
    pendingTalents,
    pendingStartups,
    earlyFounderCount,
  });
}

/** GET /api/v1/super-admin/early-access/founders — list Early Founder scholarship users + seat stats. */
export async function earlyAccessFounders(_req: Request, res: Response): Promise<void> {
  const [summary, rows] = await Promise.all([
    getEarlyAccessStatus(prisma),
    prisma.earlyAccessUser.findMany({
      orderBy: { signupOrder: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  res.json({
    limit: summary.limit,
    total: summary.total,
    remaining: summary.remaining,
    items: rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      signupOrder: row.signupOrder,
      status: row.status,
      ideaSubmitted: row.ideaSubmitted,
      consultationCompleted: row.consultationCompleted,
      referralLink: row.referralLink,
      createdAt: row.createdAt,
      user: row.user,
    })),
  });
}

/** GET /api/v1/super-admin/early-access/invite-link — generate signed invite link for Early Founder scholarship. */
export async function earlyAccessInviteLink(req: Request, res: Response): Promise<void> {
  const payload = (req as Request & { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const summary = await getEarlyAccessStatus(prisma);
  const inviteToken = createEarlyAccessInviteToken({ inviterId: payload.userId });
  const base = process.env.FRONTEND_URL || 'http://localhost:3000';
  const inviteLink = `${base}/submit-idea?ref=${encodeURIComponent(EARLY_ACCESS_REF)}&inviteToken=${encodeURIComponent(inviteToken)}`;

  res.json({
    inviteLink,
    ref: EARLY_ACCESS_REF,
    inviteToken,
    inviteExpiresIn: getEarlyAccessInviteExpiryPolicy(),
    limit: summary.limit,
    remaining: summary.remaining,
  });
}

/** GET /api/v1/super-admin/payments — Payments audit table with filters */
export async function payments(req: Request, res: Response): Promise<void> {
  const { period, userId, paymentType, format } = req.query as {
    period?: 'monthly' | 'yearly';
    userId?: string;
    paymentType?: string;
    format?: 'json' | 'csv' | 'pdf';
  };

  const now = new Date();
  let dateFrom: Date | undefined;
  if (period === 'monthly') {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'yearly') {
    dateFrom = new Date(now.getFullYear(), 0, 1);
  }

  const userPayments = await prisma.userPayment.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(paymentType ? { type: paymentType } : {}),
      ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  const projectPaymentWhere: { createdAt?: { gte: Date }; projectId?: { in: string[] } } = {};
  if (dateFrom) projectPaymentWhere.createdAt = { gte: dateFrom };
  if (userId) {
    const projectIds = (
      await prisma.project.findMany({
        where: { client: { userId } },
        select: { id: true },
      })
    ).map((p) => p.id);
    projectPaymentWhere.projectId = { in: projectIds };
    if (projectIds.length === 0) {
      projectPaymentWhere.projectId = { in: ['__none'] };
    }
  }

  const projectPayments =
    paymentType && paymentType !== 'milestone'
      ? []
      : await prisma.payment.findMany({
          where: projectPaymentWhere,
          select: { id: true, projectId: true, amount: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        });

  const projects = await prisma.project.findMany({
    where: { id: { in: projectPayments.map((p) => p.projectId) } },
    include: { client: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
  });
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const rows: Array<{
    userName: string;
    role: string;
    paymentType: string;
    amount: number;
    currency: string;
    convertedUsd: number;
    status: string;
    date: string;
  }> = [];

  if (!paymentType || paymentType !== 'milestone') {
    for (const p of userPayments) {
      const usd = await convertToUsd(Number(p.amount), p.currency);
      rows.push({
        userName: p.user.name,
        role: p.user.role,
        paymentType: p.type,
        amount: Number(p.amount),
        currency: p.currency,
        convertedUsd: Math.round(usd * 100) / 100,
        status: p.status,
        date: p.createdAt.toISOString(),
      });
    }
  }
  for (const p of projectPayments) {
    const proj = projectMap.get(p.projectId);
    const user = proj?.client?.user;
    rows.push({
      userName: user?.name ?? '—',
      role: user?.role ?? 'client',
      paymentType: 'milestone',
      amount: Number(p.amount),
      currency: 'USD',
      convertedUsd: Number(p.amount),
      status: p.status,
      date: p.createdAt.toISOString(),
    });
  }

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (format === 'csv') {
    const header = 'User Name,Role,Payment Type,Amount,Currency,Converted USD,Status,Date\n';
    const body = rows
      .map(
        (r) =>
          `"${r.userName.replace(/"/g, '""')}",${r.role},${r.paymentType},${r.amount},${r.currency},${r.convertedUsd},${r.status},${r.date}`
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=payments-audit.csv');
    res.send(header + body);
    return;
  }

  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/json');
    res.json({
      message: 'PDF export: use frontend to generate PDF from data',
      rows,
    });
    return;
  }

  res.json({ rows, total: rows.length });
}

/** GET /api/v1/super-admin/activity — User activity (logins, idea submitted, setup skipped, etc.) */
export async function activity(req: Request, res: Response): Promise<void> {
  const { actionType, limit = '100' } = req.query as { actionType?: string; limit?: string };
  const take = Math.min(parseInt(limit, 10) || 100, 500);

  const where: { actionType?: string } = {};
  if (actionType) where.actionType = actionType;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take,
    include: {
      admin: { select: { id: true, name: true, email: true } },
    },
  });

  const list = logs.map((l) => ({
    id: l.id,
    actionType: l.actionType,
    entityType: l.entityType,
    entityId: l.entityId,
    details: l.details,
    timestamp: l.timestamp,
    userEmail: (l.admin as { email?: string } | null)?.email ?? (l.details as Record<string, unknown> | null)?.email ?? null,
    userName: (l.admin as { name?: string } | null)?.name ?? (l.details as Record<string, unknown> | null)?.name ?? null,
  }));

  res.json({ items: list });
}

/** GET /api/v1/super-admin/audit-logs — Paginated audit logs */
export async function auditLogs(req: Request, res: Response): Promise<void> {
  const { page = '1', limit = '50', entityType, actionType } = req.query as {
    page?: string;
    limit?: string;
    entityType?: string;
    actionType?: string;
  };
  const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10) || 50);
  const take = Math.min(100, parseInt(limit, 10) || 50);

  const where: { entityType?: string; actionType?: string } = {};
  if (entityType) where.entityType = entityType;
  if (actionType) where.actionType = actionType;

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take,
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    items: items.map((l) => ({
      id: l.id,
      adminId: l.adminId,
      adminEmail: l.admin?.email ?? null,
      actionType: l.actionType,
      entityType: l.entityType,
      entityId: l.entityId,
      details: l.details,
      timestamp: l.timestamp,
    })),
    total,
    page: parseInt(page, 10) || 1,
    limit: take,
  });
}

/** GET /api/v1/super-admin/consultations — List all consultation bookings (Super Admin only) */
export async function consultations(_req: Request, res: Response): Promise<void> {
  const list = await prisma.consultationBooking.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(list);
}

/** GET /api/v1/super-admin/reports — Monthly/yearly reports, growth, payment trends */
export async function reports(req: Request, res: Response): Promise<void> {
  const { period = 'monthly' } = req.query as { period?: 'monthly' | 'yearly' };

  const now = new Date();
  const months: Array<{ start: Date; end: Date; label: string }> = [];
  if (period === 'yearly') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        start: d,
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
        label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        start: d,
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
        label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      });
    }
  }

  const financialSummary: Array<{ period: string; revenueUsd: number; setupFeesUsd: number; milestoneUsd: number }> = [];
  for (const m of months) {
    const [up, pp] = await Promise.all([
      prisma.userPayment.findMany({
        where: {
          status: 'completed',
          completedAt: { gte: m.start, lte: m.end },
        },
        select: { amount: true, currency: true, type: true },
      }),
      prisma.payment.findMany({
        where: { status: 'Paid', createdAt: { gte: m.start, lte: m.end } },
        select: { amount: true },
      }),
    ]);
    let setupUsd = 0,
      consultUsd = 0;
    for (const p of up) {
      const usd = await convertToUsd(Number(p.amount), p.currency);
      if (p.type === 'setup_fee') setupUsd += usd;
      else if (p.type === 'consultation') consultUsd += usd;
    }
    const milestoneUsd = pp.reduce((s, p) => s + Number(p.amount), 0);
    financialSummary.push({
      period: m.label,
      revenueUsd: Math.round((setupUsd + consultUsd + milestoneUsd) * 100) / 100,
      setupFeesUsd: Math.round(setupUsd * 100) / 100,
      milestoneUsd: Math.round(milestoneUsd * 100) / 100,
    });
  }

  const [userCounts, projectCounts] = await Promise.all([
    prisma.user.groupBy({ by: ['createdAt'], _count: true }),
    prisma.project.groupBy({ by: ['createdAt'], _count: true }),
  ]);

  const growthMetrics = {
    totalUsers: await prisma.user.count(),
    totalProjects: await prisma.project.count(),
    newUsersLast30Days: await prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    newProjectsLast30Days: await prisma.project.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  };

  res.json({
    period,
    financialSummary,
    paymentTrends: financialSummary,
    growthMetrics,
    platformUsage: {
      totalUsers: growthMetrics.totalUsers,
      totalProjects: growthMetrics.totalProjects,
      totalAgreementsSigned: await prisma.assignedAgreement.count({ where: { status: 'Signed' } }),
      totalConsultationsBooked: await prisma.consultationBooking.count(),
    },
  });
}

/** GET /api/v1/super-admin/users/account-status?status=suspended — list users with latest account status */
export async function listUsersByAccountStatus(req: Request, res: Response): Promise<void> {
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      accountStatuses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { status: true, reason: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const rows = users
    .map((user) => {
      const latest = user.accountStatuses[0] ?? null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        accountStatus: latest?.status ?? 'active',
        accountStatusReason: latest?.reason ?? null,
        accountStatusAt: latest?.createdAt ?? null,
      };
    })
    .filter((row) => (status ? row.accountStatus === status : true));

  res.json({ items: rows });
}

/** POST /api/v1/super-admin/users/:userId/pause */
export async function pauseUserAccount(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { user: { userId: string } }).user;
  const { userId } = req.params;
  const body = req.body as { reason?: string; suspensionExpiresAt?: string };

  const reason = (body.reason || '').trim();
  if (!reason) {
    res.status(400).json({ error: 'reason is required' });
    return;
  }
  if (userId === admin.userId) {
    res.status(400).json({ error: 'You cannot pause your own account' });
    return;
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, email: true } });
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (target.role === 'super_admin') {
    res.status(403).json({ error: 'Super Admin accounts cannot be paused by this endpoint' });
    return;
  }

  const suspensionExpiresAt = body.suspensionExpiresAt?.trim() || undefined;
  if (suspensionExpiresAt && Number.isNaN(new Date(suspensionExpiresAt).getTime())) {
    res.status(400).json({ error: 'Invalid suspensionExpiresAt date' });
    return;
  }

  const statusRow = await prisma.accountStatus.create({
    data: {
      userId,
      status: 'suspended',
      reason: buildStatusReason(reason, suspensionExpiresAt),
      setById: admin.userId,
    },
  });

  await createAuditLog(prisma, {
    adminId: admin.userId,
    actionType: 'account_pause',
    entityType: 'user',
    entityId: userId,
    details: {
      affectedUserId: userId,
      affectedUserRole: target.role,
      affectedUserEmail: target.email,
      reason,
      suspensionExpiresAt: suspensionExpiresAt || null,
      ipAddress: getClientIp(req),
    },
  });

  res.json({ ok: true, status: statusRow.status, message: 'Account paused' });
}

/** POST /api/v1/super-admin/users/:userId/resume */
export async function resumeUserAccount(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { user: { userId: string } }).user;
  const { userId } = req.params;
  const body = req.body as { reason?: string };

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, email: true } });
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const statusRow = await prisma.accountStatus.create({
    data: {
      userId,
      status: 'active',
      reason: (body.reason || '').trim() || 'Resumed by Super Admin',
      setById: admin.userId,
    },
  });

  await createAuditLog(prisma, {
    adminId: admin.userId,
    actionType: 'account_resume',
    entityType: 'user',
    entityId: userId,
    details: {
      affectedUserId: userId,
      affectedUserRole: target.role,
      affectedUserEmail: target.email,
      reason: (body.reason || '').trim() || null,
      ipAddress: getClientIp(req),
    },
  });

  res.json({ ok: true, status: statusRow.status, message: 'Account resumed' });
}

/** DELETE /api/v1/super-admin/users/:userId/permanent */
export async function permanentlyDeleteUser(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { user: { userId: string } }).user;
  const { userId } = req.params;
  const body = req.body as { reason?: string; password?: string };

  const reason = (body.reason || '').trim();
  const password = (body.password || '').trim();
  if (!reason) {
    res.status(400).json({ error: 'reason is required' });
    return;
  }
  if (!password) {
    res.status(400).json({ error: 'password is required for permanent delete' });
    return;
  }
  if (userId === admin.userId) {
    res.status(400).json({ error: 'You cannot permanently delete your own account' });
    return;
  }

  const [adminUser, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: admin.userId }, select: { id: true, passwordHash: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } }),
  ]);

  if (!adminUser) {
    res.status(401).json({ error: 'Admin session invalid' });
    return;
  }
  const passwordOk = await comparePassword(password, adminUser.passwordHash);
  if (!passwordOk) {
    res.status(403).json({ error: 'Invalid Super Admin password' });
    return;
  }
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (target.role === 'super_admin') {
    res.status(403).json({ error: 'Super Admin accounts cannot be deleted by this endpoint' });
    return;
  }

  const targetEmail = normalizeEmail(target.email);

  await deleteUserProfileImages(prisma, userId).catch(() => {});

  await prisma.$transaction(async (tx) => {
    await createAuditLog(prisma, {
      adminId: admin.userId,
      actionType: 'account_delete',
      entityType: 'user',
      entityId: userId,
      details: {
        affectedUserId: userId,
        affectedUserRole: target.role,
        affectedUserEmail: targetEmail,
        reason,
        ipAddress: getClientIp(req),
      },
    });

    await createAuditLog(prisma, {
      adminId: admin.userId,
      actionType: 'account_deleted_email',
      entityType: 'user',
      entityId: targetEmail,
      details: {
        reason,
        deletedUserId: userId,
      },
    });

    await tx.accountStatus.deleteMany({ where: { userId } });
    await tx.teamInvite.deleteMany({ where: { OR: [{ email: targetEmail }, { invitedById: userId }] } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.manualPaymentNotification.deleteMany({ where: { userId } });
    await tx.userBadge.deleteMany({ where: { userId } });
    await tx.userTourProgress.deleteMany({ where: { userId } });
    await tx.helpAiLog.deleteMany({ where: { userId } });
    await tx.settingsActivityLog.deleteMany({ where: { userId } });
    await tx.privacySettings.deleteMany({ where: { userId } });
    await tx.userPreferences.deleteMany({ where: { userId } });
    await tx.notificationSettings.deleteMany({ where: { userId } });
    await tx.aiConversation.deleteMany({ where: { userId } });
    await tx.aiGeneratedOutput.deleteMany({ where: { userId } });
    await tx.manualPayment.deleteMany({ where: { userId } });
    await tx.milestonePayment.deleteMany({ where: { userId } });
    await tx.userPayment.deleteMany({ where: { userId } });
    await tx.assignedAgreement.deleteMany({ where: { userId } });
    await tx.task.deleteMany({ where: { assignedToId: userId } });
    await tx.message.deleteMany({ where: { senderId: userId } });
    await tx.file.deleteMany({ where: { uploadedById: userId } });
    await tx.projectMember.deleteMany({ where: { userId } });
    await tx.forumLike.deleteMany({ where: { userId } });
    await tx.forumComment.deleteMany({ where: { userId } });
    await tx.forumPost.deleteMany({ where: { userId } });
    await tx.referral.deleteMany({ where: { OR: [{ referrerId: userId }, { referredUserId: userId }] } });
    await tx.earlyAccessUser.deleteMany({ where: { userId } });
    await tx.businessModuleAccess.deleteMany({ where: { grantedById: userId } });
    await tx.user.delete({ where: { id: userId } });
  }, {
    maxWait: 10_000,
    timeout: 60_000,
  });

  res.json({ ok: true, message: 'Account permanently deleted' });
}
