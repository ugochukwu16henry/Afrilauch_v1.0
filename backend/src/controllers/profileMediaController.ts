import { PrismaClient, UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import type { AuthPayload } from '../middleware/auth';
import { createAuditLog } from '../services/auditLogService';
import {
  deleteFromCloud,
  isUploadEnabled,
  optimizeImageBuffer,
  uploadToCloud,
  validateFile,
} from '../services/uploadService';
import {
  computeProfileCompletion,
  recalculateAndPersistProfileCompletion,
} from '../services/profileSettingsService';

const prisma = new PrismaClient();

function resolveUserId(req: Request): string {
  return (req as unknown as { user: AuthPayload }).user.userId;
}

function isSuperAdminRole(role: UserRole): boolean {
  return role === 'super_admin';
}

function getFile(req: Request): Express.Multer.File | null {
  const direct = req.file as Express.Multer.File | undefined;
  if (direct) return direct;
  const maybeFiles = (req as Request & { files?: unknown }).files;
  if (Array.isArray(maybeFiles) && maybeFiles[0]) return maybeFiles[0] as Express.Multer.File;
  if (maybeFiles && typeof maybeFiles === 'object' && 'file' in (maybeFiles as Record<string, unknown>)) {
    return (maybeFiles as Record<string, unknown>).file as Express.Multer.File;
  }
  return null;
}

async function buildProfileMediaStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      avatarUrl: true,
      companyLogoUrl: true,
      bio: true,
      profileCompleted: true,
      client: {
        select: {
          logoUrl: true,
        },
      },
    },
  });

  if (!user) return null;

  const completion = computeProfileCompletion({
    role: user.role,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    companyLogoUrl: user.companyLogoUrl ?? user.client?.logoUrl ?? null,
  });

  return {
    id: user.id,
    role: user.role,
    avatarUrl: user.avatarUrl,
    companyLogoUrl: user.companyLogoUrl ?? user.client?.logoUrl ?? null,
    profileCompleted: user.profileCompleted,
    profileCompletionPercent: completion.percent,
    completionRequirements: completion.requirements,
  };
}

/** GET /api/v1/settings/profile/media-status */
export async function getMediaStatus(req: Request, res: Response): Promise<void> {
  const userId = resolveUserId(req);
  const status = await buildProfileMediaStatus(userId);
  if (!status) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(status);
}

/** POST /api/v1/settings/profile/avatar */
export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  const userId = resolveUserId(req);
  const file = getFile(req);

  if (!file) {
    res.status(400).json({ error: 'No file uploaded. Use multipart/form-data with field "file".' });
    return;
  }

  const validation = validateFile('avatar', (file.mimetype || '').toLowerCase(), file.size || 0);
  if (!validation.ok) {
    res.status(400).json({ error: 'error' in validation ? validation.error : 'Invalid file' });
    return;
  }

  if (!isUploadEnabled()) {
    res.status(503).json({ error: 'Profile image upload is not configured.' });
    return;
  }

  try {
    const optimized = await optimizeImageBuffer(file.buffer, file.mimetype, {
      maxWidth: 512,
      maxHeight: 512,
      quality: 82,
    });

    const upload = await uploadToCloud(
      optimized.buffer,
      'avatar',
      optimized.mimetype,
      `riseflow/profile/avatar/${userId}`,
      file.originalname || `avatar-${Date.now()}`
    );

    const current = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: upload.secureUrl },
    });

    if (current?.avatarUrl && current.avatarUrl !== upload.secureUrl) {
      deleteFromCloud(current.avatarUrl).catch(() => {});
    }

    const completion = await recalculateAndPersistProfileCompletion(prisma, userId);

    await prisma.settingsActivityLog.create({
      data: {
        userId,
        action: 'update_profile_avatar',
        fieldChanged: 'avatarUrl',
        oldValue: current?.avatarUrl ? JSON.stringify(current.avatarUrl) : null,
        newValue: JSON.stringify(upload.secureUrl),
      },
    });

    await createAuditLog(prisma, {
      adminId: userId,
      actionType: 'profile_avatar_updated',
      entityType: 'settings',
      entityId: userId,
      details: { avatarUrl: upload.secureUrl },
    });

    res.json({
      avatarUrl: upload.secureUrl,
      publicId: upload.publicId,
      profileCompleted: completion.profileCompleted,
      profileCompletionPercent: completion.profileCompletionPercent,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to upload avatar' });
  }
}

/** DELETE /api/v1/settings/profile/avatar */
export async function deleteAvatar(req: Request, res: Response): Promise<void> {
  const userId = resolveUserId(req);
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null, profileCompleted: false },
  });

  if (current?.avatarUrl) {
    deleteFromCloud(current.avatarUrl).catch(() => {});
  }

  const completion = await recalculateAndPersistProfileCompletion(prisma, userId);

  await prisma.settingsActivityLog.create({
    data: {
      userId,
      action: 'delete_profile_avatar',
      fieldChanged: 'avatarUrl',
      oldValue: current?.avatarUrl ? JSON.stringify(current.avatarUrl) : null,
      newValue: null,
    },
  });

  await createAuditLog(prisma, {
    adminId: userId,
    actionType: 'profile_avatar_deleted',
    entityType: 'settings',
    entityId: userId,
    details: { avatarDeleted: true },
  });

  res.json({
    avatarUrl: null,
    profileCompleted: completion.profileCompleted,
    profileCompletionPercent: completion.profileCompletionPercent,
  });
}

/** POST /api/v1/settings/profile/company-logo */
export async function uploadCompanyLogo(req: Request, res: Response): Promise<void> {
  const userId = resolveUserId(req);
  const file = getFile(req);

  if (!file) {
    res.status(400).json({ error: 'No file uploaded. Use multipart/form-data with field "file".' });
    return;
  }

  const validation = validateFile('avatar', (file.mimetype || '').toLowerCase(), file.size || 0);
  if (!validation.ok) {
    res.status(400).json({ error: 'error' in validation ? validation.error : 'Invalid file' });
    return;
  }

  if (!isUploadEnabled()) {
    res.status(503).json({ error: 'Company logo upload is not configured.' });
    return;
  }

  try {
    const optimized = await optimizeImageBuffer(file.buffer, file.mimetype, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 84,
    });

    const upload = await uploadToCloud(
      optimized.buffer,
      'avatar',
      optimized.mimetype,
      `riseflow/profile/company-logo/${userId}`,
      file.originalname || `company-logo-${Date.now()}`
    );

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyLogoUrl: true, client: { select: { logoUrl: true } } },
    });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          companyLogoUrl: upload.secureUrl,
        },
      }),
      prisma.client.upsert({
        where: { userId },
        create: {
          userId,
          businessName: 'Company',
          logoUrl: upload.secureUrl,
        },
        update: {
          logoUrl: upload.secureUrl,
        },
      }),
    ]);

    const oldUrl = existing?.companyLogoUrl ?? existing?.client?.logoUrl ?? null;
    if (oldUrl && oldUrl !== upload.secureUrl) {
      deleteFromCloud(oldUrl).catch(() => {});
    }

    const completion = await recalculateAndPersistProfileCompletion(prisma, userId);

    await prisma.settingsActivityLog.create({
      data: {
        userId,
        action: 'update_company_logo',
        fieldChanged: 'companyLogoUrl',
        oldValue: oldUrl ? JSON.stringify(oldUrl) : null,
        newValue: JSON.stringify(upload.secureUrl),
      },
    });

    await createAuditLog(prisma, {
      adminId: userId,
      actionType: 'company_logo_updated',
      entityType: 'settings',
      entityId: userId,
      details: { companyLogoUrl: upload.secureUrl },
    });

    res.json({
      companyLogoUrl: upload.secureUrl,
      publicId: upload.publicId,
      profileCompleted: completion.profileCompleted,
      profileCompletionPercent: completion.profileCompletionPercent,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to upload company logo' });
  }
}

/** DELETE /api/v1/settings/profile/company-logo */
export async function deleteCompanyLogo(req: Request, res: Response): Promise<void> {
  const userId = resolveUserId(req);
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyLogoUrl: true, client: { select: { logoUrl: true } } },
  });

  const oldUrl = existing?.companyLogoUrl ?? existing?.client?.logoUrl ?? null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { companyLogoUrl: null },
    }),
    prisma.client.updateMany({
      where: { userId },
      data: { logoUrl: null },
    }),
  ]);

  if (oldUrl) {
    deleteFromCloud(oldUrl).catch(() => {});
  }

  const completion = await recalculateAndPersistProfileCompletion(prisma, userId);

  await prisma.settingsActivityLog.create({
    data: {
      userId,
      action: 'delete_company_logo',
      fieldChanged: 'companyLogoUrl',
      oldValue: oldUrl ? JSON.stringify(oldUrl) : null,
      newValue: null,
    },
  });

  await createAuditLog(prisma, {
    adminId: userId,
    actionType: 'company_logo_deleted',
    entityType: 'settings',
    entityId: userId,
    details: { companyLogoDeleted: true },
  });

  res.json({
    companyLogoUrl: null,
    profileCompleted: completion.profileCompleted,
    profileCompletionPercent: completion.profileCompletionPercent,
  });
}

/** POST /api/v1/settings/admin/users/:userId/avatar */
export async function adminUploadUserAvatar(req: Request, res: Response): Promise<void> {
  const actor = (req as unknown as { user: AuthPayload }).user;
  const targetUserId = req.params.userId;
  const file = getFile(req);

  if (!isSuperAdminRole(actor.role)) {
    res.status(403).json({ error: 'Super Admin access only' });
    return;
  }

  if (!file) {
    res.status(400).json({ error: 'No file uploaded. Use multipart/form-data with field "file".' });
    return;
  }

  const validation = validateFile('avatar', (file.mimetype || '').toLowerCase(), file.size || 0);
  if (!validation.ok) {
    res.status(400).json({ error: 'error' in validation ? validation.error : 'Invalid file' });
    return;
  }

  const optimized = await optimizeImageBuffer(file.buffer, file.mimetype, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 82,
  });

  const upload = await uploadToCloud(
    optimized.buffer,
    'avatar',
    optimized.mimetype,
    `riseflow/profile/avatar/${targetUserId}`,
    file.originalname || `avatar-${Date.now()}`
  );

  const previous = await prisma.user.findUnique({ where: { id: targetUserId }, select: { avatarUrl: true } });
  if (!previous) {
    res.status(404).json({ error: 'Target user not found' });
    return;
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { avatarUrl: upload.secureUrl },
  });

  if (previous.avatarUrl && previous.avatarUrl !== upload.secureUrl) {
    deleteFromCloud(previous.avatarUrl).catch(() => {});
  }

  await recalculateAndPersistProfileCompletion(prisma, targetUserId);

  await createAuditLog(prisma, {
    adminId: actor.userId,
    actionType: 'admin_profile_avatar_updated',
    entityType: 'user',
    entityId: targetUserId,
    details: {
      oldAvatarUrl: previous.avatarUrl,
      newAvatarUrl: upload.secureUrl,
      updatedByRole: actor.role,
    },
  });

  res.json({ ok: true, avatarUrl: upload.secureUrl });
}

/** DELETE /api/v1/settings/admin/users/:userId/avatar */
export async function adminDeleteUserAvatar(req: Request, res: Response): Promise<void> {
  const actor = (req as unknown as { user: AuthPayload }).user;
  const targetUserId = req.params.userId;

  if (!isSuperAdminRole(actor.role)) {
    res.status(403).json({ error: 'Super Admin access only' });
    return;
  }

  const previous = await prisma.user.findUnique({ where: { id: targetUserId }, select: { avatarUrl: true } });
  if (!previous) {
    res.status(404).json({ error: 'Target user not found' });
    return;
  }

  await prisma.user.update({ where: { id: targetUserId }, data: { avatarUrl: null, profileCompleted: false } });
  if (previous.avatarUrl) {
    deleteFromCloud(previous.avatarUrl).catch(() => {});
  }

  await recalculateAndPersistProfileCompletion(prisma, targetUserId);

  await createAuditLog(prisma, {
    adminId: actor.userId,
    actionType: 'admin_profile_avatar_deleted',
    entityType: 'user',
    entityId: targetUserId,
    details: {
      oldAvatarUrl: previous.avatarUrl,
      deletedByRole: actor.role,
    },
  });

  res.json({ ok: true, avatarUrl: null });
}
