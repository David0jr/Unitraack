import { Router } from 'express';
import { SuperAdminController } from '../controllers/SuperAdminController';
import { requireAuth, requireSuperAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de admin exigem autenticação E role SUPER_ADMIN
router.use(requireAuth);
router.use(requireSuperAdmin);

router.get('/tenants', SuperAdminController.listTenants);
router.post('/tenants', SuperAdminController.createTenantAndGenerateInvite);
router.post('/tenants/invite', SuperAdminController.generateInvite);
router.put('/tenants/:id', SuperAdminController.updateTenant);
router.delete('/tenants/:id', SuperAdminController.deleteTenant);
router.get('/users', SuperAdminController.listAllUsers);
router.get('/stats', SuperAdminController.getPlatformStats);

export default router;
