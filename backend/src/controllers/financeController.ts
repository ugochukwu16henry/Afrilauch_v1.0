/**
 * Financial dashboard analytics and tax summary export.
 * Super Admin and finance_admin only.
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { createAuditLog } from '../services/auditLogService';
import { convertToUsd } from '../services/currencyService';

const prisma = new PrismaClient();

/** Escape CSV field (wrap in quotes if contains comma/newline) */
function csvEscape(val: string | number): string {
  const s = String(val);
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** GET /api/v1/super-admin/finance/summary — KPIs and trends for financial dashboard */
export async function summary(_req: Request, res: Response): Promise<void> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    manualConfirmed,
    manualPendingCount,
    userPaymentsCompleted,
    projectPaymentsPaid,
    manualByType,
    revenueByMonthRaw,
  ] = await Promise.all([
    prisma.manualPayment.findMany({
      where: { status: 'Confirmed' },
      select: { amount: true, currency: true, userId: true, paymentType: true, confirmedAt: true },
    }),
    prisma.manualPayment.count({ where: { status: 'Pending' } }),
    prisma.userPayment.findMany({
      where: { status: 'completed' },
      select: { amount: true, currency: true, userId: true, type: true, completedAt: true },
    }),
    prisma.payment.findMany({
      where: { status: 'Paid' },
      select: { amount: true, createdAt: true },
    }),
    prisma.manualPayment.groupBy({
      by: ['paymentType'],
      where: { status: 'Confirmed' },
      _sum: { amount: true },
      _count: true,
    }),
    // Last 12 months revenue (manual confirmed + userPayment completed)
    (async () => {
      const months: { month: string; totalUsd: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const [manual, userP] = await Promise.all([
          prisma.manualPayment.findMany({
            where: { status: 'Confirmed', confirmedAt: { gte: start, lte: end } },
            select: { amount: true, currency: true },
          }),
          prisma.userPayment.findMany({
            where: { status: 'completed', completedAt: { gte: start, lte: end } },
            select: { amount: true, currency: true },
          }),
        ]);
        let totalUsd = 0;
        for (const p of manual) totalUsd += await convertToUsd(Number(p.amount), p.currency);
        for (const p of userP) totalUsd += await convertToUsd(Number(p.amount), p.currency);
        months.push({ month: start.toISOString().slice(0, 7), totalUsd: Math.round(totalUsd * 100) / 100 });
      }
      return months;
    })(),
  ]);

  const paidUserIds = new Set<string>();
  manualConfirmed.forEach((p) => paidUserIds.add(p.userId));
  userPaymentsCompleted.forEach((p) => paidUserIds.add(p.userId));
  const totalPaidUsers = paidUserIds.size;

  let totalRevenueUsd = 0;
  for (const p of manualConfirmed) {
    totalRevenueUsd += await convertToUsd(Number(p.amount), p.currency);
  }
  for (const p of userPaymentsCompleted) {
    totalRevenueUsd += await convertToUsd(Number(p.amount), p.currency);
  }
  totalRevenueUsd += projectPaymentsPaid.reduce((s, p) => s + Number(p.amount), 0);
  totalRevenueUsd = Math.round(totalRevenueUsd * 100) / 100;

  let revenueThisMonthUsd = 0;
  for (const p of manualConfirmed) {
    if (p.confirmedAt && p.confirmedAt >= startOfMonth) {
      revenueThisMonthUsd += await convertToUsd(Number(p.amount), p.currency);
    }
  }
  for (const p of userPaymentsCompleted) {
    if (p.completedAt && p.completedAt >= startOfMonth) {
      revenueThisMonthUsd += await convertToUsd(Number(p.amount), p.currency);
    }
  }
  revenueThisMonthUsd += projectPaymentsPaid
    .filter((p) => p.createdAt >= startOfMonth)
    .reduce((s, p) => s + Number(p.amount), 0);
  revenueThisMonthUsd = Math.round(revenueThisMonthUsd * 100) / 100;

  let revenueThisYearUsd = 0;
  for (const p of manualConfirmed) {
    if (p.confirmedAt && p.confirmedAt >= startOfYear) {
      revenueThisYearUsd += await convertToUsd(Number(p.amount), p.currency);
    }
  }
  for (const p of userPaymentsCompleted) {
    if (p.completedAt && p.completedAt >= startOfYear) {
      revenueThisYearUsd += await convertToUsd(Number(p.amount), p.currency);
    }
  }
  revenueThisYearUsd += projectPaymentsPaid
    .filter((p) => p.createdAt >= startOfYear)
    .reduce((s, p) => s + Number(p.amount), 0);
  revenueThisYearUsd = Math.round(revenueThisYearUsd * 100) / 100;

  const paymentMethodBreakdown = manualByType.map((g) => ({
    method: g.paymentType === 'platform_fee' ? 'Bank transfer (platform fee)' : g.paymentType,
    count: g._count,
    totalAmount: Number(g._sum.amount ?? 0),
  }));

  const revenueByMonth = await revenueByMonthRaw;

  res.json({
    totalRevenueUsd,
    revenueThisMonthUsd,
    revenueThisYearUsd,
    totalPaidUsers,
    pendingApprovals: manualPendingCount,
    paymentMethodBreakdown,
    revenueByMonth,
    refundsTotalUsd: 0, // no Refund model yet
  });
}

/** GET /api/v1/super-admin/finance/tax-summary?start=YYYY-MM-DD&end=YYYY-MM-DD — CSV export */
export async function taxSummary(req: Request, res: Response): Promise<void> {
  const admin = (req as unknown as { user?: AuthPayload }).user;
  if (!admin) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { start, end } = req.query as { start?: string; end?: string };
  const startDate = start ? new Date(start) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = end ? new Date(end) : new Date();
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    res.status(400).json({ error: 'Invalid start or end date' });
    return;
  }
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  const [manualPayments, userPayments] = await Promise.all([
    prisma.manualPayment.findMany({
      where: {
        status: 'Confirmed',
        confirmedAt: { gte: startDate, lte: endOfDay },
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { confirmedAt: 'asc' },
    }),
    prisma.userPayment.findMany({
      where: {
        status: 'completed',
        completedAt: { gte: startDate, lte: endOfDay },
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { completedAt: 'asc' },
    }),
  ]);

  const headers = [
    'Date',
    'Source',
    'Transaction ID',
    'User',
    'Email',
    'Amount',
    'Currency',
    'Payment Type',
    'Status',
  ];
  const rows: string[][] = [headers.map(csvEscape)];

  for (const p of manualPayments) {
    const date = p.confirmedAt ? new Date(p.confirmedAt).toISOString().slice(0, 10) : '';
    rows.push([
      date,
      'manual_bank_transfer',
      p.id,
      p.user.name,
      p.user.email,
      String(Number(p.amount)),
      p.currency,
      p.paymentType,
      p.status,
    ].map(csvEscape));
  }
  for (const p of userPayments) {
    const date = p.completedAt ? new Date(p.completedAt).toISOString().slice(0, 10) : '';
    rows.push([
      date,
      'gateway',
      p.id,
      p.user.name,
      p.user.email,
      String(Number(p.amount)),
      p.currency,
      p.type,
      p.status,
    ].map(csvEscape));
  }

  const csvContent = rows.map((r) => r.join(',')).join('\n');
  const fileName = `tax_summary_${startDate.toISOString().slice(0, 10)}_${endDate.toISOString().slice(0, 10)}.csv`;

  createAuditLog(prisma, {
    adminId: admin.userId,
    actionType: 'tax_export_downloaded',
    entityType: 'payment',
    entityId: null,
    details: {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      rowCount: rows.length - 1,
    },
  }).catch(() => {});

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(csvContent);
}
