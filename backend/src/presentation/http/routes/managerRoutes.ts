import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { MonitoringController } from '../controllers/MonitoringController';
import { AuditController } from '../controllers/AuditController';
import { requireAuth } from '../../../middlewares/authMiddleware';

const router = Router();

// Gestão de Requisições
router.get('/requisicoes', requireAuth, RequestController.listByTenant);
router.get('/dashboard', requireAuth, RequestController.listByTenant);
router.post('/approve/:id', requireAuth, RequestController.review);

// Monitoramento Operativo
router.get('/monitoring', requireAuth, MonitoringController.getOperationalData);
router.post('/transfer-material', requireAuth, MonitoringController.transferMaterial);
router.post('/update-map-layout', requireAuth, MonitoringController.updateMapLayout);
router.post('/map-layout', requireAuth, MonitoringController.updateMapLayout);
router.post('/update-material-position', requireAuth, MonitoringController.updateMaterialPosition);

// Auditoria
router.get('/audit-report', requireAuth, AuditController.getAuditReport);
router.get('/third-parties', requireAuth, AuditController.getThirdPartyStats);

export default router;
