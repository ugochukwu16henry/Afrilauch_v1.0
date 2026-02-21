import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { awardBadge } from '../services/badgeService';
import { aiChatFree, type ChatMessage } from '../services/openAiFreeService';

const prisma = new PrismaClient();

type AiContext = {
  industry?: string;
  country?: string;
  projectStage?: string;
  setupPaid?: boolean;
  teamSize?: number;
};

function getContext(req: Request, setupPaid: boolean): AiContext {
  const body = (req.body || {}) as Record<string, unknown>;
  return {
    industry: (body.industry as string) || undefined,
    country: (body.country as string) || undefined,
    projectStage: (body.projectStage as string) || undefined,
    setupPaid,
    teamSize: typeof body.teamSize === 'number' ? body.teamSize : undefined,
  };
}

async function requirePaid(userId: string, moduleName: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { setupPaid: true },
  });
  if (user?.setupPaid) return true;
  return false;
}

function extractJsonBlock(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced?.[1]?.trim() || trimmed;
}

function tryParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(extractJsonBlock(text)) as T;
  } catch {
    return null;
  }
}

function contextLines(ctx: AiContext): string[] {
  return [
    `Industry: ${ctx.industry || 'general'}`,
    `Country/Region: ${ctx.country || 'not specified'}`,
    `Stage: ${ctx.projectStage || 'idea'}`,
    `Team size: ${ctx.teamSize ?? 'not specified'}`,
    `Paid setup: ${ctx.setupPaid ? 'yes' : 'no'}`,
  ];
}

async function generateStructuredOrThrow<T>(prompt: string, history?: ChatMessage[]): Promise<T> {
  const result = await aiChatFree({ prompt, history });
  const parsed = tryParseJson<T>(result.reply);
  if (!parsed) {
    throw new Error('AI returned invalid JSON format for the requested module.');
  }
  return parsed;
}

function modulePrompt(type: string, idea: string, ctx: AiContext): string {
  const base = ['You are RiseFlow AI Co-Founder.', 'Return ONLY valid JSON with no markdown.'];
  const context = [`Idea: ${idea}`, ...contextLines(ctx)];

  if (type === 'idea_clarified') {
    return [
      ...base,
      'Schema: {"refinedConcept":string,"questionsAnswered":string[],"summary":string}',
      ...context,
      'Refine the concept with clarity and practical validation next steps.',
    ].join('\n');
  }

  if (type === 'business_model') {
    return [
      ...base,
      'Schema: {"targetMarket":string,"valueProposition":string,"revenueStreams":string[],"costStructure":string[],"channels":string[],"keyActivities":string[],"summary":string}',
      ...context,
      'Provide an actionable early-stage business model.',
    ].join('\n');
  }

  if (type === 'roadmap') {
    return [
      ...base,
      'Schema: {"mvp":string[],"phase2":string[],"phase3":string[],"summary":string}',
      ...context,
      'Give practical phased roadmap actions.',
    ].join('\n');
  }

  if (type === 'pricing') {
    return [
      ...base,
      'Schema: {"subscriptionTiers":[{"name":string,"price":string,"features":string[]}],"freemiumOption":string,"oneTimeFees":string,"marketComparison":string,"summary":string}',
      ...context,
      'Generate realistic pricing strategy with clear tiers.',
    ].join('\n');
  }

  if (type === 'marketing') {
    return [
      ...base,
      'Schema: {"idealAudience":string,"launchStrategy":string[],"socialMediaPlan":string[],"adIdeas":string[],"funnelStructure":string,"summary":string}',
      ...context,
      'Generate focused GTM strategy with channels and funnel actions.',
    ].join('\n');
  }

  if (type === 'pitch') {
    return [
      ...base,
      'Schema: {"problem":string,"solution":string,"marketSize":string,"traction":string,"revenueModel":string,"ask":string,"summary":string}',
      ...context,
      'Generate investor-ready pitch sections.',
    ].join('\n');
  }

  if (type === 'risk_analysis') {
    return [
      ...base,
      'Schema: {"marketRisks":[{"risk":string,"mitigation":string}],"technicalRisks":[{"risk":string,"mitigation":string}],"financialRisks":[{"risk":string,"mitigation":string}],"competition":[{"risk":string,"mitigation":string}],"investorReadinessScore":number,"summary":string}',
      ...context,
      'Score must be integer between 0 and 100.',
      'Return concrete mitigations and no placeholders.',
    ].join('\n');
  }

  throw new Error('Unsupported AI module');
}

async function generateModule(type: string, idea: string, ctx: AiContext): Promise<Record<string, unknown>> {
  const prompt = modulePrompt(type, idea, ctx);
  return generateStructuredOrThrow<Record<string, unknown>>(prompt);
}

function handleAiError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : 'AI generation failed';
  res.status(503).json({ error: 'AI generation unavailable', message });
}

/** POST /ai/idea-clarify */
export async function ideaClarify(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { setupPaid: true } });
  const ctx = getContext(req, user?.setupPaid ?? false);
  let content: Record<string, unknown>;
  try {
    content = await generateModule('idea_clarified', idea.trim(), ctx);
  } catch (error) {
    handleAiError(res, error);
    return;
  }
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'idea_clarified', content: content as object },
  });
  awardBadge(prisma, { userId, badge: 'vision_clarifier' }).catch(() => {});
  res.json(content);
}

/** POST /ai/business-model */
export async function businessModel(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { setupPaid: true } });
  const ctx = getContext(req, user?.setupPaid ?? false);
  let content: Record<string, unknown>;
  try {
    content = await generateModule('business_model', idea.trim(), ctx);
  } catch (error) {
    handleAiError(res, error);
    return;
  }
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'business_model', content: content as object },
  });
  awardBadge(prisma, { userId, badge: 'business_architect' }).catch(() => {});
  res.json(content);
}

/** POST /ai/roadmap */
export async function roadmap(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { setupPaid: true } });
  const ctx = getContext(req, user?.setupPaid ?? false);
  let content: Record<string, unknown>;
  try {
    content = await generateModule('roadmap', idea.trim(), ctx);
  } catch (error) {
    handleAiError(res, error);
    return;
  }
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'roadmap', content: content as object },
  });
  res.json(content);
}

/** POST /ai/pricing — Paid only */
export async function pricing(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const paid = await requirePaid(userId, 'pricing');
  if (!paid) {
    res.status(403).json({ error: 'Pricing Engine is available for paid users. Complete setup to unlock.' });
    return;
  }
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const ctx = getContext(req, true);
  let content: Record<string, unknown>;
  try {
    content = await generateModule('pricing', idea.trim(), ctx);
  } catch (error) {
    handleAiError(res, error);
    return;
  }
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'pricing', content: content as object },
  });
  res.json(content);
}

/** POST /ai/marketing — Paid only */
export async function marketing(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const paid = await requirePaid(userId, 'marketing');
  if (!paid) {
    res.status(403).json({ error: 'Marketing Strategy is available for paid users. Complete setup to unlock.' });
    return;
  }
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const ctx = getContext(req, true);
  let content: Record<string, unknown>;
  try {
    content = await generateModule('marketing', idea.trim(), ctx);
  } catch (error) {
    handleAiError(res, error);
    return;
  }
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'marketing', content: content as object },
  });
  res.json(content);
}

/** POST /ai/pitch — Paid only */
export async function pitch(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const paid = await requirePaid(userId, 'pitch');
  if (!paid) {
    res.status(403).json({ error: 'Pitch Deck Creator is available for paid users. Complete setup to unlock.' });
    return;
  }
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const ctx = getContext(req, true);
  let content: Record<string, unknown>;
  try {
    content = await generateModule('pitch', idea.trim(), ctx);
  } catch (error) {
    handleAiError(res, error);
    return;
  }
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'pitch', content: content as object },
  });
  res.json(content);
}

/** POST /ai/risk-analysis — Paid only */
export async function riskAnalysis(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const paid = await requirePaid(userId, 'risk_analysis');
  if (!paid) {
    res.status(403).json({ error: 'Risk Analysis is available for paid users. Complete setup to unlock.' });
    return;
  }
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const ctx = getContext(req, true);
  let content: Record<string, unknown>;
  try {
    content = await generateModule('risk_analysis', idea.trim(), ctx);
  } catch (error) {
    handleAiError(res, error);
    return;
  }
  await prisma.aiGeneratedOutput.create({
    data: { userId, projectId: projectId || null, type: 'risk_analysis', content: content as object },
  });
  res.json(content);
}

/** GET /ai/conversations — List chat history (optional projectId) */
export async function listConversations(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const projectId = req.query.projectId as string | undefined;
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const messages = await prisma.aiConversation.findMany({
    where: { userId, ...(projectId && { projectId }) },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true, message: true, role: true, createdAt: true },
  });
  res.json({ messages });
}

/** POST /ai/conversations — Send user message and get AI reply; persist both */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { message, projectId } = req.body as { message: string; projectId?: string };
  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }
  await prisma.aiConversation.create({
    data: { userId, projectId: projectId || null, message: message.trim(), role: 'user' },
  });
  const recent = await prisma.aiConversation.findMany({
    where: { userId, ...(projectId ? { projectId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { role: true, message: true },
  });

  const history: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are RiseFlow AI Co-Founder. Provide concise, practical startup guidance with clear next steps tailored to the user message and context.',
    },
    ...recent
      .reverse()
      .map((row) => ({
        role: row.role === 'ai' ? 'assistant' : 'user',
        content: row.message,
      } as ChatMessage)),
  ];

  let reply: string;
  try {
    const result = await aiChatFree({ prompt: message.trim(), history });
    reply = result.reply.trim();
    if (!reply) throw new Error('AI returned an empty response.');
  } catch (error) {
    handleAiError(res, error);
    return;
  }

  const aiRow = await prisma.aiConversation.create({
    data: { userId, projectId: projectId || null, message: reply, role: 'ai' },
  });
  res.json({ message: reply, id: aiRow.id, createdAt: aiRow.createdAt });
}

/** GET /ai/outputs — List generated outputs (optional projectId, type filter) */
export async function listOutputs(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const projectId = req.query.projectId as string | undefined;
  const type = req.query.type as string | undefined;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const rows = await prisma.aiGeneratedOutput.findMany({
    where: { userId, ...(projectId && { projectId }), ...(type && { type }) },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, type: true, content: true, createdAt: true, projectId: true },
  });
  res.json({ outputs: rows });
}

/** POST /ai/full-business-plan — Generate all free + paid sections (paid only for paid sections) */
export async function fullBusinessPlan(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { idea, projectId } = req.body as { idea: string; projectId?: string };
  if (!idea?.trim()) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { setupPaid: true } });
  const paid = user?.setupPaid ?? false;
  const ctx = getContext(req, paid);

  let ideaClarified: Record<string, unknown>;
  let businessModel: Record<string, unknown>;
  let roadmap: Record<string, unknown>;

  try {
    ideaClarified = await generateModule('idea_clarified', idea.trim(), ctx);
    businessModel = await generateModule('business_model', idea.trim(), ctx);
    roadmap = await generateModule('roadmap', idea.trim(), ctx);
  } catch (error) {
    handleAiError(res, error);
    return;
  }

  await prisma.aiGeneratedOutput.createMany({
    data: [
      { userId, projectId: projectId || null, type: 'idea_clarified', content: ideaClarified as object },
      { userId, projectId: projectId || null, type: 'business_model', content: businessModel as object },
      { userId, projectId: projectId || null, type: 'roadmap', content: roadmap as object },
    ],
  });

  const result: Record<string, unknown> = {
    ideaClarified,
    businessModel,
    roadmap,
  };

  if (paid) {
    try {
      result.pricing = await generateModule('pricing', idea.trim(), ctx);
      result.marketing = await generateModule('marketing', idea.trim(), ctx);
      result.pitch = await generateModule('pitch', idea.trim(), ctx);
      result.riskAnalysis = await generateModule('risk_analysis', idea.trim(), ctx);
    } catch (error) {
      handleAiError(res, error);
      return;
    }
    await prisma.aiGeneratedOutput.createMany({
      data: [
        { userId, projectId: projectId || null, type: 'pricing', content: (result.pricing as object) as object },
        { userId, projectId: projectId || null, type: 'marketing', content: (result.marketing as object) as object },
        { userId, projectId: projectId || null, type: 'pitch', content: (result.pitch as object) as object },
        { userId, projectId: projectId || null, type: 'risk_analysis', content: (result.riskAnalysis as object) as object },
      ],
    });
  }

  res.json(result);
}
