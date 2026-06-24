import express from 'express';
import { getPoints, addPoints } from '../controllers/userPoints.controller.js';
import { checkAuth as authMiddleware } from '../middlewares/checkAuthMiddleware.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';

const router = express.Router();

// NOTE: authMiddleware applied per-route, not via router.use(authMiddleware)
// — see profile.route.js / submit.route.js for why a blanket router-level
// .use() is dangerous on routers mounted at a shared prefix.

// GET /api/user/points — returns current points balance
router.get('/points', authMiddleware, getPoints);

// POST /api/user/points/add — admin-only manual points adjustment
router.post('/points/add', adminMiddleware, addPoints);

export default router;
