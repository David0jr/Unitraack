import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { AuthenticationController } from '../controllers/AuthenticationController';
import { requireAuth } from '../../../middlewares/authMiddleware';

console.log('[partnerRoutes] Loading Partner Routes...');
const router = Router();

router.get('/profile', requireAuth, AuthenticationController.getProfile);
router.post('/requisicao', requireAuth, RequestController.create);
router.get('/requisicoes', requireAuth, RequestController.listByTenant);
router.put('/requisicao/:id', requireAuth, RequestController.update);
router.patch('/requisicao/:id/cancelar', requireAuth, RequestController.cancel);
router.delete('/requisicao/:id', requireAuth, RequestController.delete);

export default router;
