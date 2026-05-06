import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { requireAuth } from '../../../middlewares/authMiddleware';

const router = Router();

router.get('/approved', requireAuth, RequestController.listByTenant);
router.post('/checkin/:id', requireAuth, RequestController.confirmEntry);
router.post('/movimentacao/:id', requireAuth, RequestController.confirmMovement);
router.post('/divergencia/:id', requireAuth, RequestController.notifyDiscrepancy);
router.get('/audit/:tenantId', requireAuth, RequestController.getAuditHistory);

export default router;
