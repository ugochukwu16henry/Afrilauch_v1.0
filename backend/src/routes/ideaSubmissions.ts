import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import * as ideaSubmissionController from '../controllers/ideaSubmissionController';

const router = Router();

const validation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('country').optional().trim(),
  body('ideaDescription').trim().notEmpty().withMessage('Idea description is required'),
  body('problemItSolves').optional().trim(),
  body('targetUsers').optional().trim(),
  body('industry').optional().trim(),
  body('stage').optional().isIn(['just_idea', 'prototype', 'existing_business']),
  body('goals').optional().isArray(),
  body('goals.*').optional().trim(),
  body('budgetRange').optional().trim(),
  body('ref').optional().isString().trim(),
  body('inviteToken').optional().isString().trim(),
];

/** POST /api/v1/idea-submissions — Public: submit idea, create account + client + project, trigger AI */
router.post('/', validation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return ideaSubmissionController.submit(req, res);
});

export { router as ideaSubmissionRoutes };
