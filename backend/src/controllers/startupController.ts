import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { awardBadge } from '../services/badgeService';
import { recordReferralStage } from '../services/referralService';
import { hashPassword } from '../utils/hash';
import { createAuditLog } from '../services/auditLogService';

const prisma = new PrismaClient();

const VISIBILITY_APPROVED = 'approved';

/** POST /api/v1/startups/admin/create — Super Admin: directly create a marketplace-ready startup listing */
export async function adminCreate(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const body = req.body as {
    founderName?: string;
    founderEmail?: string;
    founderPassword?: string;
    businessName?: string;
    industry?: string;
    projectName?: string;
    pitchSummary?: string;
    tractionMetrics?: string;
    fundingNeeded?: number;
    equityOffer?: number;
    stage?: string;
    country?: string;
    liveUrl?: string;
    repoUrl?: string;
    screenshots?: string[];
    pitchDeckUrl?: string;
    aiFeasibilityScore?: number;
    aiRiskLevel?: string;
    aiMarketPotential?: string;
  };

  const founderName = body.founderName?.trim() || '';
  const founderEmail = body.founderEmail?.trim().toLowerCase() || '';
  const founderPassword = body.founderPassword || '';
  const businessName = body.businessName?.trim() || '';
  const projectName = body.projectName?.trim() || '';
  const pitchSummary = body.pitchSummary?.trim() || '';
  const fundingNeeded = Number(body.fundingNeeded);

  if (!founderName || !founderEmail || !businessName || !projectName || !pitchSummary || Number.isNaN(fundingNeeded)) {
    res.status(400).json({
      error: 'founderName, founderEmail, businessName, projectName, pitchSummary and fundingNeeded are required',
    });
    return;
  }

  let user = await prisma.user.findUnique({ where: { email: founderEmail } });
  if (!user) {
    if (founderPassword.length < 6) {
      res.status(400).json({ error: 'founderPassword must be at least 6 characters for new users' });
      return;
    }
    const defaultTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
    const passwordHash = await hashPassword(founderPassword);
    user = await prisma.user.create({
      data: {
        name: founderName,
        email: founderEmail,
        passwordHash,
        role: 'client',
        tenantId: defaultTenant?.id ?? undefined,
        setupPaid: true,
        setupReason: 'admin_marketplace_add',
      },
    });
  } else if (!user.setupPaid) {
    await prisma.user.update({
      where: { id: user.id },
      data: { setupPaid: true, setupReason: 'admin_marketplace_add' },
    });
  }

  let client = await prisma.client.findUnique({ where: { userId: user.id } });
  if (!client) {
    client = await prisma.client.create({
      data: {
        userId: user.id,
        businessName,
        industry: body.industry?.trim() || null,
        ideaSummary: pitchSummary,
      },
    });
  }

  const project = await prisma.project.create({
    data: {
      clientId: client.id,
      projectName,
      description: pitchSummary,
      stage: 'Planning',
      status: 'IdeaSubmitted',
      submissionStatus: 'submitted',
      workspaceStage: 'review',
    },
  });

  const startup = await prisma.startupProfile.create({
    data: {
      projectId: project.id,
      pitchSummary,
      tractionMetrics: body.tractionMetrics?.trim() || null,
      fundingNeeded,
      equityOffer: body.equityOffer != null ? body.equityOffer : null,
      stage: body.stage?.trim() || project.stage,
      country: body.country?.trim() || null,
      liveUrl: body.liveUrl?.trim() || null,
      repoUrl: body.repoUrl?.trim() || null,
      screenshots: Array.isArray(body.screenshots) ? body.screenshots : null,
      pitchDeckUrl: body.pitchDeckUrl?.trim() || null,
      aiFeasibilityScore: body.aiFeasibilityScore != null ? Math.min(100, Math.max(0, body.aiFeasibilityScore)) : null,
      aiRiskLevel: body.aiRiskLevel?.trim() || null,
      aiMarketPotential: body.aiMarketPotential?.trim() || null,
      visibilityStatus: 'approved',
      investorReady: true,
    },
    include: {
      project: { select: { id: true, projectName: true, stage: true, client: { select: { businessName: true, industry: true } } } },
    },
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'startup_published',
    entityType: 'startup',
    entityId: startup.id,
    details: { source: 'admin_direct_create', founderEmail, businessName, projectName },
  }).catch(() => {});

  res.status(201).json(startup);
}

/** POST /api/v1/startups/publish — Create or update startup profile; visibility = pending_approval until admin approves */
export async function publish(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const body = req.body as {
    projectId: string;
    pitchSummary: string;
    tractionMetrics?: string;
    fundingNeeded: number;
    equityOffer?: number;
    stage?: string;
    country?: string;
    liveUrl?: string;
    repoUrl?: string;
    screenshots?: string[];
    pitchDeckUrl?: string;
    aiFeasibilityScore?: number;
    aiRiskLevel?: string;
    aiMarketPotential?: string;
  };
  const { projectId, pitchSummary, tractionMetrics, fundingNeeded, equityOffer, stage } = body;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: true },
  });
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  if (project.client.userId !== payload.userId && payload.role !== 'super_admin') {
    res.status(403).json({ error: 'Only the project owner or admin can publish' });
    return;
  }
  const visibilityStatus = payload.role === 'super_admin' ? 'approved' : 'pending_approval';
  const data = {
    pitchSummary,
    tractionMetrics: tractionMetrics || null,
    fundingNeeded,
    equityOffer: equityOffer != null ? equityOffer : null,
    stage: stage || project.stage,
    visibilityStatus,
    country: body.country?.trim() || null,
    liveUrl: body.liveUrl?.trim() || null,
    repoUrl: body.repoUrl?.trim() || null,
    screenshots: Array.isArray(body.screenshots) ? body.screenshots : null,
    pitchDeckUrl: body.pitchDeckUrl?.trim() || null,
    aiFeasibilityScore: body.aiFeasibilityScore != null ? Math.min(100, Math.max(0, body.aiFeasibilityScore)) : null,
    aiRiskLevel: body.aiRiskLevel?.trim() || null,
    aiMarketPotential: body.aiMarketPotential?.trim() || null,
  };
  const startup = await prisma.startupProfile.upsert({
    where: { projectId },
    create: { projectId, ...data } as never,
    update: data as never,
    include: { project: { select: { projectName: true, client: { select: { businessName: true } } } } },
  });
  // Badge: Product Builder when live or repo URL provided
  if ((data.liveUrl || data.repoUrl) && project.client.userId) {
    awardBadge(prisma, { userId: project.client.userId, badge: 'product_builder' }).catch(() => {});
    recordReferralStage(prisma, { referredUserId: project.client.userId, stage: 'startup_launched' }).catch(
      () => {}
    );
  }
  res.status(201).json(startup);
}

/** GET /api/v1/startups/me — List startup profiles for current user's projects (client) or all (admin) */
export async function listMine(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role === 'super_admin' || payload.role === 'project_manager') {
    return listAll(req, res);
  }
  const client = await prisma.client.findUnique({
    where: { userId: payload.userId },
    select: { id: true },
  });
  if (!client) {
    res.json([]);
    return;
  }
  const projects = await prisma.project.findMany({
    where: { clientId: client.id },
    select: { id: true },
  });
  const projectIds = projects.map((p) => p.id);
  const startups = await prisma.startupProfile.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { projectName: true, client: { select: { businessName: true } } } },
    },
  });
  res.json(startups);
}

/** GET /api/v1/startups — List all startup profiles (admin only) */
export async function listAll(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: { role: string } }).user;
  if (payload.role !== 'super_admin' && payload.role !== 'project_manager') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const startups = await prisma.startupProfile.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { projectName: true, client: { select: { businessName: true } } } },
    },
  });
  res.json(startups);
}

/** GET /api/v1/startups/marketplace — List approved startups (investors + public); filter by industry, stage, funding */
export async function marketplace(req: Request, res: Response): Promise<void> {
  const industry = req.query.industry as string | undefined;
  const stage = req.query.stage as string | undefined;
  const fundingMin = req.query.fundingMin as string | undefined;
  const fundingMax = req.query.fundingMax as string | undefined;
  const startups = await prisma.startupProfile.findMany({
    where: {
      visibilityStatus: VISIBILITY_APPROVED,
      ...(industry && { project: { client: { industry: { contains: industry, mode: 'insensitive' } } } }),
      ...(stage && { stage }),
      ...(fundingMin && { fundingNeeded: { gte: parseFloat(fundingMin) } }),
      ...(fundingMax && { fundingNeeded: { lte: parseFloat(fundingMax) } }),
    },
    include: {
      project: {
        select: {
          id: true,
          projectName: true,
          stage: true,
          description: true,
          client: { select: { businessName: true, industry: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(startups);
}

/** GET /api/v1/startups/:id — Get startup profile by id; full details only for verified investors or admin/owner */
export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const startup = await prisma.startupProfile.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          client: { select: { businessName: true, industry: true, userId: true, user: { select: { name: true } } } },
          milestones: { orderBy: { createdAt: 'asc' }, select: { id: true, title: true, status: true, dueDate: true } },
        },
      },
    },
  });
  if (!startup) {
    res.status(404).json({ error: 'Startup not found' });
    return;
  }
  const payload = (req as unknown as { user?: AuthPayload }).user;
  const isAdmin = payload?.role === 'super_admin' || payload?.role === 'project_manager';
  const projectWithClient = startup.project && 'client' in startup.project ? startup.project : null;
  const ownerId = projectWithClient?.client?.userId;
  const isOwner = ownerId === payload?.userId;

  if (startup.visibilityStatus !== VISIBILITY_APPROVED) {
    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: 'Startup not visible' });
      return;
    }
  }

  let fullView = isAdmin || isOwner;
  if (!fullView && payload?.role === 'investor') {
    const investor = await prisma.investor.findUnique({
      where: { userId: payload.userId },
      select: { verified: true },
    });
    fullView = investor?.verified === true;
  }

  const project = startup.project as unknown as {
    id: string;
    projectName: string;
    description: string | null;
    stage: string;
    status: string;
    liveUrl: string | null;
    repoUrl: string | null;
    client: { businessName: string; industry: string | null; userId: string; user: { name: string } };
    milestones?: { id: string; title: string; status: string; dueDate: string | null }[];
  } | null;

  if (fullView && project) {
    res.json({ ...startup, fullView: true, project: { ...project, milestones: project.milestones ?? [] } as unknown as typeof project });
    return;
  }

  const partial = {
    id: startup.id,
    projectId: startup.projectId,
    stage: startup.stage,
    fundingNeeded: startup.fundingNeeded,
    equityOffer: startup.equityOffer,
    country: startup.country,
    visibilityStatus: startup.visibilityStatus,
    fullView: false,
    project: project
      ? { id: project.id, projectName: project.projectName, stage: project.stage, client: project.client }
      : null,
    pitchSummary: startup.pitchSummary.length > 400 ? startup.pitchSummary.slice(0, 400) + '…' : startup.pitchSummary,
    tractionMetrics: null,
    liveUrl: null,
    repoUrl: null,
    screenshots: null,
    pitchDeckUrl: null,
    aiFeasibilityScore: null,
    aiRiskLevel: null,
    aiMarketPotential: null,
  };
  res.json(partial);
}

/** PUT /api/v1/startups/:id/approve — Admin approve startup visibility */
export async function approve(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const startup = await prisma.startupProfile.findUnique({
    where: { id },
    include: { project: { include: { client: true } } },
  });
  if (!startup) {
    res.status(404).json({ error: 'Startup not found' });
    return;
  }
  const updated = await prisma.startupProfile.update({
    where: { id },
    data: { visibilityStatus: 'approved', investorReady: true },
    include: { project: { include: { client: true } } },
  });
  const ownerId = updated.project?.client?.userId;
  if (ownerId) {
    awardBadge(prisma, { userId: ownerId, badge: 'investor_ready' }).catch(() => {});
  }
  res.json(updated);
}
