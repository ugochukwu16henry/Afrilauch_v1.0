import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getClientIp, logSecurityEvent } from '../services/securityService';

const prisma = new PrismaClient();

/** Prisma error when table does not exist (e.g. migrations not yet applied). */
function isTableMissingError(e: unknown): boolean {
  const err = e as { code?: string };
  return err?.code === 'P2021';
}

let tableMissingLogged = false;

/** Blocks requests from IPs recorded in BlockedIp table (auto or manual). Skips check if table is missing (e.g. on Render before migrations). */
export async function blockedIpMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = getClientIp(req);
  if (!ip || ip === 'unknown') {
    next();
    return;
  }

  try {
    const blocked = await prisma.blockedIp.findFirst({
      where: {
        ip,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!blocked) {
      next();
      return;
    }

    await logSecurityEvent({
      ip,
      userId: (req as any).user?.userId ?? null,
      userAgent: req.headers['user-agent'] as string | undefined,
      type: 'ip_blocked',
      severity: 'high',
      message: `Request blocked for IP in BlockedIp table`,
      metadata: {
        path: req.path,
        method: req.method,
        reason: blocked.reason,
        source: blocked.source,
      },
    }).catch(() => {});

    res.status(429).json({
      error: 'Too many suspicious requests detected from this IP. Please try again later.',
    });
  } catch (e) {
    if (isTableMissingError(e)) {
      if (!tableMissingLogged) {
        tableMissingLogged = true;
        console.warn('[Security] blocked_ips table missing (run migrations); skipping IP block check.');
      }
      next();
      return;
    }
    console.error('[Security] blockedIpMiddleware error:', e);
    next();
  }
}

