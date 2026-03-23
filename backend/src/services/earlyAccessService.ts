import type { PrismaClient, EarlyAccessUser } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { awardBadge } from './badgeService';

const EARLY_ACCESS_LIMIT = 100;
export const EARLY_ACCESS_REF = 'early_access_superadmin';
const EARLY_ACCESS_REFERRAL_LINK = 'founder-early-access';
const INACTIVE_AFTER_DAYS = 30;
const EARLY_ACCESS_INVITE_SECRET = process.env.EARLY_ACCESS_INVITE_SECRET || process.env.JWT_SECRET || 'dev-secret-change-in-production';
const EARLY_ACCESS_INVITE_EXPIRES_IN = process.env.EARLY_ACCESS_INVITE_EXPIRES_IN || '7d';

interface EarlyAccessInvitePayload {
  type: 'early_access_invite';
  ref: string;
  inviterId: string;
}

function isValidInvitePayload(payload: unknown): payload is EarlyAccessInvitePayload {
  if (!payload || typeof payload !== 'object') return false;
  const data = payload as Partial<EarlyAccessInvitePayload>;
  return data.type === 'early_access_invite' && data.ref === EARLY_ACCESS_REF && typeof data.inviterId === 'string' && data.inviterId.length > 0;
}

export function createEarlyAccessInviteToken(params: { inviterId: string }): string {
  const payload: EarlyAccessInvitePayload = {
    type: 'early_access_invite',
    ref: EARLY_ACCESS_REF,
    inviterId: params.inviterId,
  };
  return jwt.sign(payload, EARLY_ACCESS_INVITE_SECRET, { expiresIn: EARLY_ACCESS_INVITE_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyEarlyAccessInviteToken(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, EARLY_ACCESS_INVITE_SECRET);
    return isValidInvitePayload(decoded);
  } catch {
    return false;
  }
}

async function maybeCompleteAndBadge(prisma: PrismaClient, row: EarlyAccessUser): Promise<void> {
  if (row.status !== 'active') return;
  if (!row.ideaSubmitted || !row.consultationCompleted) return;

  await prisma.$transaction(async (tx) => {
    const current = await tx.earlyAccessUser.findUnique({
      where: { userId: row.userId },
    });
    if (!current) return;
    if (!current.ideaSubmitted || !current.consultationCompleted) return;
    if (current.status !== 'active') return;

    await tx.earlyAccessUser.update({
      where: { userId: row.userId },
      data: { status: 'completed' },
    });
    await awardBadge(tx, { userId: row.userId, badge: 'early_founder' });
  });
}

/** Try to enrol a user into the early access program on idea submission. Returns true if enrolled (within first 100). */
export async function enrollEarlyAccessOnIdeaSubmission(prisma: PrismaClient, params: {
  userId: string;
}): Promise<boolean> {
  const { userId } = params;

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.earlyAccessUser.findUnique({ where: { userId } });
    if (existing) {
      // Ensure ideaSubmitted is marked
      if (!existing.ideaSubmitted) {
        const updated = await tx.earlyAccessUser.update({
          where: { userId },
          data: { ideaSubmitted: true },
        });
        await maybeCompleteAndBadge(prisma, updated);
      }
      return { enrolled: true };
    }

    const total = await tx.earlyAccessUser.count();
    if (total >= EARLY_ACCESS_LIMIT) {
      return { enrolled: false };
    }

    const created = await tx.earlyAccessUser.create({
      data: {
        userId,
        signupOrder: total + 1,
        referralLink: EARLY_ACCESS_REFERRAL_LINK,
        ideaSubmitted: true,
        consultationCompleted: false,
        status: 'active',
      },
    });

    // No need to await inside transaction; run after commit
    void maybeCompleteAndBadge(prisma, created);
    return { enrolled: true };
  });

  return result.enrolled;
}

/** Mark consultation as completed for a user (called when a consultation is booked with their email). */
export async function markEarlyAccessConsultationCompleted(prisma: PrismaClient, params: {
  userId: string;
}): Promise<void> {
  const { userId } = params;
  const row = await prisma.earlyAccessUser.findUnique({ where: { userId } });
  if (!row) return;

  const updated = await prisma.earlyAccessUser.update({
    where: { userId },
    data: { consultationCompleted: true },
  });

  await maybeCompleteAndBadge(prisma, updated);
}

/** Public status summary for landing / invite pages. */
export async function getEarlyAccessStatus(prisma: PrismaClient): Promise<{
  limit: number;
  total: number;
  remaining: number;
  enabled: boolean;
}> {
  const total = await prisma.earlyAccessUser.count();
  const remaining = Math.max(0, EARLY_ACCESS_LIMIT - total);
  return {
    limit: EARLY_ACCESS_LIMIT,
    total,
    remaining,
    enabled: remaining > 0,
  };
}

/** Fetch a user's early-access row, lazily marking it inactive if they've been away too long. */
export async function getEarlyAccessForUser(prisma: PrismaClient, params: {
  userId: string;
}): Promise<EarlyAccessUser | null> {
  const { userId } = params;
  const row = await prisma.earlyAccessUser.findUnique({
    where: { userId },
  });
  if (!row) return null;

  if (row.status !== 'active') return row;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastLoginAt: true },
  });
  if (!user?.lastLoginAt) return row;

  const cutoff = Date.now() - INACTIVE_AFTER_DAYS * 24 * 60 * 60 * 1000;
  if (user.lastLoginAt.getTime() < cutoff) {
    const updated = await prisma.earlyAccessUser.update({
      where: { userId },
      data: { status: 'inactive' },
    });
    return updated;
  }

  return row;
}


