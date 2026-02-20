import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { UserRole } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { hashPassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { sendNotificationEmail } from '../services/emailService';
import crypto from 'crypto';

const prisma = new PrismaClient();

const TEAM_ROLES: UserRole[] = [
  'super_admin',
  'cofounder',
  'project_manager',
  'finance_admin',
  'developer',
  'designer',
  'marketer',
  'hr_manager',
  'legal_team',
];
const INVITE_EXPIRY_HOURS = 48;

const DEFAULT_CUSTOM_ROLES: Array<{ name: string; department: string; level: string }> = [
  { name: 'Frontend Developer', department: 'Technical', level: 'Level 2' },
  { name: 'Backend Developer', department: 'Technical', level: 'Level 2' },
  { name: 'Product Engineer', department: 'Technical', level: 'Level 3' },
  { name: 'Business Analyst', department: 'Business', level: 'Level 2' },
  { name: 'Growth Strategist', department: 'Business', level: 'Level 3' },
  { name: 'Operations Lead', department: 'Operations', level: 'Level 3' },
  { name: 'Delivery Coordinator', department: 'Operations', level: 'Level 2' },
  { name: 'Marketing Lead', department: 'Marketing', level: 'Level 3' },
  { name: 'Content Strategist', department: 'Marketing', level: 'Level 2' },
  { name: 'AI Engineer', department: 'AI & Data', level: 'Level 3' },
  { name: 'Data Analyst', department: 'AI & Data', level: 'Level 2' },
  { name: 'Investor Relations', department: 'Investment', level: 'Level 3' },
  { name: 'Fundraising Associate', department: 'Investment', level: 'Level 2' },
  { name: 'Customer Support Lead', department: 'Support', level: 'Level 3' },
  { name: 'Support Specialist', department: 'Support', level: 'Level 2' },
];

function isTeamRole(role: string): role is UserRole {
  return TEAM_ROLES.includes(role as UserRole);
}

/** GET /api/v1/team — List team members (Super Admin only) */
export async function list(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: TEAM_ROLES } },
        { customRoleId: { not: null } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      lastLoginAt: true,
      createdAt: true,
      customRole: { select: { id: true, name: true, department: true, level: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
}

/** POST /api/v1/team/invite — Create invite and send email (Super Admin only) */
export async function invite(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { email, role, customRoleId } = req.body as { email: string; role: string; customRoleId?: string | null };

  if (!email?.trim()) {
    res.status(400).json({ error: 'email required' });
    return;
  }
  const systemRole = isTeamRole(role) ? role : 'developer';
  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    res.status(400).json({ error: 'User with this email already exists' });
    return;
  }
  const existingInvite = await prisma.teamInvite.findFirst({
    where: { email: email.trim().toLowerCase(), expiresAt: { gt: new Date() } },
  });
  if (existingInvite) {
    res.status(400).json({ error: 'Pending invite already sent to this email' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.teamInvite.create({
    data: {
      email: email.trim().toLowerCase(),
      role: systemRole,
      customRoleId: customRoleId || null,
      token,
      expiresAt,
      invitedById: payload.userId,
    },
  });

  const inviter = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { name: true },
  });
  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
  const inviteLink = `${baseUrl}/accept-invite?token=${encodeURIComponent(token)}`;

  let roleLabel = systemRole.replace(/_/g, ' ');
  if (customRoleId) {
    const cr = await prisma.customRole.findUnique({ where: { id: customRoleId }, select: { name: true } });
    if (cr) roleLabel = cr.name;
  }

  sendNotificationEmail({
    type: 'team_invite',
    userEmail: email.trim().toLowerCase(),
    dynamicData: {
      inviteLink,
      role: roleLabel,
      inviterName: inviter?.name ?? 'The team',
    },
  }).catch((e) => console.error('[Team] Invite email error:', e));

  res.status(201).json({ ok: true, message: 'Invitation sent' });
}

/** GET /api/v1/team/invite/accept — Validate token, return email and role */
export async function getAcceptInvite(req: Request, res: Response): Promise<void> {
  const token = (req.query.token as string)?.trim();
  if (!token) {
    res.status(400).json({ error: 'token required' });
    return;
  }
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { customRole: { select: { name: true, department: true } } },
  });
  if (!invite || invite.expiresAt < new Date()) {
    res.status(404).json({ error: 'Invalid or expired invite', valid: false });
    return;
  }
  res.json({
    valid: true,
    email: invite.email,
    role: invite.role,
    roleLabel: invite.customRole?.name ?? invite.role.replace(/_/g, ' '),
  });
}

/** POST /api/v1/team/invite/accept — Set password and create account */
export async function postAcceptInvite(req: Request, res: Response): Promise<void> {
  const { token, name, password } = req.body as { token?: string; name?: string; password?: string };

  if (!token?.trim() || !name?.trim() || !password?.trim()) {
    res.status(400).json({ error: 'token, name, and password required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const invite = await prisma.teamInvite.findUnique({
    where: { token: token.trim() },
    include: { customRole: true },
  });
  if (!invite || invite.expiresAt < new Date()) {
    res.status(404).json({ error: 'Invalid or expired invite' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    res.status(400).json({ error: 'Account already exists for this email' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: invite.email,
      name: name.trim(),
      passwordHash,
      role: invite.role as UserRole,
      customRoleId: invite.customRoleId,
      setupPaid: true,
    },
    select: { id: true, name: true, email: true, role: true, tenantId: true, setupPaid: true, setupReason: true },
  });

  await prisma.teamInvite.delete({ where: { id: invite.id } });

  const jwt = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ?? undefined,
  });

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId, setupPaid: user.setupPaid, setupReason: user.setupReason },
    token: jwt,
  });
}

/** PATCH /api/v1/team/:userId — Update role (Super Admin only) */
export async function updateMember(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const { role, customRoleId } = req.body as { role?: string; customRoleId?: string | null };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const updates: { role?: UserRole; customRoleId?: string | null } = {};
  if (role !== undefined && isTeamRole(role)) updates.role = role as UserRole;
  if (customRoleId !== undefined) updates.customRoleId = customRoleId || null;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updates,
    select: { id: true, name: true, email: true, role: true, customRole: { select: { id: true, name: true } } },
  });
  res.json(updated);
}

/** DELETE /api/v1/team/:userId — Remove from team / delete (Super Admin only) */
export async function deleteMember(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const payload = (req as unknown as { user: AuthPayload }).user;

  if (userId === payload.userId) {
    res.status(400).json({ error: 'Cannot remove yourself' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  await prisma.user.delete({ where: { id: userId } });
  res.status(204).send();
}

/** GET /api/v1/team/roles — List custom roles (Super Admin only) */
export async function listCustomRoles(_req: Request, res: Response): Promise<void> {
  const existing = await prisma.customRole.findMany({
    select: { name: true },
  });
  const existingNames = new Set(existing.map((role) => role.name.trim().toLowerCase()));
  const missingDefaults = DEFAULT_CUSTOM_ROLES.filter((role) => !existingNames.has(role.name.trim().toLowerCase()));

  if (missingDefaults.length > 0) {
    await prisma.customRole.createMany({
      data: missingDefaults,
    });
  }

  const roles = await prisma.customRole.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(roles);
}

/** POST /api/v1/team/roles — Create custom role (Super Admin only) */
export async function createCustomRole(req: Request, res: Response): Promise<void> {
  const { name, department, level } = req.body as { name?: string; department?: string; level?: string };

  if (!name?.trim()) {
    res.status(400).json({ error: 'name required' });
    return;
  }

  const role = await prisma.customRole.create({
    data: {
      name: name.trim(),
      department: department?.trim() || null,
      level: level?.trim() || null,
    },
  });
  res.status(201).json(role);
}
