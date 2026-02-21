import type { Request, Response } from 'express';
import { PrismaClient, SecuritySeverity } from '@prisma/client';
import { sendNotificationEmail } from '../services/emailService';
import { createAuditLog } from '../services/auditLogService';

const prisma = new PrismaClient();

function isTableMissing(e: unknown): boolean {
  return (e as { code?: string })?.code === 'P2021';
}

function normalizeSeverity(value?: string): SecuritySeverity | undefined {
  if (!value) return undefined;
  const cleaned = value.trim().toLowerCase();
  if (!cleaned || cleaned === 'undefined' || cleaned === 'null') return undefined;

  const allowed: SecuritySeverity[] = ['low', 'medium', 'high', 'critical'];
  return allowed.includes(cleaned as SecuritySeverity) ? (cleaned as SecuritySeverity) : undefined;
}

function envEnabled(value: string | undefined): boolean {
  if (!value) return false;
  const cleaned = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(cleaned);
}

/** GET /api/v1/super-admin/security/overview */
export async function overview(_req: Request, res: Response): Promise<void> {
  try {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since30m = new Date(Date.now() - 30 * 60 * 1000);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [events24h, events7d, blockedActive, blockedAttacksToday, suspiciousSessions, activeUsersEstimate] =
    await Promise.all([
      prisma.securityEvent.count({ where: { createdAt: { gte: since24h } } }),
      prisma.securityEvent.count({ where: { createdAt: { gte: since7d } } }),
      prisma.blockedIp.count({
        where: {
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      prisma.securityEvent.count({
        where: {
          createdAt: { gte: startOfDay },
          OR: [{ type: 'ip_blocked' }, { type: 'rate_limit_exceeded' }],
        },
      }),
      prisma.securityEvent.count({
        where: {
          createdAt: { gte: since24h },
          severity: { in: ['high', 'critical'] },
        },
      }),
      prisma.auditLog.count({
        where: {
          actionType: 'login',
          timestamp: { gte: since30m },
        },
      }),
    ]);

  let systemStatus: 'secure' | 'warning' | 'under_attack' = 'secure';
  if (blockedAttacksToday > 100 || suspiciousSessions > 50) {
    systemStatus = 'under_attack';
  } else if (blockedAttacksToday > 0 || suspiciousSessions > 0) {
    systemStatus = 'warning';
  }

  const protections = {
    waf: envEnabled(process.env.PROTECTION_WAF_ENABLED),
    ddos: envEnabled(process.env.PROTECTION_DDOS_ENABLED),
    rateLimiting: true,
    aiMonitoring: envEnabled(process.env.PROTECTION_AI_ENABLED),
    dbEncryption: envEnabled(process.env.PROTECTION_DB_ENCRYPTION),
    backups: envEnabled(process.env.PROTECTION_BACKUPS),
  };

  res.json({
    eventsLast24h: events24h,
    eventsLast7d: events7d,
    blockedActive,
    blockedAttacksToday,
    suspiciousSessions,
    activeUsersEstimate,
    systemStatus,
    protections,
    topIps: [],
  });
  } catch (e) {
    if (isTableMissing(e)) {
      res.json({
        eventsLast24h: 0,
        eventsLast7d: 0,
        blockedActive: 0,
        blockedAttacksToday: 0,
        suspiciousSessions: 0,
        activeUsersEstimate: 0,
        systemStatus: 'secure' as const,
        protections: {
          waf: false,
          ddos: false,
          rateLimiting: true,
          aiMonitoring: false,
          dbEncryption: false,
          backups: false,
        },
        topIps: [],
      });
      return;
    }
    throw e;
  }
}

/** GET /api/v1/super-admin/security/events */
export async function listEvents(req: Request, res: Response): Promise<void> {
  try {
  const { type, severity, limit = '100' } = req.query as {
    type?: string;
    severity?: string;
    limit?: string;
  };
  const take = Math.min(parseInt(limit, 10) || 100, 500);
  const normalizedSeverity = normalizeSeverity(severity);

  const where: any = {};
  if (type && type !== 'undefined' && type !== 'null') where.type = type;
  if (normalizedSeverity) where.severity = normalizedSeverity;

  const events = await prisma.securityEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });

  res.json({
    items: events.map((e) => ({
      id: e.id,
      type: e.type,
      severity: e.severity,
      message: e.message,
      ip: e.ip,
      createdAt: e.createdAt,
      autoBlocked: e.autoBlocked,
      user: e.user
        ? {
            id: e.user.id,
            email: e.user.email,
            name: e.user.name,
            role: e.user.role,
          }
        : null,
    })),
  });
  } catch (e) {
    if (isTableMissing(e)) {
      res.json({ items: [] });
      return;
    }
    const isPrismaValidationError =
      e instanceof Error &&
      (e.name === 'PrismaClientValidationError' || e.message.includes('Invalid `prisma.securityEvent.findMany()` invocation'));

    if (isPrismaValidationError) {
      res.status(400).json({ error: 'Invalid security event filters.' });
      return;
    }

    console.error('[security.listEvents] error:', e);
    res.status(500).json({ error: 'Failed to load security events.' });
  }
}

/** GET /api/v1/super-admin/security/blocked-ips */
export async function listBlockedIps(_req: Request, res: Response): Promise<void> {
  try {
    const rows = await prisma.blockedIp.findMany({
      orderBy: { blockedAt: 'desc' },
      take: 200,
    });
    res.json({ items: rows });
  } catch (e) {
    if (isTableMissing(e)) {
      res.json({ items: [] });
      return;
    }
    throw e;
  }
}

/** DELETE /api/v1/super-admin/security/blocked-ips/:id — manually unblock an IP */
export async function unblockIp(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const row = await prisma.blockedIp.findUnique({ where: { id } });
    if (!row) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    await prisma.blockedIp.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    if (isTableMissing(e)) {
      res.status(503).json({ error: 'Security tables not available. Run database migrations.' });
      return;
    }
    throw e;
  }
}

/** POST /api/v1/super-admin/security/warnings — send warning to flagged user/email */
export async function sendWarning(req: Request, res: Response): Promise<void> {
  try {
    const admin = (req as Request & { user: { userId: string } }).user;
    const body = req.body as {
      userId?: string;
      email?: string;
      ip?: string;
      severity?: SecuritySeverity | string;
      reasons?: string[];
    };

    const severity = normalizeSeverity(body.severity) || 'medium';
    const reasons = Array.isArray(body.reasons)
      ? body.reasons.map((r) => String(r).trim()).filter(Boolean)
      : [];

    let targetEmail = (body.email || '').trim().toLowerCase();
    let targetUserId = (body.userId || '').trim();

    if (targetUserId && !targetEmail) {
      const user = await prisma.user.findUnique({ where: { id: targetUserId }, select: { email: true } });
      if (user?.email) targetEmail = user.email.toLowerCase();
    }

    if (!targetEmail) {
      res.status(400).json({ error: 'A valid userId or email is required to send warning.' });
      return;
    }

    await sendNotificationEmail({
      type: 'security_alert',
      userEmail: targetEmail,
      dynamicData: {
        severity,
        reasons,
        ip: body.ip || 'Unknown',
        action: 'Please secure your account, reset password, and review recent activity.',
      },
    });

    await createAuditLog(prisma, {
      adminId: admin.userId,
      actionType: 'security_warning_sent',
      entityType: 'user',
      entityId: targetUserId || targetEmail,
      details: {
        targetEmail,
        targetUserId: targetUserId || null,
        severity,
        reasons,
        ip: body.ip || null,
      },
    });

    res.json({ ok: true, message: `Security warning sent to ${targetEmail}` });
  } catch (e) {
    if (isTableMissing(e)) {
      res.status(503).json({ error: 'Security tables not available. Run database migrations.' });
      return;
    }
    console.error('[security.sendWarning] error:', e);
    res.status(500).json({ error: 'Failed to send security warning.' });
  }
}

