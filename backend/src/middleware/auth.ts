import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { isTeamMemberRole } from '../services/profileSettingsService';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const prisma = new PrismaClient();

const ADMIN_ROLES: UserRole[] = ['super_admin', 'cofounder', 'project_manager', 'finance_admin', 'developer', 'designer', 'marketer'];

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
}

type AccountReasonPayload = {
  reason?: string;
  suspensionExpiresAt?: string;
};

function parseAccountReason(reason: string | null | undefined): AccountReasonPayload {
  if (!reason) return {};
  try {
    const parsed = JSON.parse(reason) as AccountReasonPayload;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // fallback to plain reason text
  }
  return { reason };
}

function suspensionStillActive(reason: string | null | undefined): boolean {
  const payload = parseAccountReason(reason);
  if (!payload.suspensionExpiresAt) return true;
  const expires = new Date(payload.suspensionExpiresAt);
  if (Number.isNaN(expires.getTime())) return true;
  return expires.getTime() > Date.now();
}

function getTokenFromRequest(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/\btoken=([^;]*)/);
    if (match) return decodeURIComponent(match[1].trim()) || null;
  }
  return null;
}

function isProfileImageBypassPath(originalUrl: string): boolean {
  const url = (originalUrl || '').split('?')[0];
  if (url === '/api/v1/auth/me' || url === '/api/v1/auth/logout') return true;
  if (url.startsWith('/api/v1/settings/profile')) return true;
  if (url.startsWith('/api/v1/upload')) return true;
  return false;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authorization header or cookie' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    const latestStatus = await prisma.accountStatus.findFirst({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      select: { status: true, reason: true },
    });

    if (latestStatus) {
      const blockedStatuses = ['suspended', 'locked', 'pending_deletion', 'banned'];
      if (blockedStatuses.includes(latestStatus.status)) {
        if (latestStatus.status === 'suspended' && !suspensionStillActive(latestStatus.reason)) {
          // allow access after suspension expiry
        } else {
          res.status(403).json({
            error: 'Your account has been temporarily suspended. Please contact support.',
            code: 'ACCOUNT_SUSPENDED',
          });
          return;
        }
      }
    }

    if (isTeamMemberRole(decoded.role) && !isProfileImageBypassPath(req.originalUrl)) {
      const profile = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { avatarUrl: true },
      });
      const hasAvatar = !!profile?.avatarUrl?.trim();
      if (!hasAvatar) {
        res.status(403).json({
          error: 'Profile image is required before accessing team dashboard features.',
          code: 'PROFILE_IMAGE_REQUIRED',
        });
        return;
      }
    }

    (req as Request & { user: AuthPayload }).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: AuthPayload }).user;
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

/** Super Admin only — full platform visibility and audit. */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: AuthPayload }).user;
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (user.role !== 'super_admin') {
    res.status(403).json({ error: 'Super Admin access only' });
    return;
  }
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = getTokenFromRequest(req);
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as Request & { user: AuthPayload }).user = decoded;
  } catch {
    // ignore
  }
  next();
}

/** Require setup_paid = true for client/investor; admins bypass. Prevents API access to full features until setup fee paid. */
export function requireSetupPaid(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user: AuthPayload }).user;
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (ADMIN_ROLES.includes(user.role)) {
    next();
    return;
  }
  prisma.user
    .findUnique({
      where: { id: user.userId },
      select: { setupPaid: true },
    })
    .then((row) => {
      if (row?.setupPaid) {
        next();
        return;
      }
      res.status(403).json({
        error: 'Setup payment required',
        code: 'SETUP_PAYMENT_REQUIRED',
        message: 'Unlock by completing setup payment',
      });
    })
    .catch(() => res.status(500).json({ error: 'Server error' }));
}
