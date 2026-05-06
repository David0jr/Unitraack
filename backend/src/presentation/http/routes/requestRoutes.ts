import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { requireAuth } from '../../../middlewares/authMiddleware';

const router = Router();

// Rotas genéricas de Requisição
router.get('/', requireAuth, RequestController.listByTenant);
router.get('/:id', requireAuth, RequestController.getDetails);
router.post('/', requireAuth, RequestController.create);

// Ações específicas de fluxo
router.post('/:id/review', requireAuth, RequestController.review);
router.post('/:id/confirm-entry', requireAuth, RequestController.confirmEntry);

export default router;
