import { Router } from 'express';
import { RequestController } from '../controllers/RequestController';
import { requireAuth } from '../../../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuth, RequestController.listNotifications);
router.patch('/read-all', requireAuth, RequestController.markAllNotificationsRead);
router.delete('/clear-all', requireAuth, RequestController.clearAllNotifications);
router.patch('/:id/read', requireAuth, RequestController.markNotificationRead);

export default router;
