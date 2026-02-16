import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

/** GET /api/v1/cms/:key — Get content by key (public read) */
export async function getByKey(req: Request, res: Response): Promise<void> {
  const { key } = req.params;
  if (!key) {
    res.status(400).json({ error: 'Missing key' });
    return;
  }
  try {
    const row = await prisma.cmsContent.findUnique({
      where: { key },
      select: { key: true, value: true, type: true, page: true, updatedAt: true },
    });
    if (!row) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }
    const value = row.type === 'json' ? (JSON.parse(row.value) as unknown) : row.value;
    res.json({ key: row.key, value, type: row.type, page: row.page, updatedAt: row.updatedAt });
  } catch (e) {
    if (e instanceof SyntaxError) {
      const row = await prisma.cmsContent.findUnique({ where: { key }, select: { value: true, type: true, page: true, updatedAt: true } });
      if (row) res.json({ key, value: row.value, type: row.type, page: row.page, updatedAt: row.updatedAt });
      else res.status(404).json({ error: 'Content not found' });
      return;
    }
    res.status(500).json({ error: 'Server error' });
  }
}

/** GET /api/v1/cms/page/:pageName — Get all content for a page (public read) */
export async function getByPage(req: Request, res: Response): Promise<void> {
  const pageName = req.params.pageName;
  if (!pageName) {
    res.status(400).json({ error: 'Missing page name' });
    return;
  }
  try {
    const rows = await prisma.cmsContent.findMany({
      where: { page: pageName },
      select: { key: true, value: true, type: true, updatedAt: true },
      orderBy: { key: 'asc' },
    });
    const contents: Record<string, unknown> = {};
    for (const row of rows) {
      contents[row.key] = row.type === 'json' ? (JSON.parse(row.value) as unknown) : row.value;
    }
    res.json({ page: pageName, contents });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

/** POST /api/v1/cms — Create content (Super Admin only) */
export async function create(req: Request, res: Response): Promise<void> {
  const user = (req as Request & { user?: AuthPayload }).user;
  const body = req.body as { key?: string; value?: unknown; type?: string; page?: string };
  if (!body.key || body.value === undefined) {
    res.status(400).json({ error: 'key and value required' });
    return;
  }
  const type = body.type || 'text';
  const page = body.page || 'general';
  const value = typeof body.value === 'string' ? body.value : JSON.stringify(body.value);
  try {
    const created = await prisma.cmsContent.create({
      data: {
        key: body.key,
        value,
        type,
        page,
        updatedById: user?.userId ?? null,
      },
      select: { id: true, key: true, value: true, type: true, page: true, updatedAt: true },
    });
    const outValue = type === 'json' ? (JSON.parse(created.value) as unknown) : created.value;
    res.status(201).json({ key: created.key, value: outValue, type: created.type, page: created.page, updatedAt: created.updatedAt });
  } catch (e: unknown) {
    const prismaError = e as { code?: string };
    if (prismaError.code === 'P2002') {
      res.status(409).json({ error: 'Content with this key already exists' });
      return;
    }
    res.status(500).json({ error: 'Server error' });
  }
}

/** PUT /api/v1/cms/:key — Update content (Super Admin only) */
export async function update(req: Request, res: Response): Promise<void> {
  const user = (req as Request & { user?: AuthPayload }).user;
  const { key } = req.params;
  const body = req.body as { value?: unknown };
  if (!key || body.value === undefined) {
    res.status(400).json({ error: 'key and value required' });
    return;
  }
  const value = typeof body.value === 'string' ? body.value : JSON.stringify(body.value);
  try {
    const existing = await prisma.cmsContent.findUnique({ where: { key }, select: { type: true } });
    const type = existing?.type ?? 'text';
    const updated = await prisma.cmsContent.update({
      where: { key },
      data: { value, updatedById: user?.userId ?? undefined },
      select: { key: true, value: true, type: true, page: true, updatedAt: true },
    });
    const outValue = type === 'json' ? (JSON.parse(updated.value) as unknown) : updated.value;
    res.json({ key: updated.key, value: outValue, type: updated.type, page: updated.page, updatedAt: updated.updatedAt });
  } catch (e: unknown) {
    const prismaError = e as { code?: string };
    if (prismaError.code === 'P2025') {
      res.status(404).json({ error: 'Content not found' });
      return;
    }
    res.status(500).json({ error: 'Server error' });
  }
}

/** DELETE /api/v1/cms/:key — Delete content (Super Admin only) */
export async function remove(req: Request, res: Response): Promise<void> {
  const { key } = req.params;
  if (!key) {
    res.status(400).json({ error: 'Missing key' });
    return;
  }
  try {
    await prisma.cmsContent.delete({ where: { key } });
    res.status(204).send();
  } catch (e: unknown) {
    const prismaError = e as { code?: string };
    if (prismaError.code === 'P2025') {
      res.status(404).json({ error: 'Content not found' });
      return;
    }
    res.status(500).json({ error: 'Server error' });
  }
}

/** POST /api/v1/cms/revenue-model-view — Log view of Revenue Model section (optional auth) */
export async function trackRevenueModelView(req: Request, res: Response): Promise<void> {
  const user = (req as Request & { user?: AuthPayload }).user;
  const body = req.body as { source?: string };
  const source = body?.source && typeof body.source === 'string' ? body.source : 'homepage';
  const allowed = ['homepage', 'pricing', 'onboarding', 'dashboard', 'deal_room'];
  const normalized = allowed.includes(source) ? source : 'homepage';
  try {
    await prisma.revenueModelViewLog.create({
      data: {
        userId: user?.userId ?? null,
        source: normalized,
      },
    });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

/** PUT /api/v1/cms/page/:pageName — Bulk update page content (Super Admin only) */
export async function bulkUpdatePage(req: Request, res: Response): Promise<void> {
  const user = (req as Request & { user?: AuthPayload }).user;
  const pageName = req.params.pageName;
  const body = req.body as { contents?: Array<{ key: string; value: unknown }> };
  if (!pageName || !Array.isArray(body.contents)) {
    res.status(400).json({ error: 'page name and contents[] required' });
    return;
  }
  try {
    for (const item of body.contents) {
      if (!item.key || item.value === undefined) continue;
      const isJson = typeof item.value !== 'string';
      const value: string = isJson ? JSON.stringify(item.value) : String(item.value);
      await prisma.cmsContent.upsert({
        where: { key: item.key },
        create: {
          key: item.key,
          value,
          type: isJson ? 'json' : 'text',
          page: pageName,
          updatedById: user?.userId ?? null,
        },
        update: { value, page: pageName, updatedById: user?.userId ?? undefined },
      });
    }
    const rows = await prisma.cmsContent.findMany({
      where: { page: pageName },
      select: { key: true, value: true, type: true, updatedAt: true },
      orderBy: { key: 'asc' },
    });
    const contents: Record<string, unknown> = {};
    for (const row of rows) {
      contents[row.key] = row.type === 'json' ? (JSON.parse(row.value) as unknown) : row.value;
    }
    res.json({ page: pageName, contents });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}
