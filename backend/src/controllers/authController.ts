import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { UserRole } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import type { AuthPayload } from '../middleware/auth';
import { sendNotificationEmail } from '../services/emailService';
import { notify } from '../services/notificationService';
import { createAuditLog } from '../services/auditLogService';
import { getClientIp, getUserAgent, recordFailedLoginAttempt } from '../services/securityService';
import { recordSignupReferral } from '../services/referralService';

const prisma = new PrismaClient();

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_DAYS = 7;

function setAuthCookie(res: Response, token: string): void {
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
  const tenantId = await resolveTenantIdFromRequest(req);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: 'Email already exists' });
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, tenantId },
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
    const user = await prisma.user.findUnique({ where: { email } });
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
