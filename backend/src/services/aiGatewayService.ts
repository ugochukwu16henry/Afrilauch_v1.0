import { streamText } from 'ai';

const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-5.2';
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || '';

export function isAiGatewayConfigured(): boolean {
  return Boolean(AI_GATEWAY_API_KEY && AI_MODEL);
}

export async function runAI(prompt: string): Promise<string> {
  if (!AI_GATEWAY_API_KEY) {
    throw new Error('AI Gateway not configured: AI_GATEWAY_API_KEY is missing.');
  }

  const trimmed = (prompt || '').trim();
  if (!trimmed) {
    throw new Error('Prompt is required.');
  }

  const result = await streamText({
    // When using Vercel AI Gateway, the model id is passed as a string
    // e.g. "openai/gpt-5.2" and the gateway key is sent via Authorization.
    model: AI_MODEL as any,
    prompt: trimmed,
    headers: {
      Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
    },
  });

  // Preferred path in AI SDK v6: use the aggregated `text` helper if present.
  const maybeText = (result as any).text;
  if (typeof maybeText === 'string' && maybeText.trim().length > 0) {
    return maybeText;
  }

  // Fallback: read from the text stream (AI SDK exposes `textStream`).
  let fullText = '';
  const stream = (result as any).textStream ?? (result as any).stream;
  if (stream) {
    // eslint-disable-next-line no-restricted-syntax
    for await (const part of stream) {
      // `part` is usually { type: 'text', text: '...' }
      if (typeof (part as any).text === 'string') {
        fullText += (part as any).text;
      }
    }
  }

  if (!fullText.trim()) {
    throw new Error('AI Gateway returned an empty response.');
  }

  return fullText;
}

