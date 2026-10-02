import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { requireAuth, requireRole } from '../../../middlewares/authMiddleware';

const router = Router();

// Rotas genéricas de Requisição
router.get('/', requireAuth, RequestController.listByTenant);
router.get('/:id', requireAuth, RequestController.getDetails);
router.post('/', requireAuth, RequestController.create);

// Ações específicas de fluxo protegidas por perfil
router.post('/:id/review', requireAuth, requireRole('LIDER_SETOR', 'GESTOR_SEGURANCA', 'SUPER_ADMIN'), RequestController.review);
router.post('/:id/confirm-entry', requireAuth, requireRole('PORTARIA', 'GESTOR_SEGURANCA', 'SUPER_ADMIN'), RequestController.confirmEntry);

export default router;
