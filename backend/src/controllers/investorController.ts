import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { hashPassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { notifySuperAdminsOfNewSignup } from '../services/adminSignupAlertService';

const prisma = new PrismaClient();

/** POST /api/v1/investors/register — Create user with role investor + Investor profile */
export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, phone, firmName, investmentRangeMin, investmentRangeMax, industries, country } = req.body as {
    name: string;
    email: string;
    password: string;
    phone?: string;
    firmName?: string;
    investmentRangeMin?: number;
    investmentRangeMax?: number;
    industries?: string;
    country?: string;
  };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(400).json({ error: 'Email already registered' });
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: 'investor' },
    select: { id: true, name: true, email: true, role: true, setupPaid: true, setupReason: true, createdAt: true },
  });
  await prisma.investor.create({
    data: {
      userId: user.id,
      name,
      email,
      firmName: firmName || null,
      investmentRangeMin: investmentRangeMin != null ? investmentRangeMin : null,
      investmentRangeMax: investmentRangeMax != null ? investmentRangeMax : null,
      industries: industries || null,
      country: country || null,
      verified: false,
    },
  });
  void notifySuperAdminsOfNewSignup(prisma, {
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: phone?.trim() || null,
    role: user.role,
    createdAt: user.createdAt,
    source: 'Investor registration',
  }).catch((e) => console.error('[Investor] Super admin signup alert error:', e));
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      setupPaid: user.setupPaid ?? false,
      setupReason: user.setupReason ?? null,
    },
    token,
  });
}

/** GET /api/v1/investors — List investors (admin) or current investor profile */
export async function list(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role === 'super_admin' || payload.role === 'cofounder') {
    const investors = await prisma.investor.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        firmName: true,
        investmentRangeMin: true,
        investmentRangeMax: true,
        industries: true,
        country: true,
        verified: true,
        createdAt: true,
      },
    });
    res.json(investors);
    return;
  }
  const investor = await prisma.investor.findUnique({
    where: { userId: payload.userId },
  });
  if (!investor) {
    res.status(404).json({ error: 'Investor profile not found' });
    return;
  }
  res.json(investor);
}

/** GET /api/v1/investors/me — Current investor profile */
export async function me(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const investor = await prisma.investor.findUnique({
    where: { userId },
  });
  if (!investor) {
    res.status(404).json({ error: 'Investor profile not found' });
    return;
  }
  res.json(investor);
}
