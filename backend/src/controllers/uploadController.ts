import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import {
  UPLOAD_TYPES,
  type UploadType,
  validateFile,
  uploadToCloud,
  isUploadEnabled,
} from '../services/uploadService';

const prisma = new PrismaClient();

/** POST /api/v1/upload — Auth required. Body: type (resume|cv|portfolio|avatar|project_media), file in multipart */
export async function upload(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const type = (req.body?.type || req.query?.type) as UploadType | undefined;
  const file = req.file;

  if (!type || !UPLOAD_TYPES.includes(type)) {
    res.status(400).json({ error: `type required: one of ${UPLOAD_TYPES.join(', ')}` });
    return;
  }
  const fileBuffer = (file as Express.Multer.File & { buffer?: Buffer }).buffer;
  const filePath = (file as Express.Multer.File).path;
  if (!fileBuffer && !filePath) {
    res.status(400).json({ error: 'No file uploaded. Use multipart/form-data with field "file".' });
    return;
  }

  const mimetype = (file.mimetype || '').toLowerCase();
  const size = file.size || (fileBuffer && fileBuffer.length) || 0;
  const validation = validateFile(type as UploadType, mimetype, size);
  if (!validation.ok) {
    res.status(400).json({ error: 'error' in validation ? validation.error : 'Invalid file' });
    return;
  }

  if (!isUploadEnabled()) {
    res.status(503).json({
      error: 'File upload not configured. Use direct URL for resume/cv/portfolio in profile.',
      url: null,
    });
    return;
  }

  try {
    const buffer = fileBuffer || (await import('fs').then((fs) => fs.promises.readFile(filePath)));
    const folder = `riseflow/${type}/${payload.userId}`;
    const result = await uploadToCloud(
      Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
      type as UploadType,
      mimetype,
      folder,
      file.originalname
    );

    if (type === 'avatar') {
      await prisma.user.update({
        where: { id: payload.userId },
        data: { avatarUrl: result.secureUrl },
      });
    }
    const talent = await prisma.talent.findUnique({ where: { userId: payload.userId } });
    if (talent) {
      if (type === 'resume') {
        await prisma.talent.update({ where: { id: talent.id }, data: { resumeUrl: result.secureUrl } });
      } else if (type === 'cv') {
        await prisma.talent.update({ where: { id: talent.id }, data: { cvUrl: result.secureUrl } });
      } else if (type === 'portfolio') {
        const past = (talent.pastProjects as Array<{ url?: string; title?: string }>) || [];
        const updated = [...past, { url: result.secureUrl, title: file.originalname || 'Portfolio file' }];
        await prisma.talent.update({ where: { id: talent.id }, data: { pastProjects: updated } });
      }
    }

    res.json({
      url: result.secureUrl,
      publicId: result.publicId,
      type,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Upload failed',
    });
  }
}
