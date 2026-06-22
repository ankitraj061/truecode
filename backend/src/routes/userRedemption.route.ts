import { Router } from 'express';
import { createRedemption, getMyRedemptions, getMyAddress } from '../controllers/userRedemption.controller.js';
import { checkAuth } from '../middlewares/checkAuthMiddleware.js';

const router = Router();

router.use(checkAuth);
router.post('/', createRedemption);
router.get('/my', getMyRedemptions);
router.get('/my-address', getMyAddress);

export default router;
