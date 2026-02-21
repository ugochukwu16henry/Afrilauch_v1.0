import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { authMiddleware, requireRoles } from '../middleware/auth';
import * as settingsController from '../controllers/settingsController';
import * as profileMediaController from '../controllers/profileMediaController';

const router = Router();

router.use(authMiddleware);

// Rate limit profile/security updates a bit to avoid abuse
const settingsUpdateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { error: 'Too many settings changes. Please try again in a few minutes.' },
  standardHeaders: true,
});

const mediaUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 25,
  message: { error: 'Too many upload attempts. Please wait a few minutes.' },
  standardHeaders: true,
});

const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Profile & company
router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsUpdateLimiter, settingsController.updateProfile);
router.get('/profile/media-status', profileMediaController.getMediaStatus);
router.post('/profile/avatar', mediaUploadLimiter, mediaUpload.single('file'), profileMediaController.uploadAvatar);
router.delete('/profile/avatar', settingsUpdateLimiter, profileMediaController.deleteAvatar);
router.post('/profile/company-logo', mediaUploadLimiter, mediaUpload.single('file'), profileMediaController.uploadCompanyLogo);
router.delete('/profile/company-logo', settingsUpdateLimiter, profileMediaController.deleteCompanyLogo);

// Super Admin override
router.post(
  '/admin/users/:userId/avatar',
  requireRoles('super_admin'),
  mediaUploadLimiter,
  mediaUpload.single('file'),
  profileMediaController.adminUploadUserAvatar
);
router.delete(
  '/admin/users/:userId/avatar',
  requireRoles('super_admin'),
  settingsUpdateLimiter,
  profileMediaController.adminDeleteUserAvatar
);

// Security
router.put(
  '/security/email',
  settingsUpdateLimiter,
  [body('newEmail').isEmail(), body('password').notEmpty()],
  settingsController.updateEmail
);
router.put(
  '/security/password',
  settingsUpdateLimiter,
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 8 })],
  settingsController.updatePassword
);
router.post(
  '/security/2fa-enable',
  settingsUpdateLimiter,
  [body('enabled').isBoolean()],
  settingsController.enable2FA
);
router.get('/security/sessions', settingsController.listSessions);
router.delete('/security/sessions/:id', settingsController.revokeSession);

// Notifications
router.get('/notifications', settingsController.getNotificationSettings);
router.put('/notifications', settingsUpdateLimiter, settingsController.updateNotificationSettings);

// Preferences
router.get('/preferences', settingsController.getPreferences);
router.put('/preferences', settingsUpdateLimiter, settingsController.updatePreferences);

// Privacy
router.get('/privacy', settingsController.getPrivacy);
router.put('/privacy', settingsUpdateLimiter, settingsController.updatePrivacy);

// Billing & data
router.get('/billing', settingsController.getBilling);
router.get('/data-export', settingsController.exportData);

// Account status & deletion
router.get('/account-status', settingsController.getAccountStatus);
router.get('/activity', settingsController.getActivity);
router.post('/delete-request', settingsController.requestDelete);
router.post('/delete-cancel', settingsController.cancelDelete);

export { router as settingsRoutes };

