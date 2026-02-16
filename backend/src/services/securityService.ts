import type { Request } from 'express';
import {
  PrismaClient,
  SecurityEventType,
  SecuritySeverity,
} from '@prisma/client';
import { notify } from './notificationService';
import { sendNotificationEmail } from './emailService';

const prisma = new PrismaClient();

export interface LogSecurityEventParams {
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  type: SecurityEventType;
  severity?: SecuritySeverity;
  message: string;
  metadata?: Record<string, unknown> | null;
  autoBlocked?: boolean;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  const ip =
    // Express populates req.ip when trust proxy is configured
    (req.ip as string | undefined) ||
    (req.socket && req.socket.remoteAddress) ||
    '';
  return ip.replace('::ffff:', '') || 'unknown';
}

export function getUserAgent(req: Request): string | undefined {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua.slice(0, 250) : undefined;
}

/** Persist a security event and optionally fan-out alerts for high severity. */
export async function logSecurityEvent(params: LogSecurityEventParams): Promise<void> {
  const {
    userId = null,
    ip = null,
    userAgent = null,
    type,
    severity = 'medium',
    message,
    metadata = null,
    autoBlocked = false,
  } = params;

  try {
    const event = await prisma.securityEvent.create({
      data: {
        userId: userId ?? null,
        ip,
        userAgent,
        type,
        severity,
        message,
        autoBlocked,
        metadata: (metadata ?? undefined) as import('@prisma/client').Prisma.InputJsonValue | undefined,
      },
    });

    // Only escalate medium/high/critical events (esp. ip_blocked, anomaly_detected, login_suspicious).
    if (severity === 'high' || severity === 'critical' || type === 'ip_blocked' || type === 'anomaly_detected') {
      await fanOutSecurityAlert(event.id, {
        type,
        severity,
        message,
        ip,
      }).catch((e) => {
        console.error('[Security] fan-out alert failed:', e);
      });
    }
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2021') return; // table missing (migrations not applied); skip silently
    console.error('[Security] logSecurityEvent failed:', e);
  }
}

interface FanOutContext {
  type: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  ip?: string | null;
}

/** Notify all Super Admins about a critical security event (in-app + email). */
async function fanOutSecurityAlert(eventId: string, ctx: FanOutContext): Promise<void> {
  const superAdmins = await prisma.user.findMany({
    where: { role: 'super_admin' },
    select: { id: true, email: true, name: true },
  });
  if (!superAdmins.length) return;

  const title = ctx.severity === 'critical' ? 'CRITICAL security alert' : 'Security alert';
  const message = `${ctx.message}${ctx.ip ? ` (IP: ${ctx.ip})` : ''}`;

  await Promise.all(
    superAdmins.map(async (admin) => {
      await notify({
        userId: admin.id,
        type: 'security_alert',
        title,
        message,
        link: `/dashboard/admin/security?eventId=${eventId}`,
      });
      if (admin.email) {
        await sendNotificationEmail({
          type: 'security_alert',
          userEmail: admin.email,
          dynamicData: {
            name: admin.name ?? admin.email,
            message,
            severity: ctx.severity,
            eventId,
          },
        }).catch((e) => console.error('[Security] email alert failed:', e));
      }
    })
  );
}

/** Record a failed login and auto-block IP if threshold exceeded in recent window. */
export async function recordFailedLoginAttempt(options: {
  email: string;
  ip: string | null;
  userAgent?: string | null;
  userId?: string | null;
}): Promise<void> {
  const { email, ip, userAgent = null, userId = null } = options;

  await logSecurityEvent({
    userId,
    ip,
    userAgent,
    type: 'login_failed',
    severity: 'medium',
    message: `Failed login attempt for ${email}`,
    metadata: { email },
  });

  if (!ip || ip === 'unknown') return;

  const windowMinutes = Number(process.env.SECURITY_LOGIN_WINDOW_MINUTES || '15');
  const threshold = Number(process.env.SECURITY_LOGIN_MAX_FAILS || '10');
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  try {
    const count = await prisma.securityEvent.count({
      where: {
        ip,
        type: { in: ['login_failed', 'login_suspicious'] },
        createdAt: { gte: since },
      },
    });
    if (count >= threshold) {
      const existing = await prisma.blockedIp.findFirst({
        where: {
          ip,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (!existing) {
        const ttlMinutes = Number(process.env.SECURITY_BLOCK_TTL_MINUTES || '60');
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        await prisma.blockedIp.create({
          data: {
            ip,
            reason: `Too many failed logins in ${windowMinutes} minutes`,
            source: 'brute_force',
            expiresAt,
          },
        });
      }
      await logSecurityEvent({
        userId,
        ip,
        userAgent,
        type: 'ip_blocked',
        severity: 'high',
        message: `IP auto-blocked after repeated failed logins`,
        autoBlocked: true,
        metadata: { email, windowMinutes, threshold, count },
      });
    }
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2021') return; // security_events or blocked_ips table missing
    console.error('[Security] recordFailedLoginAttempt threshold check failed:', e);
  }
}

/** Check if IP is currently blocked (for non-middleware callers, tests, etc.). Returns false if table is missing. */
export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false;
  try {
    const found = await prisma.blockedIp.findFirst({
      where: {
        ip,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return !!found;
  } catch {
    return false; // e.g. table missing
  }
}

