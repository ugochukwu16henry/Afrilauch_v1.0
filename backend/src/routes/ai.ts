import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, requireSetupPaid } from '../middleware/auth';
import * as aiCofounderController from '../controllers/aiCofounderController';
import { aiRateLimiter } from '../middleware/rateLimit';
import { isAiGatewayConfigured, runAI } from '../services/aiGatewayService';
import { aiChatFree, FreeAiConfigError, type ChatMessage } from '../services/openAiFreeService';

const router = Router();

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

async function generateStructured<T>(
  prompt: string,
  _fallback: T,
  history?: ChatMessage[]
): Promise<T> {
  const result = await aiChatFree({ prompt, history });
  const parsed = tryParseJson<T>(result.reply);
  if (!parsed) {
    throw new Error('AI returned non-JSON output for structured endpoint.');
  }
  return parsed;
}

async function generateText(prompt: string, fallback: string, history?: ChatMessage[]): Promise<string> {
  const result = await aiChatFree({ prompt, history });
  const text = result.reply.trim();
  if (!text) {
    throw new Error('AI returned empty text output.');
  }
  return text;
}

router.use(authMiddleware);

// ——— Generic AI generate endpoint (Vercel AI Gateway) ———
router.post(
  '/generate',
  [body('prompt').trim().notEmpty()],
  aiRateLimiter,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!isAiGatewayConfigured()) {
      return res.status(503).json({
        error: 'AI Gateway not configured',
        message: 'Set AI_GATEWAY_API_KEY and AI_MODEL on the backend environment, then redeploy.',
      });
    }

    const { prompt } = req.body as { prompt: string };

    try {
      const result = await runAI(prompt);
      // Lightweight usage log for abuse detection (full analytics can be added via auditLog later)
      // eslint-disable-next-line no-console
      console.log('[ai.generate] user prompt length:', prompt.length);
      return res.json({ result });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ai.generate] error:', err);
      const message =
        err instanceof FreeAiConfigError
          ? 'AI service is not configured on the server.'
          : 'AI service is temporarily unavailable. Please try again in a moment.';
      return res.status(503).json({ error: 'AI request failed', message });
    }
  }
);

// ——— AI Co-Founder (auth only; paid modules gated in controller) ———
router.post('/idea-clarify', [body('idea').trim().notEmpty(), body('projectId').optional().isUUID(), body('industry').optional().trim(), body('country').optional().trim()], (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ errors: validationResult(req).array() });
  return aiCofounderController.ideaClarify(req, res);
});
router.post('/business-model', [body('idea').trim().notEmpty(), body('projectId').optional().isUUID(), body('industry').optional().trim(), body('country').optional().trim()], (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ errors: validationResult(req).array() });
  return aiCofounderController.businessModel(req, res);
});
router.post('/roadmap', [body('idea').trim().notEmpty(), body('projectId').optional().isUUID(), body('industry').optional().trim(), body('country').optional().trim()], (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ errors: validationResult(req).array() });
  return aiCofounderController.roadmap(req, res);
});
router.post('/pricing', [body('idea').trim().notEmpty(), body('projectId').optional().isUUID(), body('industry').optional().trim(), body('country').optional().trim()], (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ errors: validationResult(req).array() });
  return aiCofounderController.pricing(req, res);
});
router.post('/marketing', [body('idea').trim().notEmpty(), body('projectId').optional().isUUID(), body('industry').optional().trim(), body('country').optional().trim()], (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ errors: validationResult(req).array() });
  return aiCofounderController.marketing(req, res);
});
router.post('/pitch', [body('idea').trim().notEmpty(), body('projectId').optional().isUUID(), body('industry').optional().trim(), body('country').optional().trim()], (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ errors: validationResult(req).array() });
  return aiCofounderController.pitch(req, res);
});
router.post('/risk-analysis', [body('idea').trim().notEmpty(), body('projectId').optional().isUUID(), body('industry').optional().trim(), body('country').optional().trim()], (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ errors: validationResult(req).array() });
  return aiCofounderController.riskAnalysis(req, res);
});
router.get('/conversations', aiCofounderController.listConversations);
router.post('/conversations', [body('message').trim().notEmpty(), body('projectId').optional().isUUID()], (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ errors: validationResult(req).array() });
  return aiCofounderController.sendMessage(req, res);
});
router.get('/outputs', aiCofounderController.listOutputs);
router.post('/full-business-plan', [body('idea').trim().notEmpty(), body('projectId').optional().isUUID(), body('industry').optional().trim(), body('country').optional().trim()], (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ errors: validationResult(req).array() });
  return aiCofounderController.fullBusinessPlan(req, res);
});

// ——— Legacy AI (require setup paid) ———
router.use(requireSetupPaid);

// POST /api/v1/ai/evaluate-idea — Live AI: feasibility, risk, market potential, MVP scope
router.post(
  '/evaluate-idea',
  [body('ideaDescription').trim().notEmpty(), body('industry').optional().trim(), body('country').optional().trim()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { ideaDescription, industry = '', country = '' } = req.body;
    const fallback = {
      feasibilityScore: 60,
      riskLevel: 'Medium',
      marketPotential: 'Emerging',
      suggestedMvpScope: ['Define a narrow MVP scope', 'Validate with customer interviews'],
      summary: `Initial evaluation for ${country || 'target region'} in ${industry || 'general'} industry.`,
    };
    const prompt = [
      'Return ONLY valid JSON with this schema:',
      '{"feasibilityScore":number,"riskLevel":string,"marketPotential":string,"suggestedMvpScope":string[],"summary":string}',
      `Idea description: ${ideaDescription}`,
      `Industry: ${industry || 'general'}`,
      `Country/region: ${country || 'not specified'}`,
      'feasibilityScore must be integer 0-100.',
    ].join('\n');
    const result = await generateStructured<typeof fallback>(prompt, fallback);
    res.json(result);
  }
);

// POST /api/v1/ai/generate-proposal — Live AI: scope, timeline, stack, cost
router.post(
  '/generate-proposal',
  [body('ideaSummary').optional().trim(), body('industry').optional().trim(), body('budgetRange').optional().trim()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { ideaSummary = '', industry = '', budgetRange = '' } = req.body;
    const fallback = {
      projectScope: ['Discovery and requirements', 'MVP development'],
      timelineWeeks: 10,
      techStack: { frontend: 'React', backend: 'Node.js', database: 'PostgreSQL', hosting: 'Cloud' },
      estimatedCostUsd: 5000,
      estimatedCostNgn: 5000 * 1600,
      estimatedCostEur: 5000 * 0.92,
      estimatedCostGbp: 5000 * 0.79,
      currency: 'USD',
      summary: 'Proposal generated from provided startup context.',
    };
    const prompt = [
      'Return ONLY valid JSON with this schema:',
      '{"projectScope":string[],"timelineWeeks":number,"techStack":{"frontend":string,"backend":string,"database":string,"hosting":string},"estimatedCostUsd":number,"estimatedCostNgn":number,"estimatedCostEur":number,"estimatedCostGbp":number,"currency":string,"summary":string}',
      `Idea summary: ${ideaSummary || 'N/A'}`,
      `Industry: ${industry || 'general'}`,
      `Budget range: ${budgetRange || 'unspecified'}`,
      'Use realistic startup MVP assumptions.',
    ].join('\n');
    const result = await generateStructured<typeof fallback>(prompt, fallback);
    res.json(result);
  }
);

// POST /api/v1/ai/pricing — Live AI: pricing and multi-currency suggestions
router.post(
  '/pricing',
  [body('amountUsd').optional().isFloat({ min: 0 }), body('scope').optional().trim(), body('region').optional().trim()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const amountUsd = Number(req.body.amountUsd) || 5000;
    const rates = { NGN: 1600, EUR: 0.92, GBP: 0.79 };
    const fallback = {
      amountUsd,
      conversions: {
        USD: amountUsd,
        NGN: Math.round(amountUsd * rates.NGN),
        EUR: Math.round(amountUsd * rates.EUR * 100) / 100,
        GBP: Math.round(amountUsd * rates.GBP * 100) / 100,
      },
      regionAdjustment: 1,
      summary: `Pricing guidance for ${amountUsd} USD baseline.`,
    };
    const { scope = '', region = '' } = req.body as { scope?: string; region?: string };
    const prompt = [
      'Return ONLY valid JSON with this schema:',
      '{"amountUsd":number,"conversions":{"USD":number,"NGN":number,"EUR":number,"GBP":number},"regionAdjustment":number,"summary":string}',
      `Base USD amount: ${amountUsd}`,
      `Scope: ${scope || 'not specified'}`,
      `Region: ${region || 'global'}`,
      'Keep conversions realistic and regionAdjustment between 0.7 and 1.5.',
    ].join('\n');
    const result = await generateStructured<typeof fallback>(prompt, fallback);
    res.json(result);
  }
);

// POST /api/v1/ai/project-insights — Live AI: risks and optimization suggestions
router.post(
  '/project-insights',
  [body('projectId').optional().isUUID()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { projectId } = req.body as { projectId?: string };
    const fallback = {
      predictedDelays: ['Potential QA slippage'],
      riskAreas: ['Scope changes'],
      suggestions: ['Lock sprint scope', 'Run weekly risk review'],
      overallHealth: 'Needs attention',
      summary: 'Project insight generated from available context.',
    };
    const prompt = [
      'Return ONLY valid JSON with this schema:',
      '{"predictedDelays":string[],"riskAreas":string[],"suggestions":string[],"overallHealth":string,"summary":string}',
      `Project ID: ${projectId || 'not provided'}`,
      'Generate practical PM insights and keep suggestions actionable.',
    ].join('\n');
    const result = await generateStructured<typeof fallback>(prompt, fallback);
    res.json(result);
  }
);

// POST /api/v1/ai/marketing-suggestions — Live AI: growth suggestions from metrics
router.post(
  '/marketing-suggestions',
  [
    body('projectId').optional().isUUID(),
    body('traffic').optional().isInt({ min: 0 }),
    body('conversions').optional().isInt({ min: 0 }),
    body('cac').optional().isFloat({ min: 0 }),
    body('roi').optional().isFloat(),
    body('byPlatform').optional().isObject(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { traffic = 0, conversions = 0, cac, roi, byPlatform = {} } = req.body;
    const fallback = {
      suggestions: ['Improve conversion funnel', 'Test channel mix', 'Strengthen retargeting'],
      summary: `Marketing suggestions based on traffic ${traffic} and conversions ${conversions}.`,
    };
    const prompt = [
      'Return ONLY valid JSON with this schema:',
      '{"suggestions":string[],"summary":string}',
      `Traffic: ${traffic}`,
      `Conversions: ${conversions}`,
      `CAC: ${cac ?? 'N/A'}`,
      `ROI: ${roi ?? 'N/A'}`,
      `By platform metrics: ${JSON.stringify(byPlatform)}`,
      'Give concise growth actions prioritized by highest expected impact.',
    ].join('\n');
    const result = await generateStructured<typeof fallback>(prompt, fallback);
    res.json(result);
  }
);

// ——— AI Startup Mentor ———

// POST /api/v1/ai/startup-cofounder — Cofounder fit & role suggestions
router.post(
  '/startup-cofounder',
  [
    body('idea').trim().notEmpty(),
    body('currentRole').optional().trim(),
    body('skillsYouHave').optional().isArray(),
    body('skillsNeeded').optional().isArray(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { idea, currentRole = 'founder', skillsYouHave = [], skillsNeeded = [] } = req.body;
    const fallback = {
      idealCofounderProfile: ['Technical cofounder (CTO)', 'Business/ops cofounder (COO)'],
      roleFit: { yourRole: currentRole, suggestedComplement: 'Technical cofounder (CTO)' },
      traitsToLookFor: ['Complementary skills', 'Aligned vision', 'Clear equity split', 'Defined decision-making'],
      redFlags: ['No vesting', 'Unclear roles', 'No written agreement'],
      summary: `For "${idea.slice(0, 50)}...", prioritize a complementary cofounder profile and clear role split.`,
    };
    const prompt = [
      'You are a startup advisor. Return ONLY valid JSON.',
      'Schema:',
      '{"idealCofounderProfile":string[],"roleFit":{"yourRole":string,"suggestedComplement":string},"traitsToLookFor":string[],"redFlags":string[],"summary":string}',
      `Idea: ${idea}`,
      `Current role: ${currentRole}`,
      `Skills you have: ${Array.isArray(skillsYouHave) ? skillsYouHave.join(', ') : ''}`,
      `Skills needed: ${Array.isArray(skillsNeeded) ? skillsNeeded.join(', ') : ''}`,
    ].join('\n');
    const result = await generateStructured<typeof fallback>(prompt, fallback);
    res.json(result);
  }
);

// POST /api/v1/ai/business-plan — Generate business plan sections
router.post(
  '/business-plan',
  [
    body('idea').trim().notEmpty(),
    body('industry').optional().trim(),
    body('targetMarket').optional().trim(),
    body('businessModel').optional().trim(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { idea, industry = 'Technology', targetMarket = 'SMBs and early adopters', businessModel = 'Subscription + usage' } = req.body;
    const fallback = {
      executiveSummary: `A venture addressing: ${idea}. Target: ${targetMarket}. Model: ${businessModel}.`,
      problemStatement: `Current solutions are fragmented. Opportunity: ${industry} market gap.`,
      solution: `Our solution focuses on measurable outcomes for ${targetMarket}.`,
      marketOpportunity: { size: 'Addressable market in billions (TAM/SAM/SOM).', trends: ['Digital adoption', 'Data-driven decisions'] },
      businessModel: { revenue: businessModel, pricing: 'Tiered subscription', unitEconomics: 'CAC, LTV, payback period' },
      goToMarket: ['Launch MVP to early adopters', 'Content and partnerships', 'Paid acquisition once PMF'],
      financialProjections: { year1: 'Retention and ARR focus', year2: 'Scale marketing', year3: 'Expand segments' },
      summary: `Business plan outline generated for ${industry} venture.`,
    };
    const prompt = [
      'Return ONLY valid JSON matching this schema exactly:',
      '{"executiveSummary":string,"problemStatement":string,"solution":string,"marketOpportunity":{"size":string,"trends":string[]},"businessModel":{"revenue":string,"pricing":string,"unitEconomics":string},"goToMarket":string[],"financialProjections":{"year1":string,"year2":string,"year3":string},"summary":string}',
      `Idea: ${idea}`,
      `Industry: ${industry}`,
      `Target market: ${targetMarket}`,
      `Business model: ${businessModel}`,
    ].join('\n');
    const result = await generateStructured<typeof fallback>(prompt, fallback);
    res.json(result);
  }
);

// POST /api/v1/ai/market-analysis — Market size, trends, competitors, insights
router.post(
  '/market-analysis',
  [
    body('idea').trim().notEmpty(),
    body('region').optional().trim(),
    body('industry').optional().trim(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { idea, region = 'Global', industry = 'Technology' } = req.body;
    const fallback = {
      marketSize: { tam: 'Total addressable market', sam: 'Serviceable addressable market', som: 'Realistic Year 1–3 capture' },
      trends: ['Digital transformation', 'Mobile-first', 'Regulation and compliance'],
      competitors: ['Incumbents', 'Niche players', 'Regional alternatives'],
      opportunities: [`First-mover in ${region} for this use case`, 'Partnership opportunities'],
      threats: ['Funding cycles', 'Talent', 'Infrastructure'],
      summary: `Market analysis for ${industry} in ${region}.`,
    };
    const prompt = [
      'Return ONLY valid JSON matching schema:',
      '{"marketSize":{"tam":string,"sam":string,"som":string},"trends":string[],"competitors":string[],"opportunities":string[],"threats":string[],"summary":string}',
      `Idea: ${idea}`,
      `Region: ${region}`,
      `Industry: ${industry}`,
    ].join('\n');
    const result = await generateStructured<typeof fallback>(prompt, fallback);
    res.json(result);
  }
);

// POST /api/v1/ai/risk-analysis — Risks, mitigations, investor readiness score
router.post(
  '/risk-analysis',
  [
    body('idea').trim().notEmpty(),
    body('projectId').optional().isUUID(),
    body('stage').optional().trim(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { idea, stage = 'idea' } = req.body;
    const fallback = {
      risks: [
        { area: 'Market', level: 'Medium', description: 'Market timing and adoption risk.', mitigation: 'Validate with early users and pilots.' },
        { area: 'Execution', level: 'Medium', description: 'Team capacity and delivery risk.', mitigation: 'Scope MVP tightly.' },
      ],
      investorReadinessScore: 58,
      scoreBreakdown: { team: 62, market: 58, traction: 49, financials: 56, documentation: 44 },
      nextSteps: ['Document assumptions and milestones in a one-pager.', 'Prepare a clear ask (amount, use of funds).'],
      summary: 'Investor readiness needs strengthening before active fundraising.',
    };
    const prompt = [
      'Return ONLY valid JSON matching schema:',
      '{"risks":[{"area":string,"level":string,"description":string,"mitigation":string}],"investorReadinessScore":number,"scoreBreakdown":{"team":number,"market":number,"traction":number,"financials":number,"documentation":number},"nextSteps":string[],"summary":string}',
      `Idea: ${idea}`,
      `Stage: ${stage}`,
      'Score fields must be integers 0-100.',
    ].join('\n');
    const result = await generateStructured<typeof fallback>(prompt, fallback);
    res.json(result);
  }
);

// POST /api/v1/ai/idea-chat — Idea validation chat (conversational)
router.post(
  '/idea-chat',
  [body('messages').isArray(), body('messages.*.role').isIn(['user', 'assistant']), body('messages.*.content').trim().notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { messages } = req.body as { messages: { role: string; content: string }[] };
    const lastUser = messages.filter((m: { role: string }) => m.role === 'user').pop();
    const userPrompt = lastUser?.content?.trim() || '';
    const history: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are RiseFlow AI Startup Mentor. Give practical startup advice in concise, actionable steps tailored to the user message.',
      },
      ...messages
        .slice(-8)
        .filter((m) => m.content?.trim())
        .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.trim() } as ChatMessage)),
    ];
    const fallback = 'Share your idea, target users, and business model in 3-5 lines and I will give step-by-step validation actions.';
    const reply = await generateText(userPrompt, fallback, history);
    res.json({ message: reply });
  }
);

// POST /api/v1/ai/smart-milestones — Suggested milestones from idea or project
router.post(
  '/smart-milestones',
  [body('ideaSummary').optional().trim(), body('projectId').optional().isUUID(), body('horizonWeeks').optional().isInt({ min: 4, max: 52 })],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { ideaSummary = '', horizonWeeks = 24 } = req.body;
    const milestones = [
      { title: 'Problem validation & user interviews', suggestedWeeks: 2, phase: 'Discovery' },
      { title: 'MVP scope lock & design', suggestedWeeks: 4, phase: 'Discovery' },
      { title: 'MVP build (core features)', suggestedWeeks: 8, phase: 'Build' },
      { title: 'Private beta & feedback', suggestedWeeks: 4, phase: 'Validate' },
      { title: 'Launch & first 100 users', suggestedWeeks: 4, phase: 'Launch' },
      { title: 'Metrics review & iteration', suggestedWeeks: 2, phase: 'Scale' },
    ];
    const fallback = {
      milestones: milestones.map((m, i) => ({
        ...m,
        order: i + 1,
        dueOffsetWeeks: milestones.slice(0, i + 1).reduce((s, x) => s + x.suggestedWeeks, 0),
      })),
      horizonWeeks,
      summary: ideaSummary ? `Smart milestones for: ${ideaSummary.slice(0, 60)}...` : `Default ${horizonWeeks}-week milestone plan.`,
    };
    const prompt = [
      'Return ONLY valid JSON matching schema:',
      '{"milestones":[{"title":string,"suggestedWeeks":number,"phase":string,"order":number,"dueOffsetWeeks":number}],"horizonWeeks":number,"summary":string}',
      `Idea summary: ${ideaSummary || 'N/A'}`,
      `Horizon weeks: ${horizonWeeks}`,
      'Use suggestedWeeks between 1 and 12 and dueOffsetWeeks as cumulative weeks.',
    ].join('\n');
    const result = await generateStructured<typeof fallback>(prompt, fallback);
    res.json(result);
  }
);

export { router as aiRoutes };
