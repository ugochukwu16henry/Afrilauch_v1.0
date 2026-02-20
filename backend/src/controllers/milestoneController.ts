import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

const MILESTONE_STATUSES = ['Pending', 'InProgress', 'Completed'] as const;
const ADMIN_ROLES = ['super_admin', 'project_manager', 'finance_admin'] as const;

async function checkProjectAccess(projectId: string, userId: string, role: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: true },
  });
  if (!project) return false;
  const isAdmin = ['super_admin', 'project_manager', 'developer', 'designer', 'marketer', 'finance_admin'].includes(role);
  if (isAdmin) return true;
  if (project.client.userId === userId) return true;
  const assigned = await prisma.task.findFirst({
    where: { projectId, assignedToId: userId },
  });
  return !!assigned;
}

function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}

async function getProjectWithClient(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: {
        include: {
          user: { select: { id: true, email: true, role: true } },
        },
      },
    },
  });
}

async function syncOverdueMilestones(projectId: string): Promise<void> {
  await prisma.milestone.updateMany({
    where: {
      projectId,
      billingStatus: 'pending',
      dueDate: { lt: new Date() },
    },
    data: { billingStatus: 'overdue' },
  });
}

/** POST /api/v1/projects/:id/milestones */
export async function createMilestone(req: Request, res: Response): Promise<void> {
  const { id: projectId } = req.params;
  const { userId, role } = (req as unknown as { user: AuthPayload }).user;
  if (!isAdminRole(role)) {
    res.status(403).json({ error: 'Only Super Admin/Project Admin can create milestones' });
    return;
  }

  const allowed = await checkProjectAccess(projectId, userId, role);
  if (!allowed) {
    res.status(403).json({ error: 'Cannot add milestone to this project' });
    return;
  }

  const project = await getProjectWithClient(projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (!['approved'].includes((project.submissionStatus || '').toLowerCase()) || !['Development', 'Testing', 'Live', 'Maintenance'].includes(project.status)) {
    res.status(400).json({ error: 'Milestones can only be created after project is approved and started' });
    return;
  }

  const { title, description, amount, currency, status, dueDate, sequence } = req.body as {
    title?: string;
    description?: string;
    amount?: number;
    currency?: string;
    status?: string;
    dueDate?: string;
    sequence?: number;
  };
  if (!title?.trim()) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    res.status(400).json({ error: 'amount must be a positive number' });
    return;
  }

  const normalizedCurrency = (currency || 'USD').trim().toUpperCase();
  if (!normalizedCurrency || normalizedCurrency.length > 6) {
    res.status(400).json({ error: 'currency is invalid' });
    return;
  }

  const existingProjectCurrency = await prisma.milestone.findFirst({
    where: { projectId },
    select: { currency: true },
    orderBy: { createdAt: 'asc' },
  });

  if (existingProjectCurrency && existingProjectCurrency.currency !== normalizedCurrency) {
    res.status(400).json({ error: `Milestone currency must match project milestone currency (${existingProjectCurrency.currency})` });
    return;
  }

  const currentCount = await prisma.milestone.count({ where: { projectId } });
  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      title: title.trim(),
      description: description?.trim() || null,
      amount,
      currency: normalizedCurrency,
      sequence: typeof sequence === 'number' && sequence > 0 ? Math.floor(sequence) : currentCount + 1,
      billingStatus: status && ['pending', 'paid', 'overdue'].includes(status.toLowerCase()) ? status.toLowerCase() : 'pending',
      status: status && MILESTONE_STATUSES.includes(status as (typeof MILESTONE_STATUSES)[number]) ? (status as (typeof MILESTONE_STATUSES)[number]) : 'Pending',
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  res.status(201).json(milestone);
}

/** GET /api/v1/projects/:id/milestones */
export async function listMilestones(req: Request, res: Response): Promise<void> {
  const { id: projectId } = req.params;
  const { userId, role } = (req as unknown as { user: AuthPayload }).user;
  const allowed = await checkProjectAccess(projectId, userId, role);
  if (!allowed) {
    res.status(403).json({ error: 'Cannot view this project milestones' });
    return;
  }

  await syncOverdueMilestones(projectId);

  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    include: {
      tasks: { select: { id: true, title: true, status: true } },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ sequence: 'asc' }, { dueDate: 'asc' }, { createdAt: 'asc' }],
  });

  let firstOpenSeen = false;
  const enriched = milestones.map((milestone) => {
    const effectiveStatus = milestone.billingStatus === 'pending' && milestone.dueDate && new Date(milestone.dueDate).getTime() < Date.now()
      ? 'overdue'
      : milestone.billingStatus;
    const isSettled = effectiveStatus === 'paid';
    const isActive = isSettled ? false : !firstOpenSeen;
    if (!isSettled && !firstOpenSeen) {
      firstOpenSeen = true;
    }
    return {
      ...milestone,
      status: effectiveStatus,
      isActive,
      latestPayment: milestone.payments[0] || null,
      payments: undefined,
    };
  });

  const completed = enriched.filter((m) => m.status === 'paid');
  const pending = enriched.filter((m) => m.status === 'pending' || m.status === 'overdue');
  const upcoming = enriched.filter((m) => m.status !== 'paid' && !m.isActive);

  res.json({
    milestones: enriched,
    summary: {
      completed,
      pending,
      upcoming,
      totalAmount: enriched.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0),
      paidAmount: completed.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0),
    },
  });
}

/** PUT /api/v1/milestones/:id */
export async function updateMilestone(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId, role } = (req as unknown as { user: AuthPayload }).user;
  const milestone = await prisma.milestone.findUnique({ where: { id }, include: { project: { include: { client: true } } } });
  if (!milestone) {
    res.status(404).json({ error: 'Milestone not found' });
    return;
  }
  if (!isAdminRole(role)) {
    res.status(403).json({ error: 'Only Super Admin/Project Admin can update milestones' });
    return;
  }
  const allowed = await checkProjectAccess(milestone.projectId, userId, role);
  if (!allowed) {
    res.status(403).json({ error: 'Cannot update this milestone' });
    return;
  }
  const { title, description, status, dueDate, amount, currency, sequence } = req.body as {
    title?: string;
    description?: string;
    status?: string;
    dueDate?: string;
    amount?: number;
    currency?: string;
    sequence?: number;
  };

  const normalizedCurrency = currency?.trim().toUpperCase();

  const updated = await prisma.milestone.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() || null }),
      ...(typeof amount === 'number' && amount > 0 && { amount }),
      ...(normalizedCurrency && normalizedCurrency.length <= 6 && { currency: normalizedCurrency }),
      ...(typeof sequence === 'number' && sequence > 0 && { sequence: Math.floor(sequence) }),
      ...(status !== undefined && MILESTONE_STATUSES.includes(status as (typeof MILESTONE_STATUSES)[number]) && { status: status as (typeof MILESTONE_STATUSES)[number] }),
      ...(status !== undefined && ['pending', 'paid', 'overdue'].includes(status.toLowerCase()) && { billingStatus: status.toLowerCase() }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
  });
  res.json(updated);
}

/** DELETE /api/v1/milestones/:id */
export async function deleteMilestone(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId, role } = (req as unknown as { user: AuthPayload }).user;
  const milestone = await prisma.milestone.findUnique({ where: { id } });
  if (!milestone) {
    res.status(404).json({ error: 'Milestone not found' });
    return;
  }
  if (!isAdminRole(role)) {
    res.status(403).json({ error: 'Only Super Admin/Project Admin can delete milestones' });
    return;
  }
  const allowed = await checkProjectAccess(milestone.projectId, userId, role);
  if (!allowed) {
    res.status(403).json({ error: 'Cannot delete this milestone' });
    return;
  }
  await prisma.milestone.delete({ where: { id } });
  res.status(204).send();
}
