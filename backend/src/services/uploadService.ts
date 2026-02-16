/**
 * Upload service: Cloudinary or S3-compatible (e.g. Railway Storage Bucket).
 * When Railway bucket vars are set (ENDPOINT, BUCKET, ACCESS_KEY_ID, SECRET_ACCESS_KEY), S3 is used.
 * Otherwise Cloudinary is used if CLOUDINARY_* are set.
 * Validates file type and size. Allowed: resume/cv (pdf, docx), portfolio (pdf, docx, jpg, png), avatar (jpg, png), project_media (jpg, png, mp4), receipt.
 */

import { v2 as cloudinary } from 'cloudinary';
import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

const s3Endpoint = process.env.ENDPOINT?.trim();
const s3Bucket = process.env.BUCKET?.trim();
const s3AccessKey = process.env.ACCESS_KEY_ID?.trim();
const s3SecretKey = process.env.SECRET_ACCESS_KEY?.trim();
const s3Region = process.env.REGION?.trim() || 'auto';

const useS3 = !!(s3Endpoint && s3Bucket && s3AccessKey && s3SecretKey);

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

let s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: s3Region,
      endpoint: s3Endpoint,
      credentials: { accessKeyId: s3AccessKey!, secretAccessKey: s3SecretKey! },
      forcePathStyle: false,
    });
  }
  return s3Client;
}

export const UPLOAD_TYPES = ['resume', 'cv', 'portfolio', 'avatar', 'project_media', 'receipt'] as const;
export type UploadType = (typeof UPLOAD_TYPES)[number];

const ALLOWED: Record<UploadType, string[]> = {
  resume: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  cv: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  portfolio: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'],
  avatar: ['image/jpeg', 'image/png', 'image/webp'],
  project_media: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  receipt: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

const MAX_SIZE_BYTES: Record<UploadType, number> = {
  resume: 10 * 1024 * 1024,   // 10 MB
  cv: 10 * 1024 * 1024,
  portfolio: 10 * 1024 * 1024,
  avatar: 5 * 1024 * 1024,   // 5 MB
  project_media: 100 * 1024 * 1024, // 100 MB for video
  receipt: 10 * 1024 * 1024, // 10 MB for payment receipt
};

export function isUploadEnabled(): boolean {
  return useS3 || !!(cloudName && apiKey && apiSecret);
}

export function validateFile(
  type: UploadType,
  mimetype: string,
  size: number
): { ok: true } | { ok: false; error: string } {
  const allowed = ALLOWED[type];
  const mime = (mimetype || '').toLowerCase();
  if (!allowed.includes(mime)) {
    return { ok: false, error: `Invalid file type for ${type}. Allowed: ${allowed.join(', ')}` };
  }
  if (size > MAX_SIZE_BYTES[type]) {
    const maxMb = Math.round(MAX_SIZE_BYTES[type] / (1024 * 1024));
    return { ok: false, error: `File too large. Max for ${type}: ${maxMb} MB` };
  }
  return { ok: true };
}

/** Get resource_type for Cloudinary: image, video, or raw (for PDF/doc) */
function resourceType(type: UploadType, mimetype: string): 'image' | 'video' | 'raw' {
  if (type === 'project_media' && mimetype === 'video/mp4') return 'video';
  if (['image/jpeg', 'image/png', 'image/webp'].includes(mimetype)) return 'image';
  return 'raw';
}

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
}

/** Presigned URL expiry for S3 (1 year so links in DB stay valid) */
const S3_PRESIGN_EXPIRY = 365 * 24 * 60 * 60;

async function uploadToS3(
  buffer: Buffer,
  type: UploadType,
  mimetype: string,
  folder: string,
  fileName?: string
): Promise<UploadResult> {
  const ext = mimetype.includes('png') ? 'png' : mimetype.includes('webp') ? 'webp' : mimetype.includes('mp4') ? 'mp4' : mimetype.includes('pdf') ? 'pdf' : 'jpg';
  const uniqueId = fileName ? fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_') : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const key = `${folder}/${uniqueId}.${ext}`;
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: s3Bucket!,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );
  const presignedUrl = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: s3Bucket!, Key: key }),
    { expiresIn: S3_PRESIGN_EXPIRY }
  );
  return {
    url: presignedUrl,
    publicId: key,
    secureUrl: presignedUrl,
  };
}

export async function uploadToCloud(
  buffer: Buffer,
  type: UploadType,
  mimetype: string,
  folder: string,
  fileName?: string
): Promise<UploadResult> {
  if (!isUploadEnabled()) {
    throw new Error(
      'Upload not configured. Set either Railway bucket vars (ENDPOINT, BUCKET, ACCESS_KEY_ID, SECRET_ACCESS_KEY) or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
    );
  }
  if (useS3) {
    return uploadToS3(buffer, type, mimetype, folder, fileName);
  }
  const resource_type = resourceType(type, mimetype);
  const uniqueId = fileName ? fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_') : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
        public_id: uniqueId,
        overwrite: true,
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url) return reject(new Error('No URL returned from Cloudinary'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          secureUrl: result.secure_url,
        });
      }
    );
    uploadStream.end(buffer);
  });
}
