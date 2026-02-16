import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isStripeEnabled } from '../services/stripeService';
import { isPaystackEnabled } from '../services/paystackService';
import { verifyConnection } from '../services/emailService';

const prisma = new PrismaClient();

async function checkDatabase(): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function checkEmail(): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  if (!host || !port) {
    return { ok: false, error: 'SMTP_HOST/SMTP_PORT not set' };
  }
  return verifyConnection();
}

async function checkAi(): Promise<{ ok: boolean; error?: string; provider: string }> {
  const url = process.env.HF_API_URL || 'https://api-inference.huggingface.co/models';
  const chatModel = process.env.HF_CHAT_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
  try {
    // Lightweight HEAD/ping check could be added; for now just validate config presence
    if (!url || !chatModel) {
      return { ok: false, provider: 'huggingface', error: 'HF_API_URL or HF_CHAT_MODEL not set' };
    }
    return { ok: true, provider: 'huggingface' };
  } catch (e) {
    return {
      ok: false,
      provider: 'huggingface',
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function checkPayments(): Promise<{
  ok: boolean;
  gateway: 'paystack' | 'stripe' | 'none';
  error?: string;
}> {
  try {
    const paystack = isPaystackEnabled();
    const stripe = isStripeEnabled();
    if (paystack) return { ok: true, gateway: 'paystack' };
    if (stripe) return { ok: true, gateway: 'stripe' };
    return { ok: false, gateway: 'none', error: 'No payment gateway configured' };
  } catch (e) {
    return {
      ok: false,
      gateway: 'none',
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** GET /api/v1/super-admin/system-health — overall service status for admin dashboard */
export async function health(_req: Request, res: Response): Promise<void> {
  const [db, email, ai, payments] = await Promise.all([
    checkDatabase(),
    checkEmail(),
    checkAi(),
    checkPayments(),
  ]);

  res.json({
    email,
    ai,
    payments,
    database: db,
  });
}

