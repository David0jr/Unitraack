import { Router } from 'express';
import { LiderController } from '../controllers/LiderController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Listar solicitações pendentes DO SETOR do líder
router.get('/pendencias', requireAuth, LiderController.listRequests);

// Aprovar/Rejeitar solicitação específica
router.post('/approve/:id', requireAuth, LiderController.approveRequest);
router.post('/reject/:id', requireAuth, LiderController.rejectRequest);
router.post('/revisar/:id', requireAuth, LiderController.revisarRequest);

export default router;
