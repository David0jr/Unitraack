import { Router } from 'express';
import { GestorController } from '../controllers/GestorController';
import { SectorController } from '../controllers/SectorController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/dashboard', requireAuth, GestorController.listRequests);
router.post('/approve/:id', requireAuth, GestorController.approveRequest);
router.post('/reject/:id', requireAuth, GestorController.rejectRequest);

// Setores
router.get('/sectors', requireAuth, SectorController.listSectors);
router.post('/sectors', requireAuth, SectorController.createSector);
router.delete('/sectors/:id', requireAuth, SectorController.deleteSector);

// Monitoramento Operacional
router.get('/monitoring', requireAuth, GestorController.getMonitoring);
router.post('/transfer-material', requireAuth, GestorController.transferMaterial);
router.post('/map-layout', requireAuth, GestorController.updateMapLayout);
router.post('/material-position', requireAuth, GestorController.updateMaterialPosition);

// Auditoria & Checkout
router.post('/mark-checkout', requireAuth, GestorController.markCheckout);
router.get('/audit-report', requireAuth, GestorController.getAuditReport);
router.get('/third-parties', requireAuth, GestorController.getThirdParties);

export default router;
