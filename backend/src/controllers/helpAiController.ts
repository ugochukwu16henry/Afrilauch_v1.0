import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

const HELP_KB: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ['submit', 'idea'],
    answer:
      'To submit your idea, go to the “Submit Idea” or “Publish to Marketplace” flow. On the public site, use the “Submit idea” page. Inside the dashboard as a founder, go to Dashboard → “Publish to Marketplace”, connect your project, and provide your pitch summary, traction, and funding needs.',
  },
  {
    keywords: ['ai co-founder', 'ai mentor', 'ai assistant'],
    answer:
      'The AI Co-Founder lives under Dashboard → Mentor. There you can chat with an AI startup mentor, generate business models and roadmaps, and create a full business plan tailored to your idea and region.',
  },
  {
    keywords: ['find investors', 'investor', 'investment'],
    answer:
      'Investors use the Marketplace and Deal Room. As a founder, once your startup is approved, it appears in the investor marketplace. Investors can request Deal Room access, review your materials, and express interest or commit.',
  },
  {
    keywords: ['pricing', 'setup fee', 'payment'],
    answer:
      'The setup fee covers evaluation, structuring, and onboarding work to get your startup ready. You can see and pay the setup fee from Dashboard → Payments or the setup modal that appears when you first sign in as a founder.',
  },
  {
    keywords: ['this page', 'what does this page'],
    answer:
      'This page is part of the RiseFlow Hub dashboard. The sidebar shows the main areas: Projects (your active builds), Tasks, Files, Messages, Marketing, Mentor (AI), and admin tools if you are a Super Admin or team member. Use the navigation on the left to switch between workspaces.',
  },
];

function generateHelpAnswer(question: string, pagePath?: string | null): string {
  const q = question.toLowerCase();
  for (const entry of HELP_KB) {
    if (entry.keywords.some((k) => q.includes(k))) {
      return entry.answer;
    }
  }
  if (pagePath?.startsWith('/dashboard/investor')) {
    return 'This is the investor area. Use the Marketplace to browse vetted startups, the Deal Room for deeper due diligence, and the Investments tab to track your commitments.';
  }
  if (pagePath?.startsWith('/dashboard/startup') || pagePath?.startsWith('/dashboard/project')) {
    return 'This is your founder workspace. Here you manage your project, timelines, tasks, files, and publish your startup to the investor marketplace when you are ready.';
  }
  return (
    'RiseFlow Hub is a venture-building platform. You can submit your idea, work with our team and AI mentor to shape a product, track progress in the dashboard, and later attract investors through the marketplace and deal rooms. ' +
    'Ask things like “How do I submit my idea?”, “How do I find investors?”, or “What should I do next on this page?”.'
  );
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
  const answer = generateHelpAnswer(question, pagePath);
  await prisma.helpAiLog.create({
    data: {
      userId: payload.userId,
      pagePath: pagePath ?? null,
      question: question.trim(),
      answer,
    },
  });
  res.json({ answer });
}

