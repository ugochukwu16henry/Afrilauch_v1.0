import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as authController from '../controllers/authController';
import { loginRateLimiter } from '../middleware/rateLimit';

const router = Router();

const signupValidation = [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['client', 'developer', 'designer', 'marketer', 'project_manager', 'finance_admin', 'super_admin', 'investor', 'talent', 'hirer', 'hiring_company', 'hr_manager', 'legal_team', 'cofounder']),
];

router.post('/signup', signupValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return authController.signup(req, res);
});

// Frontend api.auth.register calls /auth/register; alias to signup
router.post('/register', signupValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return authController.signup(req, res);
});

router.post(
  '/login',
  [loginRateLimiter, body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return authController.login(req, res);
  }
);

router.get('/me', authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout);

export { router as authRoutes };
