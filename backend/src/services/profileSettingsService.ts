import { PrismaClient, UserRole } from '@prisma/client';
import { deleteFromCloud } from './uploadService';

export const TEAM_MEMBER_ROLES: UserRole[] = [
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

const BUSINESS_ACCOUNT_ROLES: UserRole[] = ['client', 'hiring_company', 'hirer'];

export function isTeamMemberRole(role: UserRole): boolean {
  return TEAM_MEMBER_ROLES.includes(role);
}

export function isBusinessAccountRole(role: UserRole): boolean {
  return BUSINESS_ACCOUNT_ROLES.includes(role);
}

export function computeProfileCompletion(input: {
  role: UserRole;
  avatarUrl?: string | null;
  bio?: string | null;
  companyLogoUrl?: string | null;
}): { percent: number; completed: boolean; requirements: { avatar: boolean; bio: boolean; companyLogo: boolean | null } } {
  const avatar = !!input.avatarUrl?.trim();
  const bio = !!input.bio?.trim();
  const requiresCompanyLogo = isBusinessAccountRole(input.role);
  const companyLogo = requiresCompanyLogo ? !!input.companyLogoUrl?.trim() : true;

  const checks = [avatar, bio, companyLogo];
  const percent = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return {
    percent,
    completed: checks.every(Boolean),
    requirements: {
      avatar,
      bio,
      companyLogo: requiresCompanyLogo ? !!input.companyLogoUrl?.trim() : null,
    },
  };
}

export async function recalculateAndPersistProfileCompletion(
  prisma: PrismaClient,
  userId: string
): Promise<{ profileCompleted: boolean; profileCompletionPercent: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      avatarUrl: true,
      bio: true,
      companyLogoUrl: true,
      client: {
        select: {
          logoUrl: true,
        },
      },
    },
  });

  if (!user) {
    return { profileCompleted: false, profileCompletionPercent: 0 };
  }

  const completion = computeProfileCompletion({
    role: user.role,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    companyLogoUrl: user.companyLogoUrl ?? user.client?.logoUrl ?? null,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      profileCompleted: completion.completed,
      companyLogoUrl: user.companyLogoUrl ?? user.client?.logoUrl ?? null,
    },
  });

  return {
    profileCompleted: completion.completed,
    profileCompletionPercent: completion.percent,
  };
}

export async function deleteUserProfileImages(prisma: PrismaClient, userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      avatarUrl: true,
      companyLogoUrl: true,
      client: { select: { logoUrl: true, coverImageUrl: true } },
    },
  });

  if (!user) return;

  const uniqueUrls = Array.from(
    new Set(
      [user.avatarUrl, user.companyLogoUrl, user.client?.logoUrl, user.client?.coverImageUrl]
        .filter((value): value is string => !!value && value.trim().length > 0)
    )
  );

  await Promise.all(uniqueUrls.map((url) => deleteFromCloud(url).catch(() => {})));
}
