import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { hashPassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { createAuditLog } from '../services/auditLogService';
import { notify } from '../services/notificationService';
import { sendNotificationEmail } from '../services/emailService';

const prisma = new PrismaClient();

/** POST /api/v1/talent/admin/create — Super Admin: directly create approved talent profile */
export async function adminCreate(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const body = req.body as {
    name?: string;
    email?: string;
    password?: string;
    skills?: string[];
    customRole?: string;
    roleCategory?: string;
    yearsExperience?: number;
    portfolioUrl?: string;
    resumeUrl?: string;
    cvUrl?: string;
    pastProjects?: Array<{ title: string; description?: string; url?: string }>;
    shortBio?: string;
    availability?: 'full_time' | 'part_time' | 'freelance';
    country?: string;
    phone?: string;
    services?: Array<{ title: string; description?: string; rate?: string }>;
    skillRates?: Record<string, string>;
    videoUrl?: string;
    hourlyRate?: number;
  };

  const name = body.name?.trim() || '';
  const email = body.email?.trim().toLowerCase() || '';
  const password = body.password || '';
  const skills = Array.isArray(body.skills) ? body.skills.map((s) => String(s).trim()).filter(Boolean) : [];
  const yearsExperience = Number(body.yearsExperience);

  if (!name || !email || skills.length === 0 || Number.isNaN(yearsExperience)) {
    res.status(400).json({
      error: 'name, email, skills (array) and yearsExperience are required',
    });
    return;
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    if (password.length < 6) {
      res.status(400).json({ error: 'password must be at least 6 characters for new users' });
      return;
    }
    const defaultTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
    const passwordHash = await hashPassword(password);
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'talent',
        tenantId: defaultTenant?.id ?? undefined,
      },
    });
  } else if (user.role !== 'talent') {
    user = await prisma.user.update({ where: { id: user.id }, data: { role: 'talent' } });
  }

  const talent = await prisma.talent.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      skills,
      customRole: body.customRole?.trim() || null,
      roleCategory: body.roleCategory?.trim() || null,
      yearsExperience,
      portfolioUrl: body.portfolioUrl?.trim() || null,
      resumeUrl: body.resumeUrl?.trim() || null,
      cvUrl: body.cvUrl?.trim() || null,
      pastProjects: body.pastProjects ?? null,
      shortBio: body.shortBio?.trim() || null,
      availability: body.availability ?? null,
      country: body.country?.trim() || null,
      phone: body.phone?.trim() || null,
      services: body.services ?? null,
      skillRates: body.skillRates ?? null,
      videoUrl: body.videoUrl?.trim() || null,
      hourlyRate: body.hourlyRate != null ? body.hourlyRate : null,
      status: 'approved',
      approvedAt: new Date(),
      approvedById: payload.userId,
      feePaid: true,
      hiddenByAdmin: false,
    },
    update: {
      skills,
      customRole: body.customRole?.trim() || null,
      roleCategory: body.roleCategory?.trim() || null,
      yearsExperience,
      portfolioUrl: body.portfolioUrl?.trim() || null,
      resumeUrl: body.resumeUrl?.trim() || null,
      cvUrl: body.cvUrl?.trim() || null,
      pastProjects: body.pastProjects ?? null,
      shortBio: body.shortBio?.trim() || null,
      availability: body.availability ?? null,
      country: body.country?.trim() || null,
      phone: body.phone?.trim() || null,
      services: body.services ?? null,
      skillRates: body.skillRates ?? null,
      videoUrl: body.videoUrl?.trim() || null,
      hourlyRate: body.hourlyRate != null ? body.hourlyRate : null,
      status: 'approved',
      approvedAt: new Date(),
      approvedById: payload.userId,
      feePaid: true,
      hiddenByAdmin: false,
    },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'talent_approval',
    entityType: 'talent',
    entityId: talent.id,
    details: { source: 'admin_direct_create', email },
  }).catch(() => {});

  res.status(201).json({
    talent: {
      id: talent.id,
      status: talent.status,
      skills: talent.skills,
      yearsExperience: talent.yearsExperience,
      portfolioUrl: talent.portfolioUrl,
      user: talent.user,
    },
  });
}

/** POST /api/v1/talent/apply — Sign up as talent + submit profile (or add profile if already registered) */
export async function apply(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    name?: string;
    email?: string;
    password?: string;
    skills: string[];
    customRole?: string;
    roleCategory?: string;
    yearsExperience: number;
    portfolioUrl?: string;
    resumeUrl?: string;
    cvUrl?: string;
    pastProjects?: Array<{ title: string; description?: string; url?: string }>;
    shortBio?: string;
    availability?: 'full_time' | 'part_time' | 'freelance';
    country?: string;
    phone?: string;
    services?: Array<{ title: string; description?: string; rate?: string }>;
    skillRates?: Record<string, string>;
    videoUrl?: string;
    hourlyRate?: number;
  };
  const {
    name,
    email,
    password,
    skills,
    customRole,
    roleCategory,
    yearsExperience,
    portfolioUrl,
    resumeUrl,
    cvUrl,
    pastProjects,
    shortBio,
    availability,
    country,
    phone,
    services,
    skillRates,
    videoUrl,
    hourlyRate,
  } = body;

  if (!Array.isArray(skills) || skills.length === 0 || typeof yearsExperience !== 'number') {
    res.status(400).json({ error: 'skills (array) and yearsExperience (number) required' });
    return;
  }

  const payload = (req as unknown as { user?: AuthPayload }).user;
  let userId: string;

  if (payload) {
    userId = payload.userId;
    const existing = await prisma.talent.findUnique({ where: { userId } });
    if (existing) {
      res.status(400).json({ error: 'Talent profile already exists' });
      return;
    }
  } else {
    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({ error: 'name, email, password required when not logged in' });
      return;
    }
    const existingUser = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (existingUser) {
      const existingTalent = await prisma.talent.findUnique({ where: { userId: existingUser.id } });
      if (existingTalent) {
        res.status(400).json({ error: 'Email already registered as talent' });
        return;
      }
      userId = existingUser.id;
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'talent' },
      });
    } else {
      const defaultTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.trim(),
          passwordHash,
          role: 'talent',
          tenantId: defaultTenant?.id ?? undefined,
        },
      });
      userId = user.id;
    }
  }

  const talent = await prisma.talent.create({
    data: {
      userId,
      skills: skills.map((s) => String(s).trim()).filter(Boolean),
      customRole: customRole?.trim() || null,
      roleCategory: roleCategory?.trim() || null,
      yearsExperience,
      portfolioUrl: portfolioUrl?.trim() || null,
      resumeUrl: resumeUrl?.trim() || null,
      cvUrl: cvUrl?.trim() || null,
      pastProjects: pastProjects ?? null,
      shortBio: shortBio?.trim() || null,
      availability: availability ?? null,
      country: country?.trim() || null,
      phone: phone?.trim() || null,
      services: services ?? null,
      skillRates: skillRates ?? null,
      videoUrl: videoUrl?.trim() || null,
      hourlyRate: hourlyRate != null ? hourlyRate : null,
      status: 'pending',
    },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  createAuditLog(prisma, {
    adminId: userId,
    actionType: 'talent_applied',
    entityType: 'talent',
    entityId: talent.id,
    details: { email: talent.user.email },
  }).catch(() => {});

  const token = payload ? undefined : signToken({
    userId: talent.user.id,
    email: talent.user.email,
    role: 'talent',
    tenantId: null,
  });

  res.status(201).json({
    talent: {
      id: talent.id,
      status: talent.status,
      skills: talent.skills,
      yearsExperience: talent.yearsExperience,
      portfolioUrl: talent.portfolioUrl,
      user: { id: talent.user.id, name: talent.user.name, email: talent.user.email, role: talent.user.role },
    },
    ...(token && { token }),
  });
}

/** GET /api/v1/talent/marketplace — Public: list approved, not-hidden talents with filters and sort */
export async function marketplace(req: Request, res: Response): Promise<void> {
  const {
    skills: skillsQ,
    category,
    minRating,
    minExperience,
    rateMin,
    rateMax,
    availability,
    verifiedOnly,
    sort,
  } = req.query as {
    skills?: string;
    category?: string;
    minRating?: string;
    minExperience?: string;
    rateMin?: string;
    rateMax?: string;
    availability?: string;
    verifiedOnly?: string;
    sort?: string;
  };

  const where: {
    status: 'approved';
    hiddenByAdmin?: boolean;
    skills?: { hasSome: string[] };
    roleCategory?: string;
    averageRating?: { gte: number };
    yearsExperience?: { gte: number };
    hourlyRate?: { gte?: number; lte?: number };
    availability?: 'full_time' | 'part_time' | 'freelance';
    feePaid?: boolean;
  } = { status: 'approved', hiddenByAdmin: false };

  const skillList = skillsQ ? skillsQ.split(',').map((s) => s.trim()).filter(Boolean) : [];
  if (skillList.length > 0) where.skills = { hasSome: skillList };
  if (category?.trim()) where.roleCategory = category.trim();
  const minR = minRating != null ? Number(minRating) : NaN;
  if (!Number.isNaN(minR) && minR >= 0) where.averageRating = { gte: minR };
  const minE = minExperience != null ? Number(minExperience) : NaN;
  if (!Number.isNaN(minE) && minE >= 0) where.yearsExperience = { gte: minE };
  const rMin = rateMin != null ? Number(rateMin) : NaN;
  const rMax = rateMax != null ? Number(rateMax) : NaN;
  if (!Number.isNaN(rMin) || !Number.isNaN(rMax)) {
    where.hourlyRate = {};
    if (!Number.isNaN(rMin)) where.hourlyRate.gte = rMin;
    if (!Number.isNaN(rMax)) where.hourlyRate.lte = rMax;
  }
  if (availability === 'full_time' || availability === 'part_time' || availability === 'freelance') {
    where.availability = availability;
  }
  if (verifiedOnly === 'true' || verifiedOnly === '1') where.feePaid = true;

  type Order = { averageRating?: 'desc'; ratingCount?: 'desc'; updatedAt?: 'desc'; createdAt?: 'desc'; featured?: 'desc' };
  let orderBy: Order[] = [{ averageRating: 'desc' }, { ratingCount: 'desc' }, { createdAt: 'desc' }];
  if (sort === 'featured') orderBy = [{ featured: 'desc' }, { averageRating: 'desc' }, { createdAt: 'desc' }];
  else if (sort === 'recent') orderBy = [{ updatedAt: 'desc' }, { createdAt: 'desc' }];
  else if (sort === 'rating') orderBy = [{ averageRating: 'desc' }, { ratingCount: 'desc' }];
  else if (sort === 'new') orderBy = [{ createdAt: 'desc' }];

  const talents = await prisma.talent.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy,
  });

  res.json({
    items: talents.map((t) => ({
      id: t.id,
      name: t.user.name,
      avatarUrl: t.user.avatarUrl,
      skills: t.skills,
      customRole: t.customRole,
      roleCategory: t.roleCategory,
      yearsExperience: t.yearsExperience,
      portfolioUrl: t.portfolioUrl,
      pastProjects: t.pastProjects,
      shortBio: t.shortBio,
      availability: t.availability,
      country: t.country,
      services: t.services,
      skillRates: t.skillRates,
      videoUrl: t.videoUrl,
      hourlyRate: t.hourlyRate != null ? Number(t.hourlyRate) : null,
      featured: t.featured,
      feePaid: t.feePaid,
      averageRating: t.averageRating != null ? Number(t.averageRating) : null,
      ratingCount: t.ratingCount,
      updatedAt: t.updatedAt,
      createdAt: t.createdAt,
    })),
  });
}

/** GET /api/v1/talent/profile — Own talent profile (auth) */
export async function profile(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const talent = await prisma.talent.findUnique({
    where: { userId: payload.userId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  if (!talent) {
    res.status(404).json({ error: 'Talent profile not found' });
    return;
  }
  res.json({
    id: talent.id,
    status: talent.status,
    skills: talent.skills,
    customRole: talent.customRole,
    roleCategory: talent.roleCategory,
    yearsExperience: talent.yearsExperience,
    portfolioUrl: talent.portfolioUrl,
    resumeUrl: talent.resumeUrl,
    cvUrl: talent.cvUrl,
    pastProjects: talent.pastProjects,
    shortBio: talent.shortBio,
    availability: talent.availability,
    country: talent.country,
    phone: talent.phone,
    services: talent.services,
    skillRates: talent.skillRates,
    videoUrl: talent.videoUrl,
    hourlyRate: talent.hourlyRate != null ? Number(talent.hourlyRate) : null,
    feePaid: talent.feePaid,
    averageRating: talent.averageRating != null ? Number(talent.averageRating) : null,
    ratingCount: talent.ratingCount,
    createdAt: talent.createdAt,
    approvedAt: talent.approvedAt,
    user: talent.user,
  });
}

/** PUT /api/v1/talent/profile — Talent: update own profile */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const body = req.body as {
    skills?: string[];
    customRole?: string;
    roleCategory?: string;
    yearsExperience?: number;
    portfolioUrl?: string;
    resumeUrl?: string;
    cvUrl?: string;
    pastProjects?: Array<{ title: string; description?: string; url?: string }>;
    shortBio?: string;
    availability?: 'full_time' | 'part_time' | 'freelance';
    country?: string;
    phone?: string;
    services?: Array<{ title: string; description?: string; rate?: string }>;
    skillRates?: Record<string, string>;
    videoUrl?: string;
    hourlyRate?: number;
  };
  const talent = await prisma.talent.findUnique({ where: { userId: payload.userId } });
  if (!talent) {
    res.status(404).json({ error: 'Talent profile not found' });
    return;
  }
  const data: Record<string, unknown> = {};
  if (body.skills !== undefined) data.skills = body.skills.map((s) => String(s).trim()).filter(Boolean);
  if (body.customRole !== undefined) data.customRole = body.customRole?.trim() || null;
  if (body.roleCategory !== undefined) data.roleCategory = body.roleCategory?.trim() || null;
  if (body.yearsExperience !== undefined) data.yearsExperience = body.yearsExperience;
  if (body.portfolioUrl !== undefined) data.portfolioUrl = body.portfolioUrl?.trim() || null;
  if (body.resumeUrl !== undefined) data.resumeUrl = body.resumeUrl?.trim() || null;
  if (body.cvUrl !== undefined) data.cvUrl = body.cvUrl?.trim() || null;
  if (body.pastProjects !== undefined) data.pastProjects = body.pastProjects;
  if (body.shortBio !== undefined) data.shortBio = body.shortBio?.trim() || null;
  if (body.availability !== undefined) data.availability = body.availability;
  if (body.country !== undefined) data.country = body.country?.trim() || null;
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.services !== undefined) data.services = body.services;
  if (body.skillRates !== undefined) data.skillRates = body.skillRates;
  if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl?.trim() || null;
  if (body.hourlyRate !== undefined) data.hourlyRate = body.hourlyRate == null ? null : body.hourlyRate;
  const updated = await prisma.talent.update({
    where: { id: talent.id },
    data: data as import('@prisma/client').Prisma.TalentUpdateInput,
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  res.json({
    id: updated.id,
    status: updated.status,
    skills: updated.skills,
    customRole: updated.customRole,
    roleCategory: updated.roleCategory,
    yearsExperience: updated.yearsExperience,
    portfolioUrl: updated.portfolioUrl,
    resumeUrl: updated.resumeUrl,
    cvUrl: updated.cvUrl,
    pastProjects: updated.pastProjects,
    shortBio: updated.shortBio,
    availability: updated.availability,
    country: updated.country,
    phone: updated.phone,
    services: updated.services,
    skillRates: updated.skillRates,
    videoUrl: updated.videoUrl,
    hourlyRate: updated.hourlyRate != null ? Number(updated.hourlyRate) : null,
    feePaid: updated.feePaid,
    averageRating: updated.averageRating != null ? Number(updated.averageRating) : null,
    ratingCount: updated.ratingCount,
    user: updated.user,
  });
}

/** GET /api/v1/talent — HR/Admin: list all talents with filters */
export async function list(req: Request, res: Response): Promise<void> {
  const status = req.query.status as string | undefined;
  const where: { status?: 'pending' | 'approved' | 'rejected' } = {};
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    where.status = status as 'pending' | 'approved' | 'rejected';
  }

  const talents = await prisma.talent.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    items: talents.map((t) => ({
      id: t.id,
      status: t.status,
      skills: t.skills,
      customRole: t.customRole,
      yearsExperience: t.yearsExperience,
      portfolioUrl: t.portfolioUrl,
      feePaid: t.feePaid,
      averageRating: t.averageRating != null ? Number(t.averageRating) : null,
      ratingCount: t.ratingCount,
      createdAt: t.createdAt,
      approvedAt: t.approvedAt,
      user: t.user,
    })),
  });
}

/** PUT /api/v1/talent/:id/approve — HR/Admin: approve or reject talent */
export async function approve(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { status } = req.body as { status: 'approved' | 'rejected' };
  const payload = (req as unknown as { user: AuthPayload }).user;

  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'status must be approved or rejected' });
    return;
  }

  const talent = await prisma.talent.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!talent) {
    res.status(404).json({ error: 'Talent not found' });
    return;
  }

  await prisma.talent.update({
    where: { id },
    data: {
      status,
      approvedAt: status === 'approved' ? new Date() : null,
      approvedById: status === 'approved' ? payload.userId : null,
    },
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'talent_approval',
    entityType: 'talent',
    entityId: talent.id,
    details: { status },
  }).catch(() => {});

  const isApproved = status === 'approved';
  notify({
    userId: talent.user.id,
    type: 'talent_approved',
    title: isApproved ? 'Talent application approved' : 'Talent application update',
    message: isApproved
      ? 'Your talent application has been approved. You can now pay the marketplace fee to showcase your profile.'
      : 'Your talent application was not approved at this time. You may reapply with more details.',
    link: isApproved ? '/dashboard/talent/pay-fee' : '/dashboard/talent',
  }).catch(() => {});
  sendNotificationEmail({
    type: 'talent_approval',
    userEmail: talent.user.email,
    dynamicData: { name: talent.user.name, status },
  }).catch(() => {});

  res.json({ ok: true, status });
}

/** PATCH /api/v1/talent/:id — Super Admin/Co-Founder: set featured or hiddenByAdmin */
export async function updateVisibility(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { featured, hiddenByAdmin } = req.body as { featured?: boolean; hiddenByAdmin?: boolean };
  const payload = (req as unknown as { user: AuthPayload }).user;

  const talent = await prisma.talent.findUnique({ where: { id } });
  if (!talent) {
    res.status(404).json({ error: 'Talent not found' });
    return;
  }

  const data: { featured?: boolean; hiddenByAdmin?: boolean } = {};
  if (typeof featured === 'boolean') data.featured = featured;
  if (typeof hiddenByAdmin === 'boolean') data.hiddenByAdmin = hiddenByAdmin;
  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: 'Provide featured and/or hiddenByAdmin' });
    return;
  }

  const updated = await prisma.talent.update({
    where: { id },
    data,
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'talent_visibility',
    entityType: 'talent',
    entityId: talent.id,
    details: data,
  }).catch(() => {});

  res.json({ ok: true, featured: updated.featured, hiddenByAdmin: updated.hiddenByAdmin });
}
