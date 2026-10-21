import { Router } from 'express';
import authRoutes from './authRoutes';
import partnerRoutes from './partnerRoutes';
import leaderRoutes from './leaderRoutes';
import managerRoutes from './managerRoutes';
import gatekeeperRoutes from './gatekeeperRoutes';
import sectorRoutes from './sectorRoutes';
import adminRoutes from './adminRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/terceirizada', partnerRoutes);
router.use('/lider', leaderRoutes);
router.use('/gestor', managerRoutes);
router.use('/portaria', gatekeeperRoutes);
router.use('/sectors', sectorRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

export default router;
