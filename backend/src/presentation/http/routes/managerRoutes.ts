import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { MonitoringController } from '../controllers/MonitoringController';
import { AuditController } from '../controllers/AuditController';
import { TeamController } from '../controllers/TeamController';
import { requireAuth, requireRole } from '../../../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de Gestão exigem autenticação E papel GESTOR_SEGURANCA ou SUPER_ADMIN
router.use(requireAuth);
router.use(requireRole('GESTOR_SEGURANCA', 'SUPER_ADMIN'));

// Gestão de Requisições
router.get('/requisicoes', RequestController.listByTenant);
router.get('/dashboard', RequestController.listByTenant);
router.post('/approve/:id', RequestController.review);
router.post('/mark-checkout', RequestController.markCheckout);

// Monitoramento Operativo
router.get('/monitoring', MonitoringController.getOperationalData);
router.post('/transfer-material', MonitoringController.transferMaterial);
router.post('/update-map-layout', MonitoringController.updateMapLayout);
router.post('/map-layout', MonitoringController.updateMapLayout);
router.post('/update-material-position', MonitoringController.updateMaterialPosition);

// Gestão de Equipe
router.get('/team', TeamController.listMembers);
router.put('/team/:id', TeamController.updateMember);
router.post('/team/:id/reset-password', TeamController.resetPassword);
router.delete('/team/:id', TeamController.deleteMember);

// Auditoria
router.get('/audit-report', AuditController.getAuditReport);
router.get('/third-parties', AuditController.getThirdPartyStats);

export default router;
