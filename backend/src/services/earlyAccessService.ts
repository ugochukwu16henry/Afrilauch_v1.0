import type { PrismaClient, EarlyAccessUser } from '@prisma/client';
import { awardBadge } from './badgeService';

const EARLY_ACCESS_LIMIT = 20;
export const EARLY_ACCESS_REF = 'early_access_superadmin';
const EARLY_ACCESS_REFERRAL_LINK = 'founder-early-access';
const INACTIVE_AFTER_DAYS = 30;

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

/** Try to enrol a user into the early access program on idea submission. Returns true if enrolled (within first 20). */
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


