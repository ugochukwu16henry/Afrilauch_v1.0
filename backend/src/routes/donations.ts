import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import * as donationController from '../controllers/donationController';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import { isUploadEnabled, uploadToCloud, validateFile } from '../services/uploadService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post(
  '/create-session',
  [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero'),
    body('paymentMethod').isIn(['card', 'paystack', 'bank_transfer']),
    body('currency').optional().trim().isLength({ min: 3, max: 6 }),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return donationController.createSession(req, res);
  }
);

router.post('/verify', [body('reference').trim().notEmpty()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return donationController.verify(req, res);
});

router.post('/bank-transfer/upload-receipt', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file?.buffer) {
    res.status(400).json({ error: 'No file uploaded. Use multipart/form-data with field "file".' });
    return;
  }

  if (!isUploadEnabled()) {
    res.status(503).json({ error: 'Receipt upload is not configured on the server.' });
    return;
  }

  const validation = validateFile('receipt', file.mimetype || '', file.size || file.buffer.length);
  if (!validation.ok) {
    res.status(400).json({ error: 'error' in validation ? validation.error : 'Invalid receipt file' });
    return;
  }

  try {
    const result = await uploadToCloud(
      file.buffer,
      'receipt',
      file.mimetype,
      'riseflow/receipt/donations',
      file.originalname
    );
    res.json({ url: result.secureUrl, secureUrl: result.secureUrl, publicId: result.publicId });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Receipt upload failed' });
  }
});

router.post(
  '/bank-transfer/confirm',
  [
    body('reference').trim().notEmpty(),
    body('proofUrl').trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('note').optional().isString().isLength({ max: 600 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return donationController.submitBankTransferConfirmation(req, res);
  }
);

router.get('/admin/bank-transfers', authMiddleware, requireSuperAdmin, (req, res) => {
  return donationController.listBankTransferDonations(req, res);
});

router.post(
  '/admin/bank-transfers/:id/confirm',
  authMiddleware,
  requireSuperAdmin,
  [body('note').optional().isString().isLength({ max: 500 })],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return donationController.confirmBankTransferDonation(req, res);
  }
);

export { router as donationRoutes };
