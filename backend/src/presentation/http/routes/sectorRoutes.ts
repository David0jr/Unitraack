import { Router } from 'express';
import { SectorController } from '../controllers/SectorController';
import { requireAuth, requireRole } from '../../../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuth, SectorController.listSectors);
router.post('/', requireAuth, requireRole('GESTOR_SEGURANCA', 'SUPER_ADMIN'), SectorController.createSector);
router.delete('/:id', requireAuth, requireRole('GESTOR_SEGURANCA', 'SUPER_ADMIN'), SectorController.deleteSector);

export default router;
