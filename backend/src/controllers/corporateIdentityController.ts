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
const VERSIONS_KEY = 'corporate_identity_versions';
const MAX_VERSIONS = 10;

function cmsKey(key: string): string {
  return `${CMS_KEY_PREFIX}${key}`;
}

function getBaseUrl(): string {
  return (process.env.FRONTEND_URL || process.env.APP_URL || 'https://riseflowhub.app').replace(/\/+$/, '');
}

/** Placeholders for auto-fill: [CLIENT_NAME], [DATE], [ADDRESS], [SCOPE], [AMOUNT], [DOCUMENT_TITLE], [PREPARED_BY], [LOGO_URL] */
function applyPlaceholders(html: string, data: Record<string, string>): string {
  let out = html;
  const defaults: Record<string, string> = {
    LOGO_URL: `${getBaseUrl()}/RiseFlowHub%20logo.png`,
    DATE: new Date().toISOString().slice(0, 10),
    CLIENT_NAME: '',
    ADDRESS: '',
    SCOPE: '',
    AMOUNT: '',
    DOCUMENT_TITLE: '',
    PREPARED_BY: '',
    NAME: '',
    TITLE: '',
  };
  for (const [k, v] of Object.entries({ ...defaults, ...data })) {
    out = out.replace(new RegExp(`\\[${k}\\]`, 'gi'), v);
  }
  return out;
}

/** Default HTML for each template (brand colors: #0FA958 primary, #0B3C5D secondary, #F4B400 accent) */
function getDefaultContent(key: string): string {
  const baseUrl = getBaseUrl();
  const logoUrl = `${baseUrl}/RiseFlowHub%20logo.png`;
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
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Letterhead</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:40px;color:#0B3C5D;max-width:210mm;} .logo-area{display:flex;align-items:center;gap:16px;} .logo-img{height:48px;width:auto;} .logo-text{color:#0FA958;font-weight:700;font-size:1.5rem;} .meta{margin-top:24px;font-size:12px;color:#666;} hr{border:0;border-top:2px solid #0FA958;margin:24px 0;} .body{margin-top:24px;line-height:1.6;}</style></head><body><div class="logo-area"><img src="${logoUrl}" alt="${base.companyName}" class="logo-img"/><span class="logo-text">${base.companyName}</span></div><p class="meta">${base.tagline}<br>${base.address} · ${base.website} · ${base.email}</p><hr><div class="body"><p>[Body content]</p></div></body></html>`;
    case 'cover':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cover Page</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:60px;color:#0B3C5D;min-height:100vh;display:flex;flex-direction:column;} .logo-area{display:flex;align-items:center;gap:12px;} .logo-img{height:56px;} .logo{color:#0FA958;font-weight:700;font-size:1.75rem;} .tagline{color:#666;margin-top:8px;} .title{margin-top:80px;font-size:1.5rem;} .meta{margin-top:40px;font-size:14px;} .footer{margin-top:auto;font-size:11px;color:#999;}</style></head><body><div class="logo-area"><img src="[LOGO_URL]" alt="${base.companyName}" class="logo-img"/><span class="logo">${base.companyName}</span></div><div class="tagline">${base.tagline}</div><div class="title">[DOCUMENT_TITLE]</div><div class="meta">Version: 1.0 · Date: [DATE] · Prepared by: [PREPARED_BY]</div><p class="footer">Confidential. © ${new Date().getFullYear()} ${base.companyName}. All rights reserved.</p></body></html>`;
    case 'nda':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Non-Disclosure Agreement</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:40px;color:#0B3C5D;line-height:1.6;max-width:210mm;} .logo-area{display:flex;align-items:center;gap:12px;margin-bottom:24px;} .logo-img{height:40px;} .logo-text{color:#0FA958;font-weight:700;} h1{font-size:1.25rem;margin-top:0;} .signature{margin-top:48px;} .stamp{margin-top:24px;font-size:12px;color:#666;} .party{font-weight:600;margin-top:16px;}</style></head><body><div class="logo-area"><img src="[LOGO_URL]" alt="${base.companyName}" class="logo-img"/><span class="logo-text">${base.companyName}</span></div><h1>Non-Disclosure Agreement</h1><p>This agreement is entered into as of [DATE] between ${base.companyName} and the following party:</p><p class="party">Name: [CLIENT_NAME]<br>Address: [ADDRESS]</p><p><strong>Scope of confidential information:</strong> [SCOPE]</p><p>The parties agree to keep confidential any information disclosed under this NDA. Unauthorized disclosure may result in legal action.</p><div class="signature"><p><strong>For ${base.companyName}:</strong><br>Signature: _________________________ Date: ____________</p><p><strong>For [CLIENT_NAME]:</strong><br>Signature: _________________________ Date: ____________</p><p><strong>Witness:</strong> _________________________</p></div><div class="stamp">Company stamp area</div></body></html>`;
    case 'contract':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contract</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:40px;color:#0B3C5D;max-width:210mm;} .logo-area{display:flex;align-items:center;gap:12px;margin-bottom:24px;} .logo-img{height:40px;} .logo-text{color:#0FA958;font-weight:700;} h1,h2{font-size:1.1rem;} .toc{margin:24px 0;} .article{margin:16px 0;} .signature{margin-top:48px;} .party{margin:8px 0;}</style></head><body><div class="logo-area"><img src="[LOGO_URL]" alt="${base.companyName}" class="logo-img"/><span class="logo-text">${base.companyName}</span></div><h1>Agreement</h1><p>Date: [DATE]. Between ${base.companyName} and [CLIENT_NAME], Address: [ADDRESS].</p><div class="toc"><strong>Table of Contents</strong><ul><li>Article 1 – Scope</li><li>Article 2 – Consideration</li><li>Signature Page</li></ul></div><div class="article"><h2>Article 1 – Scope</h2><p>[SCOPE]</p></div><div class="article"><h2>Article 2 – Consideration</h2><p>Amount: [AMOUNT]</p></div><div class="signature"><h2>Signature Page</h2><p>_________________________ (${base.companyName})</p><p>_________________________ ([CLIENT_NAME])</p></div></body></html>`;
    case 'email_signature':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;font-size:14px;color:#0B3C5D;"><table cellpadding="0" cellspacing="0"><tr><td style="padding-right:12px;vertical-align:top;"><img src="[LOGO_URL]" alt="${base.companyName}" style="height:36px;width:auto;"/></td><td><p style="margin:0;"><strong>[NAME]</strong><br>[TITLE]<br>${base.companyName}<br><a href="${base.website}" style="color:#0FA958;">${base.website}</a><br>${base.email}</p></td></tr></table></body></html>`;
    case 'presentation':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Presentation</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:40px;color:#0B3C5D;text-align:center;} .logo-area{display:inline-flex;align-items:center;gap:12px;margin-bottom:24px;} .logo-img{height:48px;} .logo-text{color:#0FA958;font-weight:700;font-size:1.5rem;} .slide{margin:32px 0;padding:24px;border:1px solid #eee;border-radius:8px;} h2{font-size:1.2rem;}</style></head><body><div class="slide"><div class="logo-area"><img src="[LOGO_URL]" alt="${base.companyName}" class="logo-img"/><span class="logo-text">${base.companyName}</span></div><p>${base.tagline}</p></div><div class="slide"><h2>About Us</h2><p>[Content]</p></div><div class="slide"><h2>Mission & Vision</h2><p>[Content]</p></div><div class="slide"><h2>Contact</h2><p>${base.website} · ${base.email}</p></div></body></html>`;
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

/** Version history entry stored in JSON */
interface VersionEntry {
  key: string;
  version: number;
  content: string;
  updatedAt: string;
}

async function saveVersionHistory(key: string, previousContent: string): Promise<void> {
  if (!previousContent) return;
  const versionsKey = VERSIONS_KEY;
  const row = await prisma.cmsContent.findUnique({ where: { key: versionsKey } });
  const all: VersionEntry[] = row?.value ? (JSON.parse(row.value) as VersionEntry[]) : [];
  const updatedAt = new Date().toISOString();
  const versionNum = all.filter((v) => v.key === key).length + 1;
  all.push({ key, version: versionNum, content: previousContent, updatedAt });
  const forKey = all.filter((v) => v.key === key).slice(-MAX_VERSIONS);
  const rest = all.filter((v) => v.key !== key);
  const merged = [...rest, ...forKey].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  await prisma.cmsContent.upsert({
    where: { key: versionsKey },
    create: { key: versionsKey, value: JSON.stringify(merged), type: 'json', page: 'corporate_identity' },
    update: { value: JSON.stringify(merged) },
  });
}

/** GET /api/v1/super-admin/corporate-identity/:key/versions — List version history for template */
export async function versions(req: Request, res: Response): Promise<void> {
  const key = (req.params.key ?? '').replace(/[^a-z0-9_]/gi, '');
  if (!TEMPLATE_KEYS.some((t) => t.key === key)) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  const row = await prisma.cmsContent.findUnique({ where: { key: VERSIONS_KEY } });
  const all: VersionEntry[] = row?.value ? (JSON.parse(row.value) as VersionEntry[]) : [];
  const forKey = all.filter((v) => v.key === key).sort((a, b) => b.version - a.version);
  res.json({ key, versions: forKey });
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
  const existing = await prisma.cmsContent.findUnique({ where: { key: fullKey } });
  if (existing?.value) {
    await saveVersionHistory(key, existing.value);
  }
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

/** POST /api/v1/super-admin/corporate-identity/:key/generate — Fill template with data and return HTML */
export async function generate(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const key = (req.params.key ?? '').replace(/[^a-z0-9_]/gi, '');
  if (!TEMPLATE_KEYS.some((t) => t.key === key)) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  const allowedKeys = ['nda', 'contract', 'cover'];
  if (!allowedKeys.includes(key)) {
    res.status(400).json({ error: 'Auto-fill only for NDA, Contract, or Cover templates' });
    return;
  }
  const body = (req.body || {}) as Record<string, string>;
  const data: Record<string, string> = {
    CLIENT_NAME: body.clientName ?? body.CLIENT_NAME ?? '',
    ADDRESS: body.address ?? body.ADDRESS ?? '',
    DATE: body.date ?? body.DATE ?? new Date().toISOString().slice(0, 10),
    SCOPE: body.scope ?? body.SCOPE ?? '',
    AMOUNT: body.amount ?? body.AMOUNT ?? '',
    DOCUMENT_TITLE: body.documentTitle ?? body.DOCUMENT_TITLE ?? '',
    PREPARED_BY: body.preparedBy ?? body.PREPARED_BY ?? '',
    NAME: body.name ?? body.NAME ?? '',
    TITLE: body.title ?? body.TITLE ?? '',
  };
  const row = await prisma.cmsContent.findUnique({ where: { key: cmsKey(key) } });
  const content = row?.value ?? getDefaultContent(key);
  const filled = applyPlaceholders(content, data);

  await createAuditLog(prisma, {
    adminId: userId,
    actionType: 'corporate_identity_generate',
    entityType: 'settings',
    entityId: key,
    details: { key, clientName: data.CLIENT_NAME, ip: req.ip ?? req.socket?.remoteAddress },
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(filled);
}
