import { PrismaClient, UserRole } from '@prisma/client';
import type { EarlyAccessUser, ManualPayment, UserBadge } from '@prisma/client';

const prisma = new PrismaClient();

export type DashboardFeatureKey =
  | 'idea_workspace'
  | 'ai_guidance'
  | 'consultations'
  | 'marketplace'
  | 'donor_badge'
  | 'early_founder'
  | 'admin_dashboard';

export interface UserFeatureState {
  userId: string;
  role: UserRole;
  /**
   * True when onboarding/setup is unlocked:
   * - setupPaid = true
   * - OR Early Founder scholarship active/completed
   * - OR admin/team roles with implicit access
   */
  hasSetupAccess: boolean;
  /** True when the user can post/browse in the talent & hiring marketplace with full powers. */
  hasMarketplaceAccess: boolean;
  /** True for Early Founder scholarship users (badge or earlyAccess row). */
  isEarlyFounder: boolean;
  /** True when user has made a donation and holds donor badge. */
  hasDonorBadge: boolean;
  /** True when a manual (bank transfer) payment is awaiting admin verification. */
  hasPendingManualPayment: boolean;
  /** Latest pending manual payment, if any (for UX messaging). */
  pendingManualPayment?: Pick<ManualPayment, 'id' | 'amount' | 'currency' | 'paymentType' | 'submittedAt'>;
  /** Raw early-access row (for debugging / richer dashboards). */
  earlyAccess?: Pick<
    EarlyAccessUser,
    'status' | 'signupOrder' | 'ideaSubmitted' | 'consultationCompleted'
  > | null;
  /** All badges for this user (used by dashboard to decorate UI). */
  badges: Pick<UserBadge, 'badgeName' | 'dateAwarded'>[];
  /** Computed list of logical feature keys that are currently unlocked. */
  unlockedFeatures: DashboardFeatureKey[];
}

const ADMIN_OR_TEAM_ROLES: UserRole[] = [
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

export async function getUserFeatureState(userId: string): Promise<UserFeatureState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      setupPaid: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const [badges, earlyAccess, pendingManual, talentProfile, hirerProfile] = await Promise.all([
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeName: true, dateAwarded: true },
      orderBy: { dateAwarded: 'asc' },
    }),
    prisma.earlyAccessUser.findUnique({
      where: { userId },
      select: {
        status: true,
        signupOrder: true,
        ideaSubmitted: true,
        consultationCompleted: true,
      },
    }),
    prisma.manualPayment.findFirst({
      where: { userId, status: 'Pending' },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentType: true,
        submittedAt: true,
      },
    }),
    prisma.talent.findUnique({
      where: { userId },
      select: { feePaid: true, status: true, hiddenByAdmin: true },
    }),
    prisma.hirer.findUnique({
      where: { userId },
      select: { feePaid: true },
    }),
  ]);

  const hasEarlyFounderBadge = badges.some((b) => b.badgeName === 'early_founder');
  const hasDonorBadge = badges.some((b) => b.badgeName === 'donor_supporter');

  const isEarlyFounder =
    hasEarlyFounderBadge ||
    (earlyAccess != null && (earlyAccess.status === 'active' || earlyAccess.status === 'completed'));

  const isAdminOrTeam = ADMIN_OR_TEAM_ROLES.includes(user.role);

  const hasSetupAccess = Boolean(user.setupPaid || isEarlyFounder || isAdminOrTeam);

  let hasMarketplaceAccess = false;
  if (user.role === 'talent') {
    // Talents: marketplace access based on approval, not payment.
    hasMarketplaceAccess = Boolean(talentProfile && talentProfile.status === 'approved' && !talentProfile.hiddenByAdmin);
  } else if (user.role === 'hirer' || user.role === 'hiring_company') {
    hasMarketplaceAccess = Boolean(hirerProfile?.feePaid);
  } else if (user.role === 'investor') {
    // Investors can browse startups without an extra marketplace fee.
    hasMarketplaceAccess = true;
  } else if (isAdminOrTeam) {
    // Admin/staff can see marketplace for moderation.
    hasMarketplaceAccess = true;
  }

  const unlockedFeatures = new Set<DashboardFeatureKey>();

  if (hasSetupAccess) {
    unlockedFeatures.add('idea_workspace');
    unlockedFeatures.add('ai_guidance');
    unlockedFeatures.add('consultations');
  }

  if (hasMarketplaceAccess) {
    unlockedFeatures.add('marketplace');
  }

  if (isEarlyFounder) {
    unlockedFeatures.add('early_founder');
  }

  if (hasDonorBadge) {
    unlockedFeatures.add('donor_badge');
  }

  if (isAdminOrTeam) {
    unlockedFeatures.add('admin_dashboard');
  }

  return {
    userId: user.id,
    role: user.role,
    hasSetupAccess,
    hasMarketplaceAccess,
    isEarlyFounder,
    hasDonorBadge,
    hasPendingManualPayment: Boolean(pendingManual),
    pendingManualPayment: pendingManual ?? undefined,
    earlyAccess: earlyAccess ?? null,
    badges,
    unlockedFeatures: Array.from(unlockedFeatures),
  };
}

