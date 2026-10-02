import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { requireAuth, requireRole } from '../../../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de liderança exigem papel LIDER_SETOR, GESTOR_SEGURANCA ou SUPER_ADMIN
router.use(requireAuth);
router.use(requireRole('LIDER_SETOR', 'GESTOR_SEGURANCA', 'SUPER_ADMIN'));

router.get('/pendencias', RequestController.listLeaderPendencias);
router.post('/revisar/:id', RequestController.review);
router.get('/meu-setor', RequestController.listSectorMaterials);
router.post('/transferir', RequestController.transferMaterial);
router.post('/aceitar-transferencia', RequestController.acceptTransfer);
router.post('/recusar-transferencia', RequestController.rejectTransfer);
router.post('/cancelar-transferencia', RequestController.cancelTransfer);
router.post('/marcar-saida', RequestController.markMaterialForExit);
router.get('/movimentacoes', RequestController.getAuditHistory);

export default router;
