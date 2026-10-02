import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { requireAuth, requireRole } from '../../../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de portaria exigem papel PORTARIA, GESTOR_SEGURANCA ou SUPER_ADMIN
router.use(requireAuth);
router.use(requireRole('PORTARIA', 'GESTOR_SEGURANCA', 'SUPER_ADMIN'));

router.get('/approved', RequestController.listByTenant);
router.post('/status/:id', RequestController.updateGateStatus);
router.post('/checkin/:id', RequestController.confirmEntry);
router.post('/movimentacao/:id', RequestController.confirmMovement);
router.post('/divergencia/:id', RequestController.notifyDiscrepancy);
router.get('/audit/:tenantId', RequestController.getAuditHistory);
router.post('/cancelar/:id', RequestController.cancelByGatekeeper);

export default router;
