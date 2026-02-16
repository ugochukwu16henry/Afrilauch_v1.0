import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, requireSetupPaid } from '../middleware/auth';
import * as aiCofounderController from '../controllers/aiCofounderController';
import { aiRateLimiter } from '../middleware/rateLimit';
import { isAiGatewayConfigured, runAI } from '../services/aiGatewayService';

const router = Router();

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
        err instanceof Error ? err.message : 'AI request failed. Check backend logs for details.';
      return res.status(500).json({ error: 'AI request failed', message });
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

// POST /api/v1/ai/evaluate-idea — Mock: returns feasibility, risk, market potential, MVP scope
router.post(
  '/evaluate-idea',
  [body('ideaDescription').trim().notEmpty(), body('industry').optional().trim(), body('country').optional().trim()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { ideaDescription, industry = '', country = '' } = req.body;
    // Mock response — replace with OpenAI or real logic later
    const feasibilityScore = Math.min(95, 60 + Math.floor(Math.random() * 35));
    const riskLevel = feasibilityScore > 80 ? 'Low' : feasibilityScore > 60 ? 'Medium' : 'High';
    const marketPotential = feasibilityScore > 75 ? 'High' : feasibilityScore > 50 ? 'Medium' : 'Emerging';
    res.json({
      feasibilityScore,
      riskLevel,
      marketPotential,
      suggestedMvpScope: [
        'Core product MVP (1–2 key features)',
        'Landing page + waitlist',
        'Basic analytics',
        industry ? `Industry-specific compliance (${industry})` : 'Compliance review',
      ].filter(Boolean),
      summary: `Idea evaluated for ${country || 'your region'}. Feasibility: ${feasibilityScore}%. Risk: ${riskLevel}. Market: ${marketPotential}.`,
    });
  }
);

// POST /api/v1/ai/generate-proposal — Mock: project scope, timeline, tech stack, cost
router.post(
  '/generate-proposal',
  [body('ideaSummary').optional().trim(), body('industry').optional().trim(), body('budgetRange').optional().trim()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { ideaSummary = '', industry = '', budgetRange = '' } = req.body;
    res.json({
      projectScope: ['Discovery & requirements', 'UI/UX design', 'Frontend (Next.js)', 'Backend API', 'Database & auth', 'Deployment & DevOps'],
      timelineWeeks: 12,
      techStack: { frontend: 'Next.js, React, Tailwind', backend: 'Node.js, Express, Prisma', database: 'PostgreSQL', hosting: 'Vercel + Render' },
      estimatedCostUsd: 8500,
      estimatedCostNgn: 8500 * 1600,
      estimatedCostEur: 8500 * 0.92,
      estimatedCostGbp: 8500 * 0.79,
      currency: 'USD',
      summary: `Proposal for ${industry || 'startup'}. Timeline: 12 weeks. Budget range considered: ${budgetRange || 'standard'}.`,
    });
  }
);

// POST /api/v1/ai/pricing — Mock: multi-currency pricing
router.post(
  '/pricing',
  [body('amountUsd').optional().isFloat({ min: 0 }), body('scope').optional().trim(), body('region').optional().trim()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const amountUsd = Number(req.body.amountUsd) || 5000;
    const rates = { NGN: 1600, EUR: 0.92, GBP: 0.79 };
    res.json({
      amountUsd,
      conversions: {
        USD: amountUsd,
        NGN: Math.round(amountUsd * rates.NGN),
        EUR: Math.round(amountUsd * rates.EUR * 100) / 100,
        GBP: Math.round(amountUsd * rates.GBP * 100) / 100,
      },
      regionAdjustment: 1,
      summary: `Pricing for ${amountUsd} USD. Multi-currency support across regions.`,
    });
  }
);

// POST /api/v1/ai/project-insights — Mock: predict delays, suggest optimizations
router.post(
  '/project-insights',
  [body('projectId').optional().isUUID()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    res.json({
      predictedDelays: [],
      riskAreas: ['Scope creep', 'Resource availability'],
      suggestions: ['Lock scope for current phase', 'Weekly client check-ins', 'Buffer 1–2 weeks for QA'],
      overallHealth: 'On track',
      summary: 'AI insights (mock). Connect to real project data for accurate predictions.',
    });
  }
);

// POST /api/v1/ai/marketing-suggestions — Mock: growth suggestions from analytics
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
    const platforms = Object.keys(byPlatform).length || 1;
    const suggestions: string[] = [];
    if (traffic === 0) {
      suggestions.push('Launch campaigns on Meta and Google to drive initial traffic.');
      suggestions.push('Set up email capture (landing page or lead magnet) for Email channel.');
    } else if (conversions === 0) {
      suggestions.push('Optimize landing pages and CTAs to improve conversion rate.');
      suggestions.push('Review audience targeting; consider A/B testing ad creatives.');
    }
    if (cac != null && cac > 50) {
      suggestions.push('CAC is high; try narrowing audience or testing lower-funnel channels.');
    }
    if (roi != null && roi < 100) {
      suggestions.push('Focus on retargeting and email sequences to improve ROI.');
    }
    if (platforms < 2) {
      suggestions.push('Diversify: add a second platform (Meta, Google, or Email) to reduce risk.');
    }
    if (suggestions.length === 0) {
      suggestions.push('Scale winning campaigns; consider lookalike audiences.');
      suggestions.push('Run retention campaigns (email, Meta retargeting) for converted users.');
    }
    res.json({
      suggestions,
      summary: `Based on traffic ${traffic}, conversions ${conversions}, CAC ${cac ?? 'N/A'}, ROI ${roi ?? 'N/A'}%.`,
    });
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
    const roles = ['Technical cofounder (CTO)', 'Business/ops cofounder (COO)', 'Product cofounder', 'Growth/marketing cofounder'];
    const traits = ['Complementary skills', 'Aligned vision', 'Clear equity split', 'Defined decision-making'];
    res.json({
      idealCofounderProfile: roles.slice(0, 2),
      roleFit: { yourRole: currentRole, suggestedComplement: roles[0] },
      traitsToLookFor: traits,
      redFlags: ['No vesting', 'Unclear roles', 'No written agreement'],
      summary: `For "${idea.slice(0, 50)}...", consider a cofounder strong in ${roles[0].toLowerCase()}. Skills to seek: ${(skillsNeeded as string[]).length ? (skillsNeeded as string[]).join(', ') : 'complementary to yours'}.`,
    });
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
    res.json({
      executiveSummary: `A venture addressing: ${idea}. Target: ${targetMarket}. Model: ${businessModel}. We aim to validate in 6 months and scale in 12.`,
      problemStatement: `Current solutions are fragmented, expensive, or not tailored to the target segment. Opportunity: ${industry} market gap.`,
      solution: `Our solution focuses on core value: clarity, ease of use, and measurable outcomes for ${targetMarket}.`,
      marketOpportunity: { size: 'Addressable market in billions (TAM/SAM/SOM).', trends: ['Digital adoption', 'Remote-first', 'Data-driven decisions'] },
      businessModel: { revenue: businessModel, pricing: 'Tiered subscription; enterprise custom.', unitEconomics: 'CAC, LTV, payback period to be validated.' },
      goToMarket: ['Launch MVP to early adopters', 'Content and partnerships', 'Paid acquisition once PMF'],
      financialProjections: { year1: 'Focus on retention and ARR', year2: 'Scale marketing', year3: 'Expand segments' },
      summary: `Business plan outline generated for ${industry} venture. Refine with real numbers and market research.`,
    });
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
    res.json({
      marketSize: { tam: 'Total addressable market growing 15%+ CAGR', sam: 'Serviceable addressable market', som: 'Realistic Year 1–3 capture' },
      trends: ['Digital transformation', 'Mobile-first', 'Localization and trust', 'Regulation and compliance'],
      competitors: ['Incumbents (broad, legacy)', 'Niche players', 'Regional alternatives'],
      opportunities: [`First-mover in ${region} for this use case`, 'Partnerships with incumbents', 'Upsell and expansion revenue'],
      threats: ['Funding cycles', 'Talent', 'Infrastructure'],
      summary: `Market analysis for ${industry} in ${region}. Validate with primary research and expert interviews.`,
    });
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
    const score = Math.min(95, 45 + Math.floor(Math.random() * 50));
    const risks = [
      { area: 'Market', level: 'Medium', description: 'Market timing and adoption risk.', mitigation: 'Validate with early users and pilots.' },
      { area: 'Execution', level: 'Medium', description: 'Team capacity and delivery risk.', mitigation: 'Scope MVP tightly; consider technical cofounder.' },
      { area: 'Financial', level: 'Low', description: 'Runway and burn rate.', mitigation: '18-month runway target; diversify revenue.' },
    ];
    res.json({
      risks,
      investorReadinessScore: score,
      scoreBreakdown: {
        team: Math.min(100, score + 5),
        market: Math.min(100, score),
        traction: Math.max(0, score - 10),
        financials: Math.min(100, score + 2),
        documentation: Math.max(0, score - 15),
      },
      nextSteps: [
        'Document assumptions and milestones in a one-pager.',
        'Prepare a clear ask (amount, use of funds).',
        score < 60 ? 'Strengthen traction or team before pitching.' : 'Consider soft commitments and intro meetings.',
      ],
      summary: `Investor readiness: ${score}/100. Focus on improving lowest scores before raising.`,
    });
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
    const content = (lastUser?.content ?? '').toLowerCase();
    let reply = 'Share more about your idea—problem, who it’s for, and why now—and I’ll give focused feedback.';
    if (content.includes('market') || content.includes('competitor')) {
      reply = 'Market and competition matter a lot. I can run a market analysis for you from the Mentor—use the Market insights tab and paste your idea there.';
    } else if (content.includes('investor') || content.includes('pitch')) {
      reply = 'Use the Risk & investor readiness section here to get a readiness score and a list of next steps before you pitch.';
    } else if (content.length > 80) {
      reply = `You’ve described a clear direction. Next: (1) Validate with 5–10 potential users. (2) Draft a one-page business plan using the Business plan tab. (3) Check your investor readiness in the Risk analysis section.`;
    }
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
    res.json({
      milestones: milestones.map((m, i) => ({
        ...m,
        order: i + 1,
        dueOffsetWeeks: milestones.slice(0, i + 1).reduce((s, x) => s + x.suggestedWeeks, 0),
      })),
      horizonWeeks,
      summary: ideaSummary ? `Smart milestones for: ${ideaSummary.slice(0, 60)}...` : `Default ${horizonWeeks}-week milestone plan. Adapt to your project.`,
    });
  }
);

export { router as aiRoutes };
