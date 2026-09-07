import { Router } from 'express';
import { AuthenticationController } from '../controllers/AuthenticationController';
import { tenantContextMiddleware } from '../../../middlewares/tenantMiddleware';
import { requireAuth } from '../../../middlewares/authMiddleware';

const router = Router();

router.post('/register', tenantContextMiddleware, AuthenticationController.register);
router.get('/tenant-info', tenantContextMiddleware, AuthenticationController.getTenantInfo);
router.get('/me', requireAuth, AuthenticationController.getProfile);
router.get('/invitation/:token', AuthenticationController.validateInvitation);
router.post('/register-gestor', AuthenticationController.registerGestor);

export default router;
