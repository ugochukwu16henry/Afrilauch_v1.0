import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import type { AuthPayload } from '../middleware/auth';
import { sendNotificationEmail } from '../services/emailService';
import { notify } from '../services/notificationService';
import { createAuditLog } from '../services/auditLogService';
import { getClientIp, getUserAgent, recordFailedLoginAttempt } from '../services/securityService';
import { recordSignupReferral } from '../services/referralService';

const prisma = new PrismaClient();
const PUBLIC_SIGNUP_ROLES: UserRole[] = ['client', 'investor', 'talent', 'hirer', 'hiring_company'];
const PASSWORD_RESET_SECRET = process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET || 'dev-secret-change-in-production';
const PASSWORD_RESET_EXPIRES_IN = process.env.PASSWORD_RESET_EXPIRES_IN || '1h';

interface PasswordResetPayload {
  userId: string;
  email: string;
  purpose: 'password_reset';
  pwdv: string;
}

function createPasswordResetToken(params: { userId: string; email: string; passwordHash: string }): string {
  const payload: PasswordResetPayload = {
    userId: params.userId,
    email: params.email,
    purpose: 'password_reset',
    pwdv: params.passwordHash.slice(0, 16),
  };
  return jwt.sign(payload, PASSWORD_RESET_SECRET, { expiresIn: PASSWORD_RESET_EXPIRES_IN } as jwt.SignOptions);
}

function parseAccountReason(reason: string | null | undefined): { reason?: string; suspensionExpiresAt?: string } {
  if (!reason) return {};
  try {
    const parsed = JSON.parse(reason) as { reason?: string; suspensionExpiresAt?: string };
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // ignore and fallback
  }
  return { reason };
}

function isSuspensionActive(reason: string | null | undefined): boolean {
  const parsed = parseAccountReason(reason);
  if (!parsed.suspensionExpiresAt) return true;
  const expiresAt = new Date(parsed.suspensionExpiresAt);
  if (Number.isNaN(expiresAt.getTime())) return true;
  return expiresAt.getTime() > Date.now();
}

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_DAYS = 7;

export function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/', httpOnly: true, sameSite: 'lax' });
}

/** Resolve tenant id from request: X-Tenant-Domain header, or Host, or default first tenant */
export async function resolveTenantIdFromRequest(req: Request): Promise<string | null> {
  const domain =
    (req.headers['x-tenant-domain'] as string) ||
    (req.headers.host || '').split(':')[0] ||
    '';
  if (domain) {
    const tenant = await prisma.tenant.findUnique({
      where: { domain: domain.toLowerCase() },
      select: { id: true },
    });
    if (tenant) return tenant.id;
  }
  const defaultTenant = await prisma.tenant.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return defaultTenant?.id ?? null;
}

export async function signup(req: Request, res: Response): Promise<void> {
  const { name, email, password, role = 'client' } = req.body as {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  };
  try {
  if (!PUBLIC_SIGNUP_ROLES.includes(role)) {
    res.status(403).json({ message: 'This role is invite-only. Ask a Super Admin for an invite.' });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const blacklisted = await prisma.auditLog.findFirst({
    where: {
      actionType: 'account_deleted_email',
      entityType: 'user',
      entityId: normalizedEmail,
    },
    select: { id: true },
  });
  if (blacklisted) {
    res.status(403).json({ message: 'This email address is not allowed to register.' });
    return;
  }
  const tenantId = await resolveTenantIdFromRequest(req);
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    res.status(409).json({ message: 'Email already exists' });
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email: normalizedEmail, passwordHash, role, tenantId },
    select: { id: true, name: true, email: true, role: true, tenantId: true, setupPaid: true, setupReason: true, createdAt: true },
  });
  const ref = (req.query.ref as string | undefined) || (req.body as { ref?: string }).ref;
  if (ref) {
    recordSignupReferral(prisma, { referrerId: ref, referredUserId: user.id }).catch(() => {});
  }
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ?? undefined,
  });
  sendNotificationEmail({
    type: 'account_created',
    userEmail: user.email,
    dynamicData: { name: user.name },
  }).catch((e) => console.error('[Auth] Welcome email error:', e));
  notify({
    userId: user.id,
    type: 'message',
    title: 'Welcome to RiseFlow Hub',
    message: 'Your account has been created. You can now log in and explore your dashboard.',
    link: '/dashboard',
  }).catch(() => {});

  setAuthCookie(res, token);
  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId, setupPaid: user.setupPaid, setupReason: user.setupReason },
    token,
  });
  } catch (e) {
    if (isPrismaInitError(e)) {
      console.error('[Auth] Signup failed: database config error.', (e as Error).message);
      res.status(503).json({
        error: 'Database not configured. Set DATABASE_URL to a valid postgresql:// or postgres:// connection string.',
      });
      return;
    }
    throw e;
  }
}

function isPrismaInitError(e: unknown): boolean {
  const name = (e as { name?: string })?.name;
  const message = (e as { message?: string })?.message ?? '';
  return name === 'PrismaClientInitializationError' || (message.includes('datasource') && message.includes('URL'));
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      const ip = getClientIp(req);
      const ua = getUserAgent(req);
      await recordFailedLoginAttempt({
        email,
        ip,
        userAgent: ua ?? null,
        userId: user?.id ?? null,
      }).catch(() => {});
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const latestStatus = await prisma.accountStatus.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { status: true, reason: true },
    });
    if (latestStatus) {
      const blockedStatuses = ['suspended', 'locked', 'pending_deletion', 'banned'];
      if (blockedStatuses.includes(latestStatus.status)) {
        if (!(latestStatus.status === 'suspended' && !isSuspensionActive(latestStatus.reason))) {
          res.status(403).json({ error: 'Your account has been temporarily suspended. Please contact support.' });
          return;
        }
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId ?? undefined,
    });
    createAuditLog(prisma, {
      adminId: user.id,
      actionType: 'login',
      entityType: 'user',
      entityId: user.id,
      details: { email: user.email },
    }).catch(() => {});
    const setupPaid = user.setupPaid ?? false;
    const setupReason = user.setupReason ?? null;
    setAuthCookie(res, token);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId ?? undefined,
        setupPaid,
        setupReason,
      },
      token,
    });
  } catch (e) {
    if (isPrismaInitError(e)) {
      console.error('[Auth] Login failed: database config error.', (e as Error).message);
      res.status(503).json({
        error: 'Database not configured. On Render, set DATABASE_URL to a valid postgresql:// or postgres:// connection string (e.g. from Supabase Project Settings → Database).',
      });
      return;
    }
    throw e;
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tenantId: true,
      setupPaid: true,
      setupReason: true,
      avatarUrl: true,
      lastLoginAt: true,
      welcomePanelSeen: true,
      createdAt: true,
      customRole: { select: { id: true, name: true, department: true, level: true } },
      tenant: {
        select: {
          id: true,
          orgName: true,
          domain: true,
          logo: true,
          primaryColor: true,
          planType: true,
        },
      },
    },
  });
  if (!profile) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { tenant, customRole, ...userFields } = profile;
  res.json({
    ...userFields,
    customRole: customRole ?? null,
    tenant: tenant
      ? {
          id: tenant.id,
          orgName: tenant.orgName,
          domain: tenant.domain,
          logo: tenant.logo,
          primaryColor: tenant.primaryColor,
          planType: tenant.planType,
        }
      : null,
  });
}

export function logout(_req: Request, res: Response): void {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const email = ((req.body as { email?: string }).email || '').trim().toLowerCase();
  const genericMessage = 'If that email exists, a password reset link has been sent.';

  if (!email) {
    res.status(200).json({ message: genericMessage });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  if (!user) {
    res.status(200).json({ message: genericMessage });
    return;
  }

  const token = createPasswordResetToken({
    userId: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
  });

  const frontendBase =
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
  const resetLink = `${frontendBase.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

  sendNotificationEmail({
    type: 'password_reset',
    userEmail: user.email,
    dynamicData: {
      name: user.name,
      resetLink,
    },
  }).catch(() => {});

  res.status(200).json({ message: genericMessage });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const token = ((req.body as { token?: string }).token || '').trim();
  const newPassword = (req.body as { newPassword?: string }).newPassword || '';

  if (!token || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Token and a new password (min 6 chars) are required.' });
    return;
  }

  let payload: PasswordResetPayload;
  try {
    payload = jwt.verify(token, PASSWORD_RESET_SECRET) as PasswordResetPayload;
  } catch {
    res.status(400).json({ error: 'Invalid or expired reset token.' });
    return;
  }

  if (payload.purpose !== 'password_reset') {
    res.status(400).json({ error: 'Invalid reset token.' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  if (!user || user.email !== payload.email || user.passwordHash.slice(0, 16) !== payload.pwdv) {
    res.status(400).json({ error: 'Invalid or expired reset token.' });
    return;
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  sendNotificationEmail({
    type: 'security_alert',
    userEmail: user.email,
    dynamicData: {
      name: user.name,
      severity: 'medium',
      message:
        'Your password was changed successfully. If you did not perform this action, reset your password again immediately and contact support.',
    },
  }).catch(() => {});

  res.json({ message: 'Password reset successful. You can now sign in.' });
}
