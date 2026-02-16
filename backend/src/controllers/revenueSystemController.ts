import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

const DRAFT_KEY = 'revenue_system_draft';
const REVENUE_MODEL_KEY = 'revenue_model';
const PRICING_JOURNEY_KEY = 'pricing_journey';
const MAX_HISTORY = 30;

function getJson(row: { value: string; type: string } | null): unknown {
  if (!row) return undefined;
  try {
    return row.type === 'json' ? (JSON.parse(row.value) as unknown) : row.value;
  } catch {
    return undefined;
  }
}

/** GET /api/v1/cms/revenue-system — Get draft, live, and version history (Super Admin / Cofounder) */
export async function getRevenueSystem(req: Request, res: Response): Promise<void> {
  try {
    const [draftRow, liveRevenueRow, liveJourneyRow, versions] = await Promise.all([
      prisma.cmsContent.findUnique({ where: { key: DRAFT_KEY }, select: { value: true, type: true, updatedAt: true } }),
      prisma.cmsContent.findUnique({ where: { key: REVENUE_MODEL_KEY }, select: { value: true, type: true, updatedAt: true } }),
      prisma.cmsContent.findUnique({ where: { key: PRICING_JOURNEY_KEY }, select: { value: true, type: true, updatedAt: true } }),
      prisma.revenueSystemVersion.findMany({
        orderBy: { editedAt: 'desc' },
        take: MAX_HISTORY,
        select: {
          id: true,
          versionType: true,
          editedAt: true,
          editedBy: { select: { name: true, email: true } },
        },
      }),
    ]);

    const draft = getJson(draftRow) as { visibility?: Record<string, boolean>; revenueModel?: unknown; pricingJourney?: unknown } | undefined;
    const liveRevenue = getJson(liveRevenueRow) as Record<string, unknown> | undefined;
    const liveJourney = getJson(liveJourneyRow) as Record<string, unknown> | undefined;

    res.json({
      draft: draft ?? null,
      live: {
        revenueModel: liveRevenue ?? null,
        pricingJourney: liveJourney ?? null,
      },
      versionHistory: versions.map((v) => ({
        id: v.id,
        versionType: v.versionType,
        editedAt: v.editedAt,
        editedBy: v.editedBy?.name ?? v.editedBy?.email ?? 'Unknown',
      })),
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

/** PUT /api/v1/cms/revenue-system/draft — Save draft (Super Admin / Cofounder) */
export async function saveDraft(req: Request, res: Response): Promise<void> {
  const user = (req as Request & { user?: AuthPayload }).user;
  const body = req.body as {
    visibility?: Record<string, boolean>;
    revenueModel?: unknown;
    pricingJourney?: unknown;
  };
  if (!body || (body.visibility === undefined && body.revenueModel === undefined && body.pricingJourney === undefined)) {
    res.status(400).json({ error: 'Provide visibility, revenueModel, and/or pricingJourney' });
    return;
  }
  try {
    const existingDraft = await prisma.cmsContent.findUnique({ where: { key: DRAFT_KEY }, select: { value: true, type: true } });
    const existing = (existingDraft ? getJson(existingDraft) as Record<string, unknown> : {}) as Record<string, unknown>;
    const payload = {
      visibility: body.visibility ?? existing.visibility ?? { homepage: true, pricing: true, onboarding: true, dashboard: true, deal_room: true },
      revenueModel: body.revenueModel ?? existing.revenueModel ?? null,
      pricingJourney: body.pricingJourney ?? existing.pricingJourney ?? null,
    };
    const value = JSON.stringify(payload);
    await prisma.cmsContent.upsert({
      where: { key: DRAFT_KEY },
      create: { key: DRAFT_KEY, value, type: 'json', page: 'revenue_model', updatedById: user?.userId ?? null },
      update: { value, updatedById: user?.userId ?? undefined },
    });
    await prisma.revenueSystemVersion.create({
      data: {
        payload: payload as object,
        versionType: 'draft',
        editedById: user?.userId ?? null,
      },
    });
    res.json({ ok: true, message: 'Draft saved' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

/** POST /api/v1/cms/revenue-system/publish — Publish draft to live (Super Admin / Cofounder) */
export async function publish(req: Request, res: Response): Promise<void> {
  const user = (req as Request & { user?: AuthPayload }).user;
  try {
    const draftRow = await prisma.cmsContent.findUnique({ where: { key: DRAFT_KEY }, select: { value: true, type: true } });
    const draft = getJson(draftRow) as { visibility?: Record<string, boolean>; revenueModel?: unknown; pricingJourney?: unknown } | undefined;
    if (!draft?.revenueModel && !draft?.pricingJourney) {
      res.status(400).json({ error: 'No draft to publish. Save a draft first.' });
      return;
    }
    const revenueModel = (draft.revenueModel ?? {}) as Record<string, unknown>;
    if (draft.visibility) revenueModel.visibility = draft.visibility;
    if (typeof revenueModel.visible === 'undefined') revenueModel.visible = true;
    const pricingJourney = (draft.pricingJourney ?? {}) as Record<string, unknown>;
    if (draft.visibility) pricingJourney.visibility = draft.visibility;
    if (typeof pricingJourney.visible === 'undefined') pricingJourney.visible = true;

    await Promise.all([
      prisma.cmsContent.upsert({
        where: { key: REVENUE_MODEL_KEY },
        create: {
          key: REVENUE_MODEL_KEY,
          value: JSON.stringify(revenueModel),
          type: 'json',
          page: 'revenue_model',
          updatedById: user?.userId ?? null,
        },
        update: { value: JSON.stringify(revenueModel), updatedById: user?.userId ?? undefined },
      }),
      prisma.cmsContent.upsert({
        where: { key: PRICING_JOURNEY_KEY },
        create: {
          key: PRICING_JOURNEY_KEY,
          value: JSON.stringify(pricingJourney),
          type: 'json',
          page: 'revenue_model',
          updatedById: user?.userId ?? null,
        },
        update: { value: JSON.stringify(pricingJourney), updatedById: user?.userId ?? undefined },
      }),
      prisma.revenueSystemVersion.create({
        data: {
          payload: { visibility: draft.visibility, revenueModel, pricingJourney } as Prisma.InputJsonValue,
          versionType: 'published',
          editedById: user?.userId ?? null,
        },
      }),
    ]);
    res.json({ ok: true, message: 'Published to live' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

/** GET /api/v1/cms/revenue-system/history — List version history (Super Admin / Cofounder) */
export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const versions = await prisma.revenueSystemVersion.findMany({
      orderBy: { editedAt: 'desc' },
      take: MAX_HISTORY,
      select: {
        id: true,
        payload: true,
        versionType: true,
        editedAt: true,
        editedBy: { select: { name: true, email: true } },
      },
    });
    res.json({
      items: versions.map((v) => ({
        id: v.id,
        payload: v.payload,
        versionType: v.versionType,
        editedAt: v.editedAt,
        editedBy: v.editedBy?.name ?? v.editedBy?.email ?? 'Unknown',
      })),
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

/** POST /api/v1/cms/revenue-system/restore/:id — Restore a version as draft (Super Admin / Cofounder) */
export async function restoreVersion(req: Request, res: Response): Promise<void> {
  const user = (req as Request & { user?: AuthPayload }).user;
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: 'Version id required' });
    return;
  }
  try {
    const version = await prisma.revenueSystemVersion.findUnique({
      where: { id },
      select: { payload: true },
    });
    if (!version) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }
    const payload = version.payload as { visibility?: Record<string, boolean>; revenueModel?: unknown; pricingJourney?: unknown };
    const value = JSON.stringify(payload);
    await prisma.cmsContent.upsert({
      where: { key: DRAFT_KEY },
      create: { key: DRAFT_KEY, value, type: 'json', page: 'revenue_model', updatedById: user?.userId ?? null },
      update: { value, updatedById: user?.userId ?? undefined },
    });
    res.json({ ok: true, message: 'Draft restored from version' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}
