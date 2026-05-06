import { Router } from 'express';
import { SectorController } from '../controllers/SectorController';
import { requireAuth } from '../../../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuth, SectorController.listSectors);
router.post('/', requireAuth, SectorController.createSector);
router.delete('/:id', requireAuth, SectorController.deleteSector);

export default router;
