import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function badRequest(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

/** GET /api/v1/super-admin/equity/company — list platform equity rows. */
export async function listCompany(_req: Request, res: Response): Promise<void> {
  try {
    const rows = await prisma.companyEquity.findMany({
      orderBy: { equityPercent: 'desc' },
    });
    res.json({ items: rows });
  } catch {
    res.status(500).json({ error: 'Failed to load company equity rows' });
  }
}

/** POST /api/v1/super-admin/equity/company — create new company equity row. */
export async function createCompany(req: Request, res: Response): Promise<void> {
  try {
    const { personName, role, shares, equityPercent, vestingStart, vestingYears } = req.body as {
      personName?: string;
      role?: string;
      shares?: number | string;
      equityPercent?: number | string;
      vestingStart?: string;
      vestingYears?: number | string;
    };

    if (!personName || !String(personName).trim()) {
      badRequest(res, 'personName is required');
      return;
    }
    if (!role || !String(role).trim()) {
      badRequest(res, 'role is required');
      return;
    }

    const parsedShares = toNumber(shares);
    const parsedEquity = toNumber(equityPercent);
    const parsedVestingYears = toNumber(vestingYears);
    if (parsedShares === undefined || parsedEquity === undefined || parsedVestingYears === undefined) {
      badRequest(res, 'shares, equityPercent and vestingYears must be valid numbers');
      return;
    }

    const created = await prisma.companyEquity.create({
      data: {
        personName: String(personName).trim(),
        role: String(role).trim(),
        shares: parsedShares,
        equityPercent: parsedEquity,
        vestingStart: vestingStart ? new Date(vestingStart) : null,
        vestingYears: parsedVestingYears,
      },
    });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Failed to create company equity row' });
  }
}

/** PUT /api/v1/super-admin/equity/company/:id — update equity row. */
export async function updateCompany(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { personName, role, shares, equityPercent, vestingStart, vestingYears } = req.body as Partial<{
      personName: string;
      role: string;
      shares: number | string;
      equityPercent: number | string;
      vestingStart: string;
      vestingYears: number | string;
    }>;

    const parsedShares = shares !== undefined ? toNumber(shares) : undefined;
    const parsedEquity = equityPercent !== undefined ? toNumber(equityPercent) : undefined;
    const parsedVestingYears = vestingYears !== undefined ? toNumber(vestingYears) : undefined;

    if ((shares !== undefined && parsedShares === undefined) || (equityPercent !== undefined && parsedEquity === undefined) || (vestingYears !== undefined && parsedVestingYears === undefined)) {
      badRequest(res, 'shares, equityPercent and vestingYears must be valid numbers when provided');
      return;
    }

    const updated = await prisma.companyEquity.update({
      where: { id },
      data: {
        ...(personName !== undefined && { personName: String(personName).trim() }),
        ...(role !== undefined && { role: String(role).trim() }),
        ...(parsedShares !== undefined && { shares: parsedShares }),
        ...(parsedEquity !== undefined && { equityPercent: parsedEquity }),
        ...(vestingStart !== undefined && { vestingStart: vestingStart ? new Date(vestingStart) : null }),
        ...(parsedVestingYears !== undefined && { vestingYears: parsedVestingYears }),
      },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update company equity row' });
  }
}

/** DELETE /api/v1/super-admin/equity/company/:id — delete equity row. */
export async function deleteCompany(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.companyEquity.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete company equity row' });
  }
}

/** GET /api/v1/super-admin/equity/startup/:startupId — list startup equity rows. */
export async function listStartup(req: Request, res: Response): Promise<void> {
  try {
    const { startupId } = req.params;
    const rows = await prisma.startupEquity.findMany({
      where: { startupId },
      orderBy: { equityPercent: 'desc' },
    });
    res.json({ items: rows });
  } catch {
    res.status(500).json({ error: 'Failed to load startup equity rows' });
  }
}

/** POST /api/v1/super-admin/equity/startup/:startupId — create startup equity row. */
export async function createStartup(req: Request, res: Response): Promise<void> {
  try {
    const { startupId } = req.params;
    const { personName, role, shares, equityPercent, vestingStart, vestingYears } = req.body as {
      personName?: string;
      role?: string;
      shares?: number | string;
      equityPercent?: number | string;
      vestingStart?: string;
      vestingYears?: number | string;
    };

    if (!personName || !String(personName).trim()) {
      badRequest(res, 'personName is required');
      return;
    }
    if (!role || !String(role).trim()) {
      badRequest(res, 'role is required');
      return;
    }

    const parsedShares = shares !== undefined ? toNumber(shares) : undefined;
    const parsedEquity = toNumber(equityPercent);
    const parsedVestingYears = toNumber(vestingYears);
    if ((shares !== undefined && parsedShares === undefined) || parsedEquity === undefined || parsedVestingYears === undefined) {
      badRequest(res, 'equityPercent and vestingYears must be valid numbers (shares optional)');
      return;
    }

    const created = await prisma.startupEquity.create({
      data: {
        startupId,
        personName: String(personName).trim(),
        role: String(role).trim(),
        shares: parsedShares ?? null,
        equityPercent: parsedEquity,
        vestingStart: vestingStart ? new Date(vestingStart) : null,
        vestingYears: parsedVestingYears,
      },
    });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Failed to create startup equity row' });
  }
}

/** PUT /api/v1/super-admin/equity/startup/:startupId/:id — update startup equity row. */
export async function updateStartup(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { personName, role, shares, equityPercent, vestingStart, vestingYears } = req.body as Partial<{
      personName: string;
      role: string;
      shares: number | string;
      equityPercent: number | string;
      vestingStart: string;
      vestingYears: number | string;
    }>;

    const parsedShares = shares !== undefined ? toNumber(shares) : undefined;
    const parsedEquity = equityPercent !== undefined ? toNumber(equityPercent) : undefined;
    const parsedVestingYears = vestingYears !== undefined ? toNumber(vestingYears) : undefined;

    if ((shares !== undefined && parsedShares === undefined) || (equityPercent !== undefined && parsedEquity === undefined) || (vestingYears !== undefined && parsedVestingYears === undefined)) {
      badRequest(res, 'shares, equityPercent and vestingYears must be valid numbers when provided');
      return;
    }

    const updated = await prisma.startupEquity.update({
      where: { id },
      data: {
        ...(personName !== undefined && { personName: String(personName).trim() }),
        ...(role !== undefined && { role: String(role).trim() }),
        ...(parsedShares !== undefined && { shares: parsedShares }),
        ...(parsedEquity !== undefined && { equityPercent: parsedEquity }),
        ...(vestingStart !== undefined && { vestingStart: vestingStart ? new Date(vestingStart) : null }),
        ...(parsedVestingYears !== undefined && { vestingYears: parsedVestingYears }),
      },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update startup equity row' });
  }
}

/** DELETE /api/v1/super-admin/equity/startup/:startupId/:id — delete startup equity row. */
export async function deleteStartup(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.startupEquity.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete startup equity row' });
  }
}

