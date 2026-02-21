/**
 * Free / open-source AI helpers using Hugging Face Inference Providers router.
 *
 * Configure via:
 * - HF_API_TOKEN   (required)
 * - HF_ROUTER_URL  (optional; defaults to HF OpenAI-compatible endpoint)
 * - HF_CHAT_MODEL  (optional; defaults to open-weights chat model)
 * - HF_SUMMARY_MODEL (optional; defaults to chat model for summarization prompts)
 */

const HF_ROUTER_URL = process.env.HF_ROUTER_URL || 'https://router.huggingface.co/v1/chat/completions';
const HF_API_TOKEN = process.env.HF_API_TOKEN || '';
const HF_TIMEOUT_MS = Number(process.env.HF_TIMEOUT_MS || 30000);
const HF_RETRY_ATTEMPTS = Math.max(1, Number(process.env.HF_RETRY_ATTEMPTS || 2));

export class FreeAiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FreeAiConfigError';
  }
}

interface HfChatCompletionResponse {
  choices?: Array<{
    reasoning?: string;
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

function ensureConfigured(): void {
  if (!HF_API_TOKEN) {
    throw new FreeAiConfigError('Free AI is not configured: set HF_API_TOKEN on the backend environment.');
  }
}

function normalizeContent(content: string | Array<{ type?: string; text?: string }> | undefined): string {
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    const joined = content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n')
      .trim();
    return joined;
  }
  return '';
}

async function hfChatCompletion(params: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<{ text: string; raw: HfChatCompletionResponse }> {
  ensureConfigured();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HF_TIMEOUT_MS);

  const res = await fetch(HF_ROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HF_API_TOKEN}`,
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      stream: false,
      temperature: params.temperature ?? 0.4,
      max_tokens: params.maxTokens ?? 500,
    }),
  }).finally(() => clearTimeout(timeout));

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`HF router error ${res.status}: ${text}`);
  }

  let raw: HfChatCompletionResponse = {};
  try {
    raw = text ? (JSON.parse(text) as HfChatCompletionResponse) : {};
  } catch {
    throw new Error('HF router returned a non-JSON response.');
  }

  const firstChoice = raw.choices?.[0];
  const content = firstChoice?.message?.content;
  const normalized = normalizeContent(content);
  const reasoning = typeof firstChoice?.reasoning === 'string' ? firstChoice.reasoning.trim() : '';
  const finalText = normalized || reasoning;
  if (!finalText) {
    throw new Error('HF router returned an empty response.');
  }

  return { text: finalText, raw };
}

function parseFallbackModels(): string[] {
  const fromEnv = (process.env.HF_CHAT_FALLBACK_MODELS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  return fromEnv;
}

function getChatModels(): string[] {
  const primary = process.env.HF_CHAT_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
  const fallback = parseFallbackModels();
  const defaults = ['Qwen/Qwen2.5-7B-Instruct', 'meta-llama/Llama-3.1-8B-Instruct'];
  return Array.from(new Set([primary, ...fallback, ...defaults]));
}

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /HF router error 5\d\d/i.test(message) ||
    /Internal server error/i.test(message) ||
    /timed out|timeout|aborted/i.test(message) ||
    /empty response|non-JSON response/i.test(message)
  );
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Lightweight chat helper using an open instruct model (e.g. Mistral/Falcon instruct). */
export async function aiChatFree(params: {
  prompt: string;
  history?: ChatMessage[];
}): Promise<{ reply: string; raw: unknown }> {
  const { prompt, history = [] } = params;
  const models = getChatModels();

  // Many HF chat models accept conversation-style input.
  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are an AI co-founder that helps founders around the world build startups.' },
    ...history,
    { role: 'user', content: prompt },
  ];

  let lastError: unknown = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= HF_RETRY_ATTEMPTS; attempt += 1) {
      try {
        const completion = await hfChatCompletion({
          model,
          messages,
          temperature: 0.5,
          maxTokens: 600,
        });
        return { reply: completion.text, raw: completion.raw };
      } catch (error) {
        lastError = error;
        const retryable = isRetryableError(error);
        const hasMoreAttempts = attempt < HF_RETRY_ATTEMPTS;
        if (retryable && hasMoreAttempts) {
          await delay(300 * attempt);
          continue;
        }
        break;
      }
    }
  }

  if (lastError instanceof FreeAiConfigError) {
    throw lastError;
  }

  throw new Error('AI provider is temporarily unavailable. Please try again in a moment.');
}

/** Free/open summarisation helper. */
export async function summarizeFree(text: string): Promise<{ summary: string; raw: unknown }> {
  const model = process.env.HF_SUMMARY_MODEL || process.env.HF_CHAT_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
  const completion = await hfChatCompletion({
    model,
    messages: [
      { role: 'system', content: 'Summarize the user text clearly in 4-6 bullet points.' },
      { role: 'user', content: text },
    ],
    temperature: 0.2,
    maxTokens: 350,
  });

  return { summary: completion.text, raw: completion.raw };
}

