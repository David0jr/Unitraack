import { Router } from 'express';
import { PortariaController } from '../controllers/PortariaController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Listar aprovados
router.get('/approved', requireAuth, PortariaController.listAuthorizedRequests);

// Realizar check-in
router.post('/checkin/:id', requireAuth, PortariaController.confirmEntry);

// Ver detalhes
router.get('/details/:id', requireAuth, PortariaController.getRequestDetails);

export default router;
