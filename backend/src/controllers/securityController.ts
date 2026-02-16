import type { Request, Response } from 'express';
import { PrismaClient, SecuritySeverity } from '@prisma/client';

const prisma = new PrismaClient();

function isTableMissing(e: unknown): boolean {
  return (e as { code?: string })?.code === 'P2021';
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
    waf: process.env.PROTECTION_WAF_ENABLED === 'true',
    ddos: process.env.PROTECTION_DDOS_ENABLED === 'true',
    rateLimiting: true,
    aiMonitoring: process.env.PROTECTION_AI_ENABLED === 'true',
    dbEncryption: process.env.PROTECTION_DB_ENCRYPTION === 'true',
    backups: process.env.PROTECTION_BACKUPS === 'true',
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
    severity?: SecuritySeverity;
    limit?: string;
  };
  const take = Math.min(parseInt(limit, 10) || 100, 500);

  const where: any = {};
  if (type) where.type = type;
  if (severity) where.severity = severity;

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
    throw e;
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

