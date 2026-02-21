/**
 * Corporate Identity — Super Admin only.
 * Templates: letterhead, cover page, NDA, contract, email signature, presentation.
 * Stored in CmsContent (key: corporate_identity_*). Audit log on download/edit.
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { createAuditLog } from '../services/auditLogService';

const prisma = new PrismaClient();

const TEMPLATE_KEYS = [
  { key: 'letterhead_a4', name: 'Letterhead (A4)', type: 'letterhead' },
  { key: 'letterhead_us', name: 'Letterhead (US Letter)', type: 'letterhead' },
  { key: 'cover', name: 'Corporate Cover Page', type: 'cover' },
  { key: 'nda', name: 'NDA / NDC Template', type: 'nda' },
  { key: 'contract', name: 'Contract Template', type: 'contract' },
  { key: 'email_signature', name: 'Email Signature', type: 'email_signature' },
  { key: 'presentation', name: 'Presentation Template', type: 'presentation' },
] as const;

const CMS_KEY_PREFIX = 'corporate_identity_';

function cmsKey(key: string): string {
  return `${CMS_KEY_PREFIX}${key}`;
}

/** Default HTML for each template (brand colors: #0FA958 primary, #0B3C5D secondary, #F4B400 accent) */
function getDefaultContent(key: string): string {
  const base = {
    companyName: 'RiseFlow Hub',
    tagline: 'Startup OS · Venture Studio · Incubator',
    address: 'Registered Address',
    website: 'https://riseflowhub.app',
    email: 'hello@riseflowhub.app',
  };
  switch (key) {
    case 'letterhead_a4':
    case 'letterhead_us':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Letterhead</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:40px;color:#0B3C5D;} .logo{color:#0FA958;font-weight:700;font-size:1.5rem;} .meta{margin-top:40px;font-size:12px;color:#666;} hr{border:0;border-top:2px solid #0FA958;margin:24px 0;}</style></head><body><div class="logo">${base.companyName}</div><p class="meta">${base.tagline}<br>${base.address} · ${base.website} · ${base.email}</p><hr><p>[Body content]</p></body></html>`;
    case 'cover':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cover Page</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:60px;color:#0B3C5D;min-height:100vh;display:flex;flex-direction:column;} .logo{color:#0FA958;font-weight:700;font-size:1.75rem;} .tagline{color:#666;margin-top:8px;} .title{margin-top:80px;font-size:1.5rem;} .meta{margin-top:40px;font-size:14px;} .footer{margin-top:auto;font-size:11px;color:#999;}</style></head><body><div class="logo">${base.companyName}</div><div class="tagline">${base.tagline}</div><div class="title">[Document Title]</div><div class="meta">Version: 1.0 · Date: [Date] · Prepared by: [Name]</div><p class="footer">Confidential. © ${new Date().getFullYear()} ${base.companyName}. All rights reserved.</p></body></html>`;
    case 'nda':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>NDA</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:40px;color:#0B3C5D;line-height:1.6;} .logo{color:#0FA958;font-weight:700;} h1{font-size:1.25rem;} .signature{margin-top:48px;} .stamp{margin-top:24px;font-size:12px;color:#666;}</style></head><body><div class="logo">${base.companyName}</div><h1>Non-Disclosure Agreement</h1><p>[Legal body – editable by Super Admin]</p><div class="signature"><p><strong>Signature:</strong> _________________________</p><p><strong>Witness:</strong> _________________________</p></div><div class="stamp">Company stamp area</div></body></html>`;
    case 'contract':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contract</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:40px;color:#0B3C5D;} .logo{color:#0FA958;font-weight:700;} h1,h2{font-size:1.1rem;} .toc{margin:24px 0;} .article{margin:16px 0;} .signature{margin-top:48px;}</style></head><body><div class="logo">${base.companyName}</div><h1>Contract</h1><div class="toc"><strong>Table of Contents</strong><ul><li>Article 1</li><li>Article 2</li><li>Signature Page</li></ul></div><div class="article"><h2>Article 1</h2><p>[Content]</p></div><div class="article"><h2>Article 2</h2><p>[Content]</p></div><div class="signature"><h2>Signature Page</h2><p>_________________________</p></div></body></html>`;
    case 'email_signature':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;font-size:14px;color:#0B3C5D;"><p><strong>[Name]</strong><br>[Title]<br>${base.companyName}<br><a href="${base.website}" style="color:#0FA958;">${base.website}</a><br>${base.email}</p></body></html>`;
    case 'presentation':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Presentation</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:40px;color:#0B3C5D;text-align:center;} .logo{color:#0FA958;font-weight:700;font-size:1.5rem;} .slide{margin:32px 0;padding:24px;border:1px solid #eee;}</style></head><body><div class="slide"><div class="logo">${base.companyName}</div><p>${base.tagline}</p></div><div class="slide"><h2>About Us</h2><p>[Content]</p></div><div class="slide"><h2>Mission & Vision</h2><p>[Content]</p></div><div class="slide"><h2>Contact</h2><p>${base.website} · ${base.email}</p></div></body></html>`;
    default:
      return '<!DOCTYPE html><html><body><p>Template content</p></body></html>';
  }
}

/** GET /api/v1/super-admin/corporate-identity — List all templates (metadata) */
export async function list(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const keys = TEMPLATE_KEYS.map((t) => cmsKey(t.key));
  const contents = await prisma.cmsContent.findMany({
    where: { key: { in: keys } },
    select: { key: true, updatedAt: true },
  });
  const byKey = new Map(contents.map((c) => [c.key, c]));
  const list_ = TEMPLATE_KEYS.map((t) => {
    const fullKey = cmsKey(t.key);
    const row = byKey.get(fullKey);
    return {
      key: t.key,
      name: t.name,
      type: t.type,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    };
  });
  res.json({ items: list_ });
}

/** GET /api/v1/super-admin/corporate-identity/:key — Get template content */
export async function get(req: Request, res: Response): Promise<void> {
  const key = (req.params.key ?? '').replace(/[^a-z0-9_]/gi, '');
  if (!TEMPLATE_KEYS.some((t) => t.key === key)) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  const row = await prisma.cmsContent.findUnique({
    where: { key: cmsKey(key) },
  });
  const content = row?.value ?? getDefaultContent(key);
  res.json({ key, content, updatedAt: row?.updatedAt?.toISOString() ?? null });
}

/** PUT /api/v1/super-admin/corporate-identity/:key — Update template content */
export async function update(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const key = (req.params.key ?? '').replace(/[^a-z0-9_]/gi, '');
  if (!TEMPLATE_KEYS.some((t) => t.key === key)) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  const { content } = req.body as { content?: string };
  if (typeof content !== 'string') {
    res.status(400).json({ error: 'content required' });
    return;
  }
  const fullKey = cmsKey(key);
  await prisma.cmsContent.upsert({
    where: { key: fullKey },
    create: {
      key: fullKey,
      value: content,
      type: 'richtext',
      page: 'corporate_identity',
      updatedById: userId,
    },
    update: {
      value: content,
      updatedById: userId,
    },
  });
  await createAuditLog(prisma, {
    adminId: userId,
    actionType: 'corporate_identity_edit',
    entityType: 'settings',
    entityId: fullKey,
    details: { key, ip: req.ip ?? req.socket?.remoteAddress },
  });
  res.json({ ok: true, key });
}

/** GET /api/v1/super-admin/corporate-identity/:key/download — Download as HTML (audit + optional PDF hint) */
export async function download(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const key = (req.params.key ?? '').replace(/[^a-z0-9_]/gi, '');
  if (!TEMPLATE_KEYS.some((t) => t.key === key)) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  const row = await prisma.cmsContent.findUnique({
    where: { key: cmsKey(key) },
  });
  const content = row?.value ?? getDefaultContent(key);
  const name = TEMPLATE_KEYS.find((t) => t.key === key)?.name ?? key;
  const filename = `${name.replace(/\s+/g, '_')}.html`;

  await createAuditLog(prisma, {
    adminId: userId,
    actionType: 'corporate_identity_download',
    entityType: 'settings',
    entityId: key,
    details: {
      templateName: name,
      ip: req.ip ?? req.socket?.remoteAddress,
    },
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(content);
}
