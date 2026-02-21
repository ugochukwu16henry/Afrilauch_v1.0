import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as authController from '../controllers/authController';
import * as featureController from '../controllers/featureController';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/v1/users/me — Logged-in user profile (same as GET /auth/me)
router.get('/me', (req, res) => authController.me(req, res));

// GET /api/v1/users/me/features — Logged-in user's feature unlock state (dashboard gating).
router.get('/me/features', featureController.meFeatures);

// PATCH /api/v1/users/me — Update own profile (welcomePanelSeen, etc.)
router.patch('/me', async (req, res) => {
  const payload = (req as unknown as { user: { userId: string } }).user;
  const { welcomePanelSeen } = req.body as { welcomePanelSeen?: boolean };
  const data: { welcomePanelSeen?: boolean } = {};
  if (typeof welcomePanelSeen === 'boolean') data.welcomePanelSeen = welcomePanelSeen;
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No updates provided' });
  const user = await prisma.user.update({
    where: { id: payload.userId },
    data,
    select: { id: true, name: true, email: true, role: true, welcomePanelSeen: true },
  });
  res.json(user);
});

// GET /api/v1/users?role=developer — tenant-scoped for super admin / cofounder
router.get('/', requireRoles(UserRole.super_admin, UserRole.cofounder), async (req, res) => {
  const payload = (req as unknown as { user: { tenantId?: string | null } }).user;
  const role = req.query.role as string | undefined;
  const accountStatus = typeof req.query.accountStatus === 'string' ? req.query.accountStatus.trim() : '';
  const where: { role?: UserRole; tenantId?: string | null } = role ? { role: role as UserRole } : {};
  if (payload.tenantId != null) {
    where.tenantId = payload.tenantId;
  } else {
    where.tenantId = null;
  }
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tenantId: true,
      createdAt: true,
      accountStatuses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { status: true, reason: true, createdAt: true },
      },
    },
  });
  const rows = users
    .map((user) => {
      const latest = user.accountStatuses[0] ?? null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
        accountStatus: latest?.status ?? 'active',
        accountStatusReason: latest?.reason ?? null,
        accountStatusAt: latest?.createdAt ?? null,
      };
    })
    .filter((row) => (accountStatus ? row.accountStatus === accountStatus : true));

  res.json(rows);
});

// GET /api/v1/users/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const payload = (req as unknown as { user: { userId: string; role: string; tenantId?: string | null } }).user;
  if (payload.userId !== id && payload.role !== 'super_admin' && payload.role !== 'cofounder') {
    return res.status(403).json({ error: 'Cannot view other users' });
  }
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tenantId: true,
      createdAt: true,
      accountStatuses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { status: true, reason: true, createdAt: true },
      },
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (payload.tenantId != null && user.tenantId !== payload.tenantId && payload.role !== 'super_admin') {
    return res.status(403).json({ error: 'User belongs to another tenant' });
  }
  const latest = user.accountStatuses[0] ?? null;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    createdAt: user.createdAt,
    accountStatus: latest?.status ?? 'active',
    accountStatusReason: latest?.reason ?? null,
    accountStatusAt: latest?.createdAt ?? null,
  });
});

// PUT /api/v1/users/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  if (payload.userId !== id && payload.role !== 'super_admin') {
    return res.status(403).json({ error: 'Cannot update other users' });
  }
  const { name } = req.body;
  const user = await prisma.user.update({
    where: { id },
    data: name ? { name } : undefined,
    select: { id: true, name: true, email: true, role: true },
  });
  res.json(user);
});

export { router as userRoutes };
