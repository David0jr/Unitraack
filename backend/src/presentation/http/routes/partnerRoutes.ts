import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { AuthenticationController } from '../controllers/AuthenticationController';
import { requireAuth, requireRole } from '../../../middlewares/authMiddleware';

console.log('[partnerRoutes] Loading Partner Routes...');
const router = Router();

// Todas as rotas de terceirizada exigem autenticação e papel apropriado
router.use(requireAuth);
router.use(requireRole('TERCEIRIZADA', 'GESTOR_SEGURANCA', 'SUPER_ADMIN'));

router.get('/profile', AuthenticationController.getProfile);
router.post('/requisicao', RequestController.create);
router.get('/requisicoes', RequestController.listByTenant);
router.put('/requisicao/:id', RequestController.update);
router.patch('/requisicao/:id/cancelar', RequestController.cancel);
router.delete('/requisicao/:id', RequestController.delete);

export default router;
