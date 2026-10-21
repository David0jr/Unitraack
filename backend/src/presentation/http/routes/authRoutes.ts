import { Router } from 'express';
import { AuthenticationController } from '../controllers/AuthenticationController';
import { tenantContextMiddleware } from '../../../middlewares/tenantMiddleware';
import { requireAuth } from '../../../middlewares/authMiddleware';
import { authLimiter } from '../../../middlewares/securityMiddleware';

const router = Router();

router.post('/register', authLimiter, tenantContextMiddleware, AuthenticationController.register);
router.get('/tenant-info', tenantContextMiddleware, AuthenticationController.getTenantInfo);
router.get('/me', requireAuth, AuthenticationController.getProfile);
router.get('/invitation/:token', authLimiter, AuthenticationController.validateInvitation);
router.post('/register-gestor', authLimiter, AuthenticationController.registerGestor);

export default router;
