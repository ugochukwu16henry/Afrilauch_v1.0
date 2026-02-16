/**
 * Free / open-source AI helpers using Hugging Face Inference API or compatible gateways.
 *
 * These endpoints are designed to avoid hard dependency on any paid provider.
 * Configure via:
 * - HF_API_URL   (e.g. https://api-inference.huggingface.co/models)
 * - HF_API_TOKEN (optional; free tier token)
 */

const HF_API_URL = (process.env.HF_API_URL || 'https://api-inference.huggingface.co/models').replace(/\/+$/, '');
const HF_API_TOKEN = process.env.HF_API_TOKEN || '';

async function hfPost(model: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${HF_API_URL}/${encodeURIComponent(model)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(HF_API_TOKEN ? { Authorization: `Bearer ${HF_API_TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HF error ${res.status}: ${text}`);
  }
  return res.json();
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
  const model = process.env.HF_CHAT_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

  // Many HF chat models accept conversation-style input.
  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are an AI co-founder that helps founders around the world build startups.' },
    ...history,
    { role: 'user', content: prompt },
  ];

  const raw = await hfPost(model, { inputs: messages });

  // Normalise a "best guess" reply for common HF text-generation schemas.
  let reply = '';
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null) {
    const first = raw[0] as Record<string, unknown>;
    if (typeof first.generated_text === 'string') {
      reply = first.generated_text;
    } else if (Array.isArray(first.generated_text) && typeof first.generated_text[0] === 'string') {
      reply = first.generated_text[0] as string;
    }
  }

  if (!reply) {
    reply = '[AI response unavailable. Please try again later.]';
  }

  return { reply, raw };
}

/** Free/open summarisation helper. */
export async function summarizeFree(text: string): Promise<{ summary: string; raw: unknown }> {
  const model = process.env.HF_SUMMARY_MODEL || 'facebook/bart-large-cnn';
  const raw = await hfPost(model, { inputs: text });
  let summary = '';

  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null) {
    const first = raw[0] as Record<string, unknown>;
    if (typeof first.summary_text === 'string') {
      summary = first.summary_text;
    }
  }

  if (!summary) {
    summary = text.length > 280 ? `${text.slice(0, 277)}...` : text;
  }

  return { summary, raw };
}

