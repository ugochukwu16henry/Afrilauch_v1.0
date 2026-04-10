import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { hashPassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { createAuditLog } from '../services/auditLogService';
import { notifySuperAdminsOfNewSignup } from '../services/adminSignupAlertService';

const prisma = new PrismaClient();

/** POST /api/v1/hirer/register — Sign up as hirer (company/individual) + create hirer profile */
export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    companyName: string;
    hiringNeeds?: string;
    budget?: string;
  };
  const { name, email, password, phone, companyName, hiringNeeds, budget } = body;

  if (!companyName?.trim()) {
    res.status(400).json({ error: 'companyName required' });
    return;
  }

  const payload = (req as unknown as { user?: AuthPayload }).user;
  let userId: string;
  let createdUser: { id: string; name: string; email: string; role: string; createdAt: Date } | null = null;

  if (payload) {
    userId = payload.userId;
    const existing = await prisma.hirer.findUnique({ where: { userId } });
    if (existing) {
      res.status(400).json({ error: 'Hirer profile already exists' });
      return;
    }
  } else {
    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({ error: 'name, email, password required when not logged in' });
      return;
    }
    const existingUser = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (existingUser) {
      const existingHirer = await prisma.hirer.findUnique({ where: { userId: existingUser.id } });
      if (existingHirer) {
        res.status(400).json({ error: 'Email already registered as hirer' });
        return;
      }
      userId = existingUser.id;
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'hirer' },
      });
    } else {
      const defaultTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.trim(),
          passwordHash,
          role: 'hirer',
          tenantId: defaultTenant?.id ?? undefined,
        },
      });
      userId = user.id;
      createdUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };
    }
  }

  const hirer = await prisma.hirer.create({
    data: {
      userId,
      companyName: companyName.trim(),
      hiringNeeds: hiringNeeds?.trim() || null,
      budget: budget?.trim() || null,
    },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  createAuditLog(prisma, {
    adminId: userId,
    actionType: 'hirer_registered',
    entityType: 'hirer',
    entityId: hirer.id,
    details: { companyName: hirer.companyName },
  }).catch(() => {});

  if (createdUser) {
    void notifySuperAdminsOfNewSignup(prisma, {
      userId: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      phone: phone?.trim() || null,
      role: createdUser.role,
      createdAt: createdUser.createdAt,
      source: 'Hirer registration',
    }).catch((e) => console.error('[Hirer] Super admin signup alert error:', e));
  }

  const token = payload ? undefined : signToken({
    userId: hirer.user.id,
    email: hirer.user.email,
    role: 'hirer',
    tenantId: null,
  });

  res.status(201).json({
    hirer: {
      id: hirer.id,
      companyName: hirer.companyName,
      hiringNeeds: hirer.hiringNeeds,
      budget: hirer.budget,
      feePaid: hirer.feePaid,
      fairTreatmentSignedAt: hirer.fairTreatmentSignedAt,
      user: hirer.user,
    },
    ...(token && { token }),
  });
}

/** GET /api/v1/hirer/profile — Own hirer profile (auth) */
export async function profile(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const hirer = await prisma.hirer.findUnique({
    where: { userId: payload.userId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  if (!hirer) {
    res.status(404).json({ error: 'Hirer profile not found' });
    return;
  }
  res.json({
    id: hirer.id,
    companyName: hirer.companyName,
    hiringNeeds: hirer.hiringNeeds,
    budget: hirer.budget,
    feePaid: hirer.feePaid,
    fairTreatmentSignedAt: hirer.fairTreatmentSignedAt,
    user: hirer.user,
    createdAt: hirer.createdAt,
  });
}

/** POST /api/v1/hirer/fair-treatment/sign — Hirer: record that Fair Treatment Agreement was signed */
export async function signFairTreatment(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;

  const hirer = await prisma.hirer.findUnique({ where: { userId: payload.userId } });
  if (!hirer) {
    res.status(404).json({ error: 'Hirer profile not found' });
    return;
  }
  if (hirer.fairTreatmentSignedAt) {
    res.json({ ok: true, alreadySigned: true, fairTreatmentSignedAt: hirer.fairTreatmentSignedAt });
    return;
  }

  let agreement = await prisma.agreement.findFirst({
    where: { type: 'FairTreatment' },
  });
  if (!agreement) {
    agreement = await prisma.agreement.create({
      data: { title: 'Fair Treatment Agreement', type: 'FairTreatment' },
    });
  }

  const existing = await prisma.assignedAgreement.findFirst({
    where: { agreementId: agreement.id, userId: payload.userId },
  });
  if (existing) {
    await prisma.assignedAgreement.update({
      where: { id: existing.id },
      data: { status: 'Signed', signedAt: new Date() },
    });
  } else {
    await prisma.assignedAgreement.create({
      data: {
        agreementId: agreement.id,
        userId: payload.userId,
        status: 'Signed',
        signedAt: new Date(),
      },
    });
  }

  await prisma.hirer.update({
    where: { id: hirer.id },
    data: {
      fairTreatmentSignedAt: new Date(),
      fairTreatmentAgreementId: agreement.id,
    },
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'fair_treatment_signed',
    entityType: 'hirer',
    entityId: hirer.id,
    details: {},
  }).catch(() => {});

  res.json({ ok: true, fairTreatmentSignedAt: new Date().toISOString() });
}

/** GET /api/v1/hirer — Admin: list all hirers */
export async function list(req: Request, res: Response): Promise<void> {
  const hirers = await prisma.hirer.findMany({
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    items: hirers.map((h) => ({
      id: h.id,
      companyName: h.companyName,
      hiringNeeds: h.hiringNeeds,
      budget: h.budget,
      feePaid: h.feePaid,
      fairTreatmentSignedAt: h.fairTreatmentSignedAt,
      user: h.user,
      createdAt: h.createdAt,
    })),
  });
}
