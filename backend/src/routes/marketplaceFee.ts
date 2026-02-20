import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as marketplaceFeeController from '../controllers/marketplaceFeeController';

const router = Router();

router.use(authMiddleware);

router.post(
	'/create-session',
	[
		body('type').isIn(['talent_marketplace_fee', 'hirer_platform_fee']),
		body('currency').optional().trim().isLength({ max: 6 }),
		body('paymentMethod').optional().isIn(['auto', 'stripe', 'paystack', 'bank_transfer', 'other']),
	],
	(req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		return marketplaceFeeController.createSession(req, res);
	}
);
router.post('/verify', marketplaceFeeController.verify);

export const marketplaceFeeRoutes = router;
