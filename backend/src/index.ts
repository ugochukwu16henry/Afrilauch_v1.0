import 'dotenv/config';
import path from 'path';
import fs from 'fs';
// Optional: override with .env.local when present (local dev). On Render, use dashboard env vars only.
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) {
  require('dotenv').config({ path: envLocal, override: true });
}

// Fail fast if DATABASE_URL is missing or not a Postgres URL (e.g. on Render)
const dbUrl = process.env.DATABASE_URL?.trim() || '';
if (!dbUrl || !/^postgres(ql)?:\/\//i.test(dbUrl)) {
  console.error('FATAL: DATABASE_URL must be set and start with postgresql:// or postgres://. Check your platform (Railway/Render) Variables and link the PostgreSQL service.');
  process.exit(1);
}

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { clientRoutes } from './routes/clients';
import { projectRoutes } from './routes/projects';
import { taskRoutes } from './routes/tasks';
import { tasksStandaloneRoutes } from './routes/tasksStandalone';
import { agreementRoutes } from './routes/agreements';
import { milestoneRoutes } from './routes/milestones';
import { aiRoutes } from './routes/ai';
import { paymentRoutes } from './routes/payments';
import { notificationRoutes } from './routes/notifications';
import { investorRoutes } from './routes/investors';
import { startupRoutes } from './routes/startups';
import { investmentRoutes } from './routes/investments';
import { campaignRoutes } from './routes/campaigns';
import { leadRoutes } from './routes/leads';
import { analyticsRoutes } from './routes/analytics';
import { tenantRoutes } from './routes/tenants';
import { ideaSubmissionRoutes } from './routes/ideaSubmissions';
import { consultationRoutes } from './routes/consultations';
import { contactRoutes } from './routes/contact';
import { adminLeadsRoutes } from './routes/adminLeads';
import { setupFeeRoutes } from './routes/setupFee';
import { superAdminRoutes } from './routes/superAdmin';
import { securityAdminRoutes } from './routes/securityAdmin';
import { teamRoutes } from './routes/team';
import { workspaceRoutes } from './routes/workspace';
import { dealRoomRoutes } from './routes/dealRoom';
import { cmsRoutes } from './routes/cms';
import { talentRoutes } from './routes/talent';
import { hirerRoutes } from './routes/hirer';
import { hiringRoutes } from './routes/hiring';
import { ratingsRoutes } from './routes/ratings';
import { legalRoutes } from './routes/legal';
import { marketplaceFeeRoutes } from './routes/marketplaceFee';
import { partnerRoutes } from './routes/partner';
import { jobRequestRoutes } from './routes/jobRequests';
import { uploadRoutes } from './routes/upload';
import { businessRoutes } from './routes/business';
import { faqRoutes } from './routes/faq';
import { helpAiRoutes } from './routes/helpAi';
import { tourRoutes } from './routes/tours';
import { badgeRoutes } from './routes/badges';
import { settingsRoutes } from './routes/settings';
import { foundersRoutes } from './routes/founders';
import { forumRoutes } from './routes/forum';
import { earlyAccessRoutes } from './routes/earlyAccess';
import { manualPaymentRoutes } from './routes/manualPayments';
import { manualPaymentAdminRoutes } from './routes/manualPaymentsAdmin';
import { financeRoutes } from './routes/finance';
import { socialLinksRoutes } from './routes/socialLinks';
import { socialLinksAdminRoutes } from './routes/socialLinksAdmin';
import { shareMetaRoutes } from './routes/shareMeta';
import { shareMetaAdminRoutes } from './routes/shareMetaAdmin';
import { birthdayWishesRoutes } from './routes/birthdayWishes';
import { blockedIpMiddleware } from './middleware/blockedIp';
import { apiRateLimiter } from './middleware/rateLimit';
import { openAiFreeRoutes } from './routes/openAiFree';
import { chatFreeRoutes } from './routes/chatFree';
import { translateRoutes } from './routes/translate';
import { currencyOpenRoutes } from './routes/currencyOpen';
import { embeddingsRoutes } from './routes/embeddings';
import { imagesRoutes } from './routes/images';
import { publicDataRoutes } from './routes/publicData';
import { seoRoutes } from './routes/seo';
import { supportBannerRoutes } from './routes/supportBanner';
import * as webhookController from './controllers/webhookController';
import { isPaystackEnabled, getPaystackPublicKey } from './services/paystackService';
import { isAiGatewayConfigured, runAI } from './services/aiGatewayService';
import { startKeepAlive } from './services/keepAliveService';
import { sendNotificationEmail } from './services/emailService';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: allow FRONTEND_URL, localhost, known Vercel URLs, and production *.riseflowhub.app subdomains
const frontendOrigin = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
const allowedOrigins = [
  frontendOrigin,
  'http://localhost:3000',
  'https://riseflowhub-v1-0.vercel.app',
  'https://riseflowhubv10-git-main-henry-ugochukwus-projects.vercel.app',
  'https://riseflowhubv10-rkdkgpfcp-henry-ugochukwus-projects.vercel.app',
  // Production domains (Vercel + custom)
  'https://riseflowhub.app',
  'https://app.riseflowhub.app',
  'https://investors.riseflowhub.app',
  'https://admin.riseflowhub.app',
].filter((o) => o && o.length > 0);
const originSet = new Set(allowedOrigins);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin or tools like Postman
      if (originSet.has(origin)) return cb(null, origin);
      // Allow any Vercel deployment (*.vercel.app, *-*-*.vercel.app)
      if (origin && (origin.endsWith('.vercel.app') || origin.includes('vercel.app'))) return cb(null, origin);
      // Allow any RiseFlow custom subdomain (*.riseflowhub.app) plus the root domain
      if (origin && (origin === 'https://riseflowhub.app' || origin.endsWith('.riseflowhub.app'))) {
        return cb(null, origin);
      }
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Domain'],
  })
);
app.use(compression({ level: 6, threshold: 512 }));

// App-layer security: block known-bad IPs and apply global rate limiter
app.use(blockedIpMiddleware);
app.use(apiRateLimiter);

// Stripe and Paystack webhooks need raw body for signature verification (must be before express.json)
app.use(
  '/api/v1/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  webhookController.stripeWebhook
);
app.use(
  '/api/v1/webhooks/paystack',
  express.raw({ type: 'application/json' }),
  webhookController.paystackWebhook
);

app.use(express.json({ limit: '256kb' }));

// API v1 base
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/clients', clientRoutes);
// Mount task routes first so /projects/:id/tasks is matched before /projects/:id
app.use('/api/v1/projects', taskRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', tasksStandaloneRoutes);
app.use('/api/v1/agreements', agreementRoutes);
app.use('/api/v1/milestones', milestoneRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/investors', investorRoutes);
app.use('/api/v1/startups', startupRoutes);
app.use('/api/v1/investments', investmentRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/idea-submissions', ideaSubmissionRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/admin/leads', adminLeadsRoutes);
app.use('/api/v1/setup-fee', setupFeeRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1/super-admin/security', securityAdminRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/workspace', workspaceRoutes);
app.use('/api/v1/deal-room', dealRoomRoutes);
app.use('/api/v1/cms', cmsRoutes);
app.use('/api/v1/talent', talentRoutes);
app.use('/api/v1/hirer', hirerRoutes);
app.use('/api/v1/hiring', hiringRoutes);
app.use('/api/v1/ratings', ratingsRoutes);
app.use('/api/v1/legal', legalRoutes);
app.use('/api/v1/marketplace-fee', marketplaceFeeRoutes);
app.use('/api/v1/partner', partnerRoutes);
app.use('/api/v1/job-requests', jobRequestRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/faq', faqRoutes);
app.use('/api/v1/help-ai', helpAiRoutes);
app.use('/api/v1/tours', tourRoutes);
app.use('/api/v1/badges', badgeRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/founders', foundersRoutes);
app.use('/api/v1/forum', forumRoutes);
app.use('/api/v1/early-access', earlyAccessRoutes);
app.use('/api/v1/manual-payments', manualPaymentRoutes);
app.use('/api/v1/super-admin/manual-payments', manualPaymentAdminRoutes);
app.use('/api/v1/super-admin/finance', financeRoutes);
app.use('/api/v1/social-links', socialLinksRoutes);
app.use('/api/v1/super-admin/social-links', socialLinksAdminRoutes);
app.use('/api/v1/share-meta', shareMetaRoutes);
app.use('/api/v1/super-admin/share-meta', shareMetaAdminRoutes);
app.use('/api/v1/super-admin/birthday-wishes', birthdayWishesRoutes);
app.use('/api/v1/support-banner', supportBannerRoutes);

// Open / free helper APIs (no versioned path on purpose for flexibility)
app.use('/api/openai/free', openAiFreeRoutes);
app.use('/api/chat/free', chatFreeRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/currency', currencyOpenRoutes);
app.use('/api/embeddings', embeddingsRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/public-data', publicDataRoutes);
app.use('/api/seo', seoRoutes);

/** GET /health — lightweight health check for Render / UptimeRobot (no auth, no DB, target under 50ms) */
app.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=10');
  res.status(200).json({
    status: 'ok',
    service: 'RiseFlow Hub API',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health', (_, res) => {
  res.setHeader('Cache-Control', 'public, max-age=10');
  res.json({ status: 'ok', service: 'riseflow-api', timestamp: new Date().toISOString() });
});

/** POST /api/v1/monitor/alert — webhook for UptimeRobot etc.; sends email to ADMIN_EMAIL */
app.post('/api/v1/monitor/alert', (req, res) => {
  const secret = process.env.MONITOR_ALERT_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const adminEmail = process.env.ADMIN_EMAIL || '';
  if (!adminEmail) {
    res.status(503).json({ error: 'ADMIN_EMAIL not configured' });
    return;
  }
  const message =
    (req.body && (req.body.message ?? req.body.alertMessage ?? req.body.text)) ||
    'Backend health check failed. Check your Render service and logs.';
  sendNotificationEmail({
    type: 'security_alert',
    userEmail: adminEmail,
    dynamicData: {
      message: `🚨 Backend Down Alert — ${message}`,
      severity: 'critical',
      name: 'Admin',
    },
  }).catch((e) => console.error('[monitor/alert] Email failed:', e));
  res.sendStatus(200);
});

/** GET /api/v1/paystack/status — public check if Paystack is connected (no auth) */
app.get('/api/v1/paystack/status', (_, res) => {
  const enabled = isPaystackEnabled();
  const publicKeySet = !!getPaystackPublicKey();
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json({
    connected: enabled && publicKeySet,
    enabled,
    publicKeySet,
    message: enabled && publicKeySet
      ? 'Paystack is connected and ready for payments.'
      : !enabled
        ? 'Paystack not configured: set PAYSTACK_SECRET_KEY on the server (starts with sk_live_ or sk_test_).'
        : 'Paystack secret is set but PAYSTACK_PUBLIC_KEY is missing or invalid (must start with pk_).',
  });
});

/** GET /api/ai-test — simple connectivity test for Vercel AI Gateway */
app.get('/api/ai-test', async (_req, res) => {
  if (!isAiGatewayConfigured()) {
    res.status(503).json({
      success: false,
      error: 'AI Gateway not configured',
      message: 'Set AI_GATEWAY_API_KEY and AI_MODEL on the backend environment, then redeploy.',
    });
    return;
  }

  try {
    const response = await runAI('Say: AI connection successful');
    res.json({ success: true, response });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[ai-test] error:', err);
    const message =
      err instanceof Error ? err.message : 'AI test failed. Check backend logs for details.';

    // If the only issue is an empty text response, treat it as "connected"
    // but surface a soft warning message instead of a hard failure.
    if (message === 'AI Gateway returned an empty response.') {
      res.json({
        success: true,
        response: 'AI connection successful (model returned empty text; verify your Gateway model config).',
        warning: message,
      });
      return;
    }

    res.status(500).json({ success: false, error: message });
  }
});

// 404 for API routes — return JSON so frontend gets consistent error shape
app.use('/api', (_, res) => {
  res.status(404).json({ error: 'Not Found', code: 'NOT_FOUND' });
});

// Global error handler: prevent unhandled rejection from crashing the process; return JSON
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled error]', err?.message || err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

app.listen(PORT, () => {
  console.log(`RiseFlow API running at http://localhost:${PORT}`);
  startKeepAlive();
});
