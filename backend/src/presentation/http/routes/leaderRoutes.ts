import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { requireAuth } from '../../../middlewares/authMiddleware';

const router = Router();

router.get('/pendencias', requireAuth, RequestController.listLeaderPendencias);
router.post('/revisar/:id', requireAuth, RequestController.review);
router.get('/meu-setor', requireAuth, RequestController.listSectorMaterials);
router.post('/transferir', requireAuth, RequestController.transferMaterial);
router.post('/aceitar-transferencia', requireAuth, RequestController.acceptTransfer);
router.post('/recusar-transferencia', requireAuth, RequestController.rejectTransfer);
router.post('/marcar-saida', requireAuth, RequestController.markMaterialForExit);

export default router;
