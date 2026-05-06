import { Router } from 'express';
import { AuthenticationController } from '../controllers/AuthenticationController';
import { tenantContextMiddleware } from '../../../middlewares/tenantMiddleware';

const router = Router();

router.post('/register', tenantContextMiddleware, AuthenticationController.register);
router.get('/tenant-info', tenantContextMiddleware, AuthenticationController.getTenantInfo);

export default router;
