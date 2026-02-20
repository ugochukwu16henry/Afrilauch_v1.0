import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { awardBadge } from '../services/badgeService';

const prisma = new PrismaClient();

function ensureFounderRole(payload: AuthPayload | undefined): asserts payload is AuthPayload {
  if (!payload) {
    throw Object.assign(new Error('Not authenticated'), { status: 401 });
  }
  if (payload.role !== UserRole.client && payload.role !== UserRole.cofounder && payload.role !== UserRole.super_admin) {
    throw Object.assign(new Error('Only founders and Super Admins can access this module'), { status: 403 });
  }
}

async function resolveFounderStartupId(userId: string, role: UserRole, explicitStartupId?: string | null): Promise<string | null> {
  if (explicitStartupId) {
    const exists = await prisma.startupProfile.findUnique({ where: { id: explicitStartupId }, select: { id: true } });
    return exists ? exists.id : null;
  }

  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!client) {
    if (role === UserRole.super_admin) {
      const firstStartup = await prisma.startupProfile.findFirst({
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      return firstStartup?.id ?? null;
    }
    return null;
  }

  const project = await prisma.project.findFirst({
    where: { clientId: client.id },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!project) {
    if (role === UserRole.super_admin) {
      const firstStartup = await prisma.startupProfile.findFirst({
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      return firstStartup?.id ?? null;
    }
    return null;
  }

  const startup = await prisma.startupProfile.findUnique({
    where: { projectId: project.id },
    select: { id: true },
  });
  if (startup?.id) return startup.id;

  if (role === UserRole.super_admin) {
    const firstStartup = await prisma.startupProfile.findFirst({
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    return firstStartup?.id ?? null;
  }

  return null;
}

/** GET /api/v1/business/status */
export async function status(req: Request, res: Response): Promise<void> {
  try {
    const payload = (req as unknown as { user?: AuthPayload }).user;
    ensureFounderRole(payload);
    const startupIdParam = (req.query.startupId as string | undefined) ?? null;
    const startupId = await resolveFounderStartupId(payload.userId, payload.role, startupIdParam);
    if (!startupId) {
      res.json({
        unlocked: false,
        reason: 'no_startup',
      });
      return;
    }
    const startup = await prisma.startupProfile.findUnique({
      where: { id: startupId },
      include: {
        businessAccess: true,
        businessGrowth: true,
        businessFinancials: {
          orderBy: { periodMonth: 'desc' },
          take: 6,
        },
        investments: {
          select: { id: true, amount: true, status: true },
        },
      },
    });
    if (!startup) {
      res.json({ unlocked: false, reason: 'no_startup' });
      return;
    }

    const hasLaunch =
      !!startup.liveUrl ||
      !!startup.repoUrl ||
      startup.stage.toLowerCase().includes('business') ||
      startup.stage.toLowerCase().includes('launched') ||
      startup.stage.toLowerCase().includes('live');
    const hasInvestor = startup.investments.length > 0;

    let access = startup.businessAccess;
    let unlocked = false;
    let unlockReason = 'locked';

    if (payload.role === UserRole.super_admin) {
      if (!access) {
        access = await prisma.businessModuleAccess.upsert({
          where: { startupId: startup.id },
          create: {
            startupId: startup.id,
            autoUnlocked: true,
            reason: 'Super admin access',
          },
          update: {
            autoUnlocked: true,
          },
        });
      }
      unlocked = true;
      unlockReason = 'super_admin';
    } else if (access && (access.autoUnlocked || !!access.grantedById)) {
      unlocked = true;
      unlockReason = access.autoUnlocked ? 'auto' : 'manual';
    } else if (hasLaunch || hasInvestor) {
      access = await prisma.businessModuleAccess.upsert({
        where: { startupId: startup.id },
        create: {
          startupId: startup.id,
          autoUnlocked: true,
          reason: hasInvestor ? 'Investor added / onboarding' : 'Product launched',
        },
        update: {
          autoUnlocked: true,
        },
      });
      unlocked = true;
      unlockReason = 'auto';
    }

    if (unlocked && !startup.businessGrowth) {
      await prisma.businessGrowth.create({
        data: {
          startupId: startup.id,
          ideaValidated: true,
          mvpBuilt: hasLaunch,
          investorOnboarded: hasInvestor,
        },
      });
    }

    const latestFinancial = startup.businessFinancials[0] ?? null;
    const netWorth =
      latestFinancial && latestFinancial.assets && latestFinancial.liabilities
        ? Number(latestFinancial.assets) - Number(latestFinancial.liabilities)
        : null;

    res.json({
      unlocked,
      reason: unlockReason,
      startupId: startup.id,
      stage: startup.stage,
      hasLaunch,
      hasInvestor,
      latestFinancial: latestFinancial
        ? {
          periodMonth: latestFinancial.periodMonth,
          revenue: latestFinancial.revenue,
          expenses: latestFinancial.expenses,
          assets: latestFinancial.assets,
          liabilities: latestFinancial.liabilities,
          netWorth,
        }
        : null,
    });
  } catch (err) {
    const status = (err as any)?.status ?? 500;
    res.status(status).json({ error: (err as Error).message || 'Server error' });
  }
}

/** GET /api/v1/business/growth */
export async function getGrowth(req: Request, res: Response): Promise<void> {
  try {
    const payload = (req as unknown as { user?: AuthPayload }).user;
    ensureFounderRole(payload);
    const startupId = await resolveFounderStartupId(payload.userId, payload.role, (req.query.startupId as string | undefined) ?? null);
    if (!startupId) {
      res.status(404).json({ error: 'Startup not found' });
      return;
    }
    const growth = await prisma.businessGrowth.findUnique({ where: { startupId } });
    res.json(
      growth ?? {
        startupId,
        ideaValidated: true,
        mvpBuilt: false,
        firstCustomer: false,
        revenueGenerated: false,
        investorOnboarded: false,
      }
    );
  } catch (err) {
    const status = (err as any)?.status ?? 500;
    res.status(status).json({ error: (err as Error).message || 'Server error' });
  }
}

/** POST /api/v1/business/growth */
export async function updateGrowth(req: Request, res: Response): Promise<void> {
  try {
    const payload = (req as unknown as { user?: AuthPayload }).user;
    ensureFounderRole(payload);
    const startupId = await resolveFounderStartupId(payload.userId, payload.role, (req.body.startupId as string | undefined) ?? null);
    if (!startupId) {
      res.status(404).json({ error: 'Startup not found' });
      return;
    }
    const body = req.body as Partial<{
      ideaValidated: boolean;
      mvpBuilt: boolean;
      firstCustomer: boolean;
      revenueGenerated: boolean;
      investorOnboarded: boolean;
    }>;
    const existing = await prisma.businessGrowth.findUnique({ where: { startupId } });
    const updated = await prisma.businessGrowth.upsert({
      where: { startupId },
      create: {
        startupId,
        ideaValidated: body.ideaValidated ?? true,
        mvpBuilt: body.mvpBuilt ?? false,
        firstCustomer: body.firstCustomer ?? false,
        revenueGenerated: body.revenueGenerated ?? false,
        investorOnboarded: body.investorOnboarded ?? false,
      },
      update: {
        ...(body.ideaValidated != null && { ideaValidated: body.ideaValidated }),
        ...(body.mvpBuilt != null && { mvpBuilt: body.mvpBuilt }),
        ...(body.firstCustomer != null && { firstCustomer: body.firstCustomer }),
        ...(body.revenueGenerated != null && { revenueGenerated: body.revenueGenerated }),
        ...(body.investorOnboarded != null && { investorOnboarded: body.investorOnboarded }),
      },
    });

    if (updated.firstCustomer && updated.revenueGenerated && updated.investorOnboarded) {
      // Award Growth Founder badge when full growth milestones are reached
      awardBadge(prisma, { userId: payload.userId, badge: 'growth_founder' }).catch(() => {});
    }

    // Milestone triggers for investor notifications
    const milestonesToRecord: string[] = [];
    if (!existing?.mvpBuilt && updated.mvpBuilt) milestonesToRecord.push('mvp_launched');
    if (!existing?.firstCustomer && updated.firstCustomer) milestonesToRecord.push('first_customer');
    if (!existing?.revenueGenerated && updated.revenueGenerated) milestonesToRecord.push('revenue_generated');
    if (!existing?.investorOnboarded && updated.investorOnboarded) milestonesToRecord.push('investor_onboarded');
    if (milestonesToRecord.length > 0) {
      await prisma.milestoneTrigger.createMany({
        data: milestonesToRecord.map((m) => ({
          startupId,
          milestone: m,
        })),
        skipDuplicates: true,
      });
    }

    res.json(updated);
  } catch (err) {
    const status = (err as any)?.status ?? 500;
    res.status(status).json({ error: (err as Error).message || 'Server error' });
  }
}

/** GET /api/v1/business/financials */
export async function listFinancials(req: Request, res: Response): Promise<void> {
  try {
    const payload = (req as unknown as { user?: AuthPayload }).user;
    ensureFounderRole(payload);
    const startupId = await resolveFounderStartupId(payload.userId, payload.role, (req.query.startupId as string | undefined) ?? null);
    if (!startupId) {
      res.status(404).json({ error: 'Startup not found' });
      return;
    }
    const rows = await prisma.businessFinancialSnapshot.findMany({
      where: { startupId },
      orderBy: { periodMonth: 'asc' },
    });
    const mapped = rows.map((r) => {
      const revenue = Number(r.revenue);
      const expenses = Number(r.expenses);
      const profit = revenue - expenses;
      const assets = Number(r.assets);
      const liabilities = Number(r.liabilities);
      const netWorth = assets - liabilities;
      return {
        id: r.id,
        periodMonth: r.periodMonth,
        revenue,
        expenses,
        profit,
        assets,
        liabilities,
        netWorth,
        notes: r.notes,
      };
    });
    res.json({ items: mapped });
  } catch (err) {
    const status = (err as any)?.status ?? 500;
    res.status(status).json({ error: (err as Error).message || 'Server error' });
  }
}

/** POST /api/v1/business/financials */
export async function upsertFinancial(req: Request, res: Response): Promise<void> {
  try {
    const payload = (req as unknown as { user?: AuthPayload }).user;
    ensureFounderRole(payload);
    const startupId = await resolveFounderStartupId(payload.userId, payload.role, (req.body.startupId as string | undefined) ?? null);
    if (!startupId) {
      res.status(404).json({ error: 'Startup not found' });
      return;
    }
    const body = req.body as {
      periodMonth: string;
      revenue: number;
      expenses: number;
      assets: number;
      liabilities: number;
      notes?: string;
    };
    const periodMonth = new Date(body.periodMonth);
    if (Number.isNaN(periodMonth.getTime())) {
      res.status(400).json({ error: 'Invalid periodMonth' });
      return;
    }
    const row = await prisma.businessFinancialSnapshot.upsert({
      where: {
        startupId_periodMonth: {
          startupId,
          periodMonth,
        },
      },
      create: {
        startupId,
        periodMonth,
        revenue: body.revenue,
        expenses: body.expenses,
        assets: body.assets,
        liabilities: body.liabilities,
        notes: body.notes ?? null,
      },
      update: {
        revenue: body.revenue,
        expenses: body.expenses,
        assets: body.assets,
        liabilities: body.liabilities,
        notes: body.notes ?? null,
      },
    });
    const revenue = Number(row.revenue);
    const expenses = Number(row.expenses);
    const profit = revenue - expenses;
    const assets = Number(row.assets);
    const liabilities = Number(row.liabilities);
    const netWorth = assets - liabilities;

    if (revenue > 0) {
      awardBadge(prisma, { userId: payload.userId, badge: 'first_revenue' }).catch(() => {});
      await prisma.milestoneTrigger.upsert({
        where: {
          startupId_milestone: {
            startupId,
            milestone: 'first_revenue',
          },
        } as any,
        create: {
          startupId,
          milestone: 'first_revenue',
        },
        update: {},
      });
    }

    res.json({
      id: row.id,
      periodMonth: row.periodMonth,
      revenue,
      expenses,
      profit,
      assets,
      liabilities,
      netWorth,
      notes: row.notes,
    });
  } catch (err) {
    const status = (err as any)?.status ?? 500;
    res.status(status).json({ error: (err as Error).message || 'Server error' });
  }
}

/** GET /api/v1/business/reports */
export async function exportReport(req: Request, res: Response): Promise<void> {
  try {
    const payload = (req as unknown as { user?: AuthPayload }).user;
    ensureFounderRole(payload);
    const startupId = await resolveFounderStartupId(payload.userId, payload.role, (req.query.startupId as string | undefined) ?? null);
    if (!startupId) {
      res.status(404).json({ error: 'Startup not found' });
      return;
    }
    const [startup, growth, financials, investments] = await Promise.all([
      prisma.startupProfile.findUnique({
        where: { id: startupId },
        include: { project: { select: { projectName: true, client: { select: { businessName: true, industry: true } } } } },
      }),
      prisma.businessGrowth.findUnique({ where: { startupId } }),
      prisma.businessFinancialSnapshot.findMany({
        where: { startupId },
        orderBy: { periodMonth: 'asc' },
      }),
      prisma.investment.findMany({
        where: { startupId },
        select: { amount: true, equityPercent: true, status: true, createdAt: true },
      }),
    ]);
    const mappedFinancials = financials.map((r) => {
      const revenue = Number(r.revenue);
      const expenses = Number(r.expenses);
      const profit = revenue - expenses;
      const assets = Number(r.assets);
      const liabilities = Number(r.liabilities);
      const netWorth = assets - liabilities;
      return {
        periodMonth: r.periodMonth.toISOString().slice(0, 10),
        revenue,
        expenses,
        profit,
        assets,
        liabilities,
        netWorth,
        notes: r.notes,
      };
    });
    const payloadReport = {
      startup: startup
        ? {
          id: startup.id,
          name: startup.project?.projectName,
          businessName: startup.project?.client?.businessName,
          industry: startup.project?.client?.industry,
          stage: startup.stage,
          country: startup.country,
        }
        : null,
      growth: growth ?? null,
      financials: mappedFinancials,
      investments,
    };
    const format = (req.query.format as string | undefined) ?? 'json';
    if (format === 'csv') {
      const header = 'Period,Revenue,Expenses,Profit,Assets,Liabilities,NetWorth\n';
      const body = mappedFinancials
        .map(
          (f) =>
            `${f.periodMonth},${f.revenue},${f.expenses},${f.profit},${f.assets},${f.liabilities},${f.netWorth}`
        )
        .join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=business-report.csv');
      res.send(header + body);
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.json(payloadReport);
  } catch (err) {
    const status = (err as any)?.status ?? 500;
    res.status(status).json({ error: (err as Error).message || 'Server error' });
  }
}

/** GET /api/v1/super-admin/business/:startupId */
export async function adminOverview(req: Request, res: Response): Promise<void> {
  const { startupId } = req.params;
  const startup = await prisma.startupProfile.findUnique({
    where: { id: startupId },
    include: {
      project: { select: { projectName: true, client: { select: { businessName: true, industry: true } } } },
      businessGrowth: true,
      businessFinancials: true,
    },
  });
  if (!startup) {
    res.status(404).json({ error: 'Startup not found' });
    return;
  }
  const financials = startup.businessFinancials.map((r) => {
    const revenue = Number(r.revenue);
    const expenses = Number(r.expenses);
    const profit = revenue - expenses;
    const assets = Number(r.assets);
    const liabilities = Number(r.liabilities);
    const netWorth = assets - liabilities;
    return {
      periodMonth: r.periodMonth,
      revenue,
      expenses,
      profit,
      assets,
      liabilities,
      netWorth,
    };
  });
  res.json({
    startup: {
      id: startup.id,
      name: startup.project?.projectName,
      businessName: startup.project?.client?.businessName,
      industry: startup.project?.client?.industry,
      stage: startup.stage,
      country: startup.country,
    },
    growth: startup.businessGrowth,
    financials,
  });
}

