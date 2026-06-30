import { Router } from 'express';
import { getAllRedemptions, updateRedemptionStatus } from '../controllers/adminRedemption.controller.js';
import { adminMiddleware } from '../../../middlewares/adminMiddleware.js';

const router = Router();

router.use(adminMiddleware);
router.get('/', getAllRedemptions);
router.patch('/:id/status', updateRedemptionStatus);

export default router;
