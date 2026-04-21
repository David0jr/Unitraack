import { Router } from 'express';
import { TerceirizadaController } from '../controllers/TerceirizadaController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint onde a terceirizada que já logou posta os itens.
// Precisa de autenticação, o authMiddleware vai validar o Supabase JWT
router.post('/requisicao', requireAuth, TerceirizadaController.criarRequisicao);
router.put('/requisicao/:id', requireAuth, TerceirizadaController.editarRequisicao);
router.patch('/requisicao/:id/cancelar', requireAuth, TerceirizadaController.cancelarRequisicao);
router.delete('/requisicao/:id', requireAuth, TerceirizadaController.deletarRequisicao);
router.get('/profile', requireAuth, TerceirizadaController.getProfile);
router.patch('/update-color', requireAuth, TerceirizadaController.updateColor);

export default router;
