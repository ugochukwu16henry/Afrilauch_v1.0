import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { aiChatFree, FreeAiConfigError, type ChatMessage } from '../services/openAiFreeService';

const prisma = new PrismaClient();

function buildHelpSystemPrompt(pagePath?: string | null): string {
  const currentPage = pagePath?.trim() || 'unknown page';
  return [
    'You are the in-app RiseFlow Hub Help Assistant.',
    'Answer only with practical product guidance based on the user question and current dashboard page context.',
    'Be concise and actionable. Use short paragraphs or bullets. Do not output JSON.',
    'If the user asks about unavailable actions, suggest the closest valid navigation path.',
    `Current page path: ${currentPage}`,
  ].join(' ');
}

/** POST /api/v1/help-ai/ask */
export async function ask(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { question, pagePath } = req.body as { question?: string; pagePath?: string };
  if (!question || !question.trim()) {
    res.status(400).json({ error: 'question is required' });
    return;
  }

  const trimmedQuestion = question.trim();
  let answer: string;

  try {
    const recent = await prisma.helpAiLog.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { question: true, answer: true },
    });

    const history: ChatMessage[] = [
      { role: 'system', content: buildHelpSystemPrompt(pagePath) },
      ...recent
        .reverse()
        .flatMap((row) => [
          { role: 'user', content: row.question.trim() },
          { role: 'assistant', content: row.answer.trim() },
        ] as ChatMessage[]),
    ];

    const result = await aiChatFree({
      prompt: trimmedQuestion,
      history,
    });

    answer = result.reply.trim();
  } catch (error) {
    const message =
      error instanceof FreeAiConfigError
        ? 'AI help assistant is not configured yet. Please contact support.'
        : 'AI help assistant is temporarily unavailable. Please try again in a moment.';
    res.status(503).json({ error: 'AI help unavailable', message });
    return;
  }

  await prisma.helpAiLog.create({
    data: {
      userId: payload.userId,
      pagePath: pagePath ?? null,
      question: trimmedQuestion,
      answer,
    },
  });
  res.json({ answer });
}

