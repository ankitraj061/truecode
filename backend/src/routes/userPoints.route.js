import express from 'express';
import { getPoints, addPoints } from '../controllers/userPoints.controller.js';
import { checkAuth as authMiddleware } from '../middlewares/checkAuthMiddleware.js';

const router = express.Router();

// All points routes require authentication
router.use(authMiddleware);

// GET /api/user/points — returns current points balance
router.get('/points', getPoints);

// POST /api/user/points/add — add/subtract points (internal/admin use)
router.post('/points/add', addPoints);

export default router;
