import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { requireAuth } from '../../../middlewares/authMiddleware';

const router = Router();

router.get('/pendencias', requireAuth, RequestController.listLeaderPendencias);
router.post('/revisar/:id', requireAuth, RequestController.review);

export default router;
