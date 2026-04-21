import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { PublicAuthController } from '../controllers/PublicAuthController';

const router = Router();

// Rotas de Convite (Fluxo SaaS)
router.get('/invitation/:token', PublicAuthController.validateInvitation);
router.post('/register-gestor', PublicAuthController.registerGestor);

// Rota pública para pegar info da usina pelo subdomínio
router.get('/tenant-info', AuthController.getTenantInfo);
router.post('/register', PublicAuthController.register);

export default router;
