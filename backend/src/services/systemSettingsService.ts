import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SYSTEM_SETTINGS_KEY = 'system_settings_v1';

export interface SystemSettings {
  protections: {
    waf: boolean;
    ddos: boolean;
    rateLimiting: boolean;
    aiMonitoring: boolean;
    dbEncryption: boolean;
    backups: boolean;
  };
  ai: {
    defaultModel: string;
  };
}

function envEnabled(value: string | undefined): boolean {
  if (!value) return false;
  const cleaned = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(cleaned);
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const cleaned = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on', 'enabled'].includes(cleaned)) return true;
    if (['0', 'false', 'no', 'off', 'disabled'].includes(cleaned)) return false;
  }
  return fallback;
}

function toStringSafe(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim();
  return cleaned || fallback;
}

export function defaultSystemSettings(): SystemSettings {
  return {
    protections: {
      waf: envEnabled(process.env.PROTECTION_WAF_ENABLED),
      ddos: envEnabled(process.env.PROTECTION_DDOS_ENABLED),
      rateLimiting: true,
      aiMonitoring: envEnabled(process.env.PROTECTION_AI_ENABLED),
      dbEncryption: envEnabled(process.env.PROTECTION_DB_ENCRYPTION),
      backups: envEnabled(process.env.PROTECTION_BACKUPS),
    },
    ai: {
      defaultModel: process.env.AI_MODEL || 'openai/gpt-5.2',
    },
  };
}

function sanitizeSettings(raw: unknown, base: SystemSettings): SystemSettings {
  const payload = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const rawProtections = (payload.protections && typeof payload.protections === 'object'
    ? payload.protections
    : {}) as Record<string, unknown>;
  const rawAi = (payload.ai && typeof payload.ai === 'object' ? payload.ai : {}) as Record<string, unknown>;

  return {
    protections: {
      waf: toBoolean(rawProtections.waf, base.protections.waf),
      ddos: toBoolean(rawProtections.ddos, base.protections.ddos),
      rateLimiting: true,
      aiMonitoring: toBoolean(rawProtections.aiMonitoring, base.protections.aiMonitoring),
      dbEncryption: toBoolean(rawProtections.dbEncryption, base.protections.dbEncryption),
      backups: toBoolean(rawProtections.backups, base.protections.backups),
    },
    ai: {
      defaultModel: toStringSafe(rawAi.defaultModel, base.ai.defaultModel),
    },
  };
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const defaults = defaultSystemSettings();
  const row = await prisma.cmsContent.findUnique({ where: { key: SYSTEM_SETTINGS_KEY }, select: { value: true } });
  if (!row?.value) return defaults;

  try {
    const parsed = JSON.parse(row.value) as unknown;
    return sanitizeSettings(parsed, defaults);
  } catch {
    return defaults;
  }
}

export async function saveSystemSettings(input: unknown, updatedById: string): Promise<SystemSettings> {
  const current = await getSystemSettings();
  const incoming = sanitizeSettings(input, current);
  const merged: SystemSettings = {
    protections: {
      ...current.protections,
      ...incoming.protections,
      rateLimiting: true,
    },
    ai: {
      ...current.ai,
      ...incoming.ai,
    },
  };

  await prisma.cmsContent.upsert({
    where: { key: SYSTEM_SETTINGS_KEY },
    create: {
      key: SYSTEM_SETTINGS_KEY,
      value: JSON.stringify(merged),
      type: 'json',
      page: 'system',
      updatedById,
    },
    update: {
      value: JSON.stringify(merged),
      type: 'json',
      page: 'system',
      updatedById,
    },
  });

  return merged;
}
