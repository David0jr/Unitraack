import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { requireAuth } from '../../../middlewares/authMiddleware';

const router = Router();

router.get('/pendencias', requireAuth, RequestController.listLeaderPendencias);
router.post('/revisar/:id', requireAuth, RequestController.review);
router.get('/meu-setor', requireAuth, RequestController.listSectorMaterials);
router.post('/transferir', requireAuth, RequestController.transferMaterial);
router.post('/aceitar-transferencia', requireAuth, RequestController.acceptTransfer);

export default router;
