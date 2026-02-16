import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { getClientIp, logSecurityEvent } from '../services/securityService';

/** Global API rate limiter (defense against abuse / basic DDoS at app layer). */
export const apiRateLimiter = rateLimit({
  windowMs: Number(process.env.SECURITY_API_WINDOW_MS || 60_000), // default 1 minute
  max: Number(process.env.SECURITY_API_MAX_REQUESTS || 120), // per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  skip: (req: Request) => {
    // Skip health checks, webhooks, and monitor alert (for UptimeRobot etc.)
    if (req.path === '/health' || req.path.startsWith('/api/v1/health')) return true;
    if (req.path.startsWith('/api/v1/webhooks/')) return true;
    if (req.path === '/api/v1/monitor/alert') return true;
    return false;
  },
  handler: async (req: Request, res: Response, _next: NextFunction, _options) => {
    const ip = getClientIp(req);
    await logSecurityEvent({
      ip,
      userId: (req as any).user?.userId ?? null,
      userAgent: req.headers['user-agent'] as string | undefined,
      type: 'rate_limit_exceeded',
      severity: 'low',
      message: 'Global API rate limit exceeded',
      metadata: {
        path: req.path,
        method: req.method,
      },
    }).catch(() => {});
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
  },
});

/** Login-specific rate limiter with lower threshold. */
export const loginRateLimiter = rateLimit({
  windowMs: Number(process.env.SECURITY_LOGIN_WINDOW_MS || 15 * 60_000), // 15 mins
  max: Number(process.env.SECURITY_LOGIN_MAX_ATTEMPTS || 20),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  handler: async (req: Request, res: Response, _next: NextFunction, _options) => {
    const ip = getClientIp(req);
    await logSecurityEvent({
      ip,
      userId: null,
      userAgent: req.headers['user-agent'] as string | undefined,
      type: 'login_suspicious',
      severity: 'high',
      message: 'Login rate limit exceeded for IP',
      metadata: {
        path: req.path,
        method: req.method,
      },
    }).catch(() => {});
    res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  },
});

/** AI-specific rate limiter for /api/v1/ai endpoints (stricter to protect token usage). */
export const aiRateLimiter = rateLimit({
  windowMs: Number(process.env.SECURITY_AI_WINDOW_MS || 60_000), // default 1 minute
  max: Number(process.env.SECURITY_AI_MAX_REQUESTS || 20), // per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  handler: async (req: Request, res: Response, _next: NextFunction, _options) => {
    const ip = getClientIp(req);
    await logSecurityEvent({
      ip,
      userId: (req as any).user?.userId ?? null,
      userAgent: req.headers['user-agent'] as string | undefined,
      type: 'rate_limit_exceeded',
      severity: 'medium',
      message: 'AI rate limit exceeded',
      metadata: {
        path: req.path,
        method: req.method,
      },
    }).catch(() => {});
    res.status(429).json({ error: 'Too many AI requests. Please slow down.' });
  },
});

