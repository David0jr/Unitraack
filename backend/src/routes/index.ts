import { Router } from 'express';
import terceirizadaRoutes from './terceirizadaRoutes';
import liderRoutes from './liderRoutes';
import portariaRoutes from './portariaRoutes';
import gestorRoutes from './gestorRoutes';
import adminRoutes from './adminRoutes';
import authRoutes from './authRoutes';

const router = Router();

// Agrupador central de rotas:
router.use('/auth', authRoutes);
router.use('/terceirizada', terceirizadaRoutes);
router.use('/lider', liderRoutes);
router.use('/portaria', portariaRoutes);
router.use('/gestor', gestorRoutes);
router.use('/admin', adminRoutes);

export default router;
