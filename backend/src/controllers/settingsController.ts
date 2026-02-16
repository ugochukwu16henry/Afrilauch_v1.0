import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { comparePassword, hashPassword } from '../utils/hash';
import { sendNotificationEmail } from '../services/emailService';

const prisma = new PrismaClient();

async function logSettingsActivity(params: {
  userId: string;
  action: string;
  fieldChanged?: string;
  oldValue?: unknown;
  newValue?: unknown;
}): Promise<void> {
  const { userId, action, fieldChanged, oldValue, newValue } = params;
  await prisma.settingsActivityLog.create({
    data: {
      userId,
      action,
      fieldChanged: fieldChanged ?? null,
      oldValue: oldValue !== undefined ? JSON.stringify(oldValue) : null,
      newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
    },
  });
}

/** GET /api/v1/settings/profile */
export async function getProfile(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      bio: true,
      jobTitle: true,
      website: true,
      linkedinUrl: true,
      twitterUrl: true,
      phone: true,
      country: true,
      timezone: true,
      role: true,
      client: {
        select: {
          businessName: true,
          industry: true,
          companySize: true,
          headquarters: true,
          logoUrl: true,
          coverImageUrl: true,
        },
      },
    },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
}

/** PUT /api/v1/settings/profile */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const {
    name,
    displayName,
    bio,
    jobTitle,
    website,
    linkedinUrl,
    twitterUrl,
    phone,
    country,
    timezone,
    avatarUrl,
    company,
  } = req.body as {
    name?: string;
    displayName?: string;
    bio?: string;
    jobTitle?: string;
    website?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    phone?: string;
    country?: string;
    timezone?: string;
    avatarUrl?: string;
    company?: {
      businessName?: string;
      industry?: string;
      companySize?: string;
      headquarters?: string;
      logoUrl?: string;
      coverImageUrl?: string;
    };
  };
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      displayName: true,
      bio: true,
      jobTitle: true,
      website: true,
      linkedinUrl: true,
      twitterUrl: true,
      phone: true,
      country: true,
      timezone: true,
      avatarUrl: true,
    },
  });
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (displayName !== undefined) updates.displayName = displayName;
  if (bio !== undefined) updates.bio = bio;
  if (jobTitle !== undefined) updates.jobTitle = jobTitle;
  if (website !== undefined) updates.website = website;
  if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl;
  if (twitterUrl !== undefined) updates.twitterUrl = twitterUrl;
  if (phone !== undefined) updates.phone = phone;
  if (country !== undefined) updates.country = country;
  if (timezone !== undefined) updates.timezone = timezone;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        bio: true,
        jobTitle: true,
        website: true,
        linkedinUrl: true,
        twitterUrl: true,
        phone: true,
        country: true,
        timezone: true,
        role: true,
      },
    }),
    company
      ? prisma.client.upsert({
          where: { userId },
          create: {
            userId,
            businessName: company.businessName || 'Company',
            industry: company.industry || null,
            companySize: company.companySize || null,
            headquarters: company.headquarters || null,
            logoUrl: company.logoUrl || null,
            coverImageUrl: company.coverImageUrl || null,
          },
          update: {
            ...(company.businessName !== undefined && { businessName: company.businessName }),
            ...(company.industry !== undefined && { industry: company.industry }),
            ...(company.companySize !== undefined && { companySize: company.companySize }),
            ...(company.headquarters !== undefined && { headquarters: company.headquarters }),
            ...(company.logoUrl !== undefined && { logoUrl: company.logoUrl }),
            ...(company.coverImageUrl !== undefined && { coverImageUrl: company.coverImageUrl }),
          },
        })
      : (null as any),
  ]);

  // Basic per-field activity log
  if (existing) {
    const fields: (keyof typeof existing)[] = [
      'name',
      'displayName',
      'bio',
      'jobTitle',
      'website',
      'linkedinUrl',
      'twitterUrl',
      'phone',
      'country',
      'timezone',
      'avatarUrl',
    ];
    await Promise.all(
      fields.map((field) => {
        if (field in updates && (existing as any)[field] !== (user as any)[field]) {
          return logSettingsActivity({
            userId,
            action: 'update_profile',
            fieldChanged: field,
            oldValue: (existing as any)[field],
            newValue: (user as any)[field],
          });
        }
        return Promise.resolve();
      })
    );
  }

  res.json(user);
}

/** PUT /api/v1/settings/security/email */
export async function updateEmail(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { newEmail, password } = req.body as { newEmail: string; password: string };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (!(await comparePassword(password, user.passwordHash))) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing && existing.id !== userId) {
    res.status(400).json({ error: 'Email is already in use' });
    return;
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { email: newEmail, verified: false },
    select: { id: true, name: true, email: true },
  });
  await logSettingsActivity({
    userId,
    action: 'change_email',
    fieldChanged: 'email',
    oldValue: user.email,
    newValue: newEmail,
  });
  res.json(updated);
}

/** PUT /api/v1/settings/security/password */
export async function updatePassword(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (!(await comparePassword(currentPassword, user.passwordHash))) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
  await logSettingsActivity({
    userId,
    action: 'change_password',
    fieldChanged: 'passwordHash',
  });
  res.json({ ok: true });
}

/** POST /api/v1/settings/security/2fa-enable */
export async function enable2FA(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { enabled } = req.body as { enabled: boolean };
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: !!enabled },
    select: { id: true, twoFactorEnabled: true },
  });
  await logSettingsActivity({
    userId,
    action: enabled ? 'enable_2fa' : 'disable_2fa',
    fieldChanged: 'twoFactorEnabled',
    newValue: enabled,
  });
  res.json(updated);
}

/** GET /api/v1/settings/security/sessions — login activity derived from AuditLog */
export async function listSessions(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const logs = await prisma.auditLog.findMany({
    where: { adminId: userId, actionType: 'login' },
    orderBy: { timestamp: 'desc' },
    take: 20,
  });
  res.json({
    sessions: logs.map((l) => ({
      id: l.id,
      createdAt: l.timestamp,
      details: l.details,
    })),
  });
}

/** DELETE /api/v1/settings/security/sessions/:id — placeholder (no-op) */
export async function revokeSession(_req: Request, res: Response): Promise<void> {
  res.json({ ok: true });
}

/** GET /api/v1/settings/notifications */
export async function getNotificationSettings(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const row = await prisma.notificationSettings.findUnique({ where: { userId } });
  if (!row) {
    res.json({
      emailNotifications: true,
      inAppNotifications: true,
      dealUpdates: true,
      investorMessages: true,
      projectAlerts: true,
      marketingEmails: false,
    });
    return;
  }
  res.json(row);
}

/** PUT /api/v1/settings/notifications */
export async function updateNotificationSettings(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const {
    emailNotifications,
    inAppNotifications,
    dealUpdates,
    investorMessages,
    projectAlerts,
    marketingEmails,
  } = req.body as Partial<{
    emailNotifications: boolean;
    inAppNotifications: boolean;
    dealUpdates: boolean;
    investorMessages: boolean;
    projectAlerts: boolean;
    marketingEmails: boolean;
  }>;
  const updated = await prisma.notificationSettings.upsert({
    where: { userId },
    create: {
      userId,
      emailNotifications: emailNotifications ?? true,
      inAppNotifications: inAppNotifications ?? true,
      dealUpdates: dealUpdates ?? true,
      investorMessages: investorMessages ?? true,
      projectAlerts: projectAlerts ?? true,
      marketingEmails: marketingEmails ?? false,
    },
    update: {
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(inAppNotifications !== undefined && { inAppNotifications }),
      ...(dealUpdates !== undefined && { dealUpdates }),
      ...(investorMessages !== undefined && { investorMessages }),
      ...(projectAlerts !== undefined && { projectAlerts }),
      ...(marketingEmails !== undefined && { marketingEmails }),
    },
  });
  await logSettingsActivity({
    userId,
    action: 'update_notifications',
    newValue: updated,
  });
  res.json(updated);
}

/** POST /api/v1/settings/delete-request */
export async function requestDelete(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { reason, otherReason } = req.body as { reason?: string; otherReason?: string };
  const payload = (req as unknown as { user: AuthPayload }).user;
  const reasonText = otherReason || reason || null;
  await prisma.accountStatus.create({
    data: {
      userId,
      status: 'pending_deletion',
      reason: reasonText,
      setById: payload.userId,
    },
  });
  await logSettingsActivity({
    userId,
    action: 'request_delete',
    fieldChanged: 'account_status',
    newValue: 'pending_deletion',
  });
  res.json({ status: 'pending_deletion' });
}

/** POST /api/v1/settings/delete-cancel */
export async function cancelDelete(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  await prisma.accountStatus.create({
    data: {
      userId,
      status: 'active',
      reason: 'User cancelled deletion request',
      setById: userId,
    },
  });
  await logSettingsActivity({
    userId,
    action: 'cancel_delete',
    fieldChanged: 'account_status',
    newValue: 'active',
  });
  res.json({ status: 'active' });
}

/** GET /api/v1/settings/preferences */
export async function getPreferences(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
  if (!prefs) {
    res.json({ theme: 'system', language: 'en', dashboardLayout: 'default' });
    return;
  }
  res.json(prefs);
}

/** PUT /api/v1/settings/preferences */
export async function updatePreferences(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { theme, language, dashboardLayout } = req.body as Partial<{
    theme: string;
    language: string;
    dashboardLayout: string;
  }>;
  const updated = await prisma.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      theme: theme ?? 'system',
      language: language ?? 'en',
      dashboardLayout: dashboardLayout ?? 'default',
    },
    update: {
      ...(theme && { theme }),
      ...(language && { language }),
      ...(dashboardLayout && { dashboardLayout }),
    },
  });
  await logSettingsActivity({
    userId,
    action: 'update_preferences',
    newValue: updated,
  });
  res.json(updated);
}

/** GET /api/v1/settings/privacy */
export async function getPrivacy(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const row = await prisma.privacySettings.findUnique({ where: { userId } });
  if (!row) {
    res.json({ profileVisibility: 'public', messagePreference: 'anyone' });
    return;
  }
  res.json(row);
}

/** PUT /api/v1/settings/privacy */
export async function updatePrivacy(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { profileVisibility, messagePreference } = req.body as Partial<{
    profileVisibility: string;
    messagePreference: string;
  }>;
  const updated = await prisma.privacySettings.upsert({
    where: { userId },
    create: {
      userId,
      profileVisibility: profileVisibility ?? 'public',
      messagePreference: messagePreference ?? 'anyone',
    },
    update: {
      ...(profileVisibility && { profileVisibility }),
      ...(messagePreference && { messagePreference }),
    },
  });
  await logSettingsActivity({
    userId,
    action: 'update_privacy',
    newValue: updated,
  });
  res.json(updated);
}

/** GET /api/v1/settings/billing */
export async function getBilling(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const [userPayments, projects] = await Promise.all([
    prisma.userPayment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.project.findMany({
      where: { client: { userId } },
      select: { id: true, projectName: true, status: true },
    }),
  ]);
  const setupFeeStatus =
    userPayments.find((p) => p.type === 'setup_fee' && p.status === 'completed') ? 'paid' : 'unpaid';

  res.json({
    setupFeeStatus,
    marketplaceFeeStatus: 'enabled', // placeholder until marketplace fee model is added
    payments: userPayments.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      type: p.type,
      status: p.status,
      createdAt: p.createdAt,
      metadata: p.metadata,
    })),
    relatedProjects: projects,
  });
}

/** GET /api/v1/settings/data-export */
export async function exportData(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const [user, client, investor, projects, agreements] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.client.findUnique({ where: { userId } }),
    prisma.investor.findUnique({ where: { userId } }),
    prisma.project.findMany({ where: { client: { userId } } }),
    prisma.assignedAgreement.findMany({ where: { userId } }),
  ]);
  const payload = { user, client, investor, projects, agreements };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=riseflow-data-export.json');
  res.send(JSON.stringify(payload, null, 2));
}

/** GET /api/v1/settings/account-status */
export async function getAccountStatus(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const last = await prisma.accountStatus.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ status: last?.status ?? 'active', last });
}
