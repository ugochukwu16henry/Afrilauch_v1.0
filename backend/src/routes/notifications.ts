import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import * as emailController from '../controllers/emailController';
import * as notificationController from '../controllers/notificationController';

const router = Router();
const prisma = new PrismaClient();

const EMAIL_TYPES = [
  'account_created',
  'consultation_booked',
  'idea_submitted',
  'proposal_ready',
  'agreement_pending',
  'agreement_signed',
  'payment_required',
  'milestone_completed',
  'project_launched',
  'investor_interest_received',
  'team_invite',
  'payment_confirmation',
  'talent_approval',
  'interview_invite',
  'password_reset',
  'admin_new_signup_alert',
] as const;

const emailValidation = [
  body('type').isIn([...EMAIL_TYPES]).withMessage('Valid type is required'),
  body('userEmail').isEmail().normalizeEmail().withMessage('Valid userEmail is required'),
  body('dynamicData').optional().isObject(),
];

/** POST /api/v1/notifications/email — Send notification email (internal / API key) */
router.post('/email', emailValidation, async (req: Request, res: Response) => {
  const apiKey = process.env.INTERNAL_API_KEY;
  if (apiKey) {
    const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.headers['x-api-key'];
    if (auth !== apiKey) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return emailController.sendEmailHandler(req, res);
});

/** POST /api/v1/notifications/send — Internal: create in-app notification */
router.post('/send', notificationController.send);

router.use(authMiddleware);

/** GET /api/v1/notifications — List user in-app notifications */
router.get('/', notificationController.list);

/** PATCH /api/v1/notifications/:id/read — Mark one as read */
router.patch('/:id/read', notificationController.markRead);

/** POST /api/v1/notifications/mark-all-read — Mark all as read */
router.post('/mark-all-read', notificationController.markAllRead);

export { router as notificationRoutes };
