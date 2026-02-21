import { Router } from 'express';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import * as securityController from '../controllers/securityController';

const router = Router();

router.use(authMiddleware, requireSuperAdmin);

router.get('/overview', securityController.overview);
router.get('/events', securityController.listEvents);
router.get('/blocked-ips', securityController.listBlockedIps);
router.delete('/blocked-ips/:id', securityController.unblockIp);
router.post('/warnings', securityController.sendWarning);

export { router as securityAdminRoutes };

