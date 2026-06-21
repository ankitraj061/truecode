import express from 'express';
import {
    getProfile,
    updateProfile,
    checkUsernameAvailability,
    getProblemsStats,
    getHeatmapData,
    getRecentSubmissions,
    followUser,
    unfollowUser,
    getFollowStatus
} from '../controllers/profile.controller.js';
import { checkAuth as authMiddleware } from '../middlewares/checkAuthMiddleware.js';

const router = express.Router();

// ========================================
// PUBLIC ROUTES (No Authentication Required)
// ========================================

// Username availability check (public utility)
router.get('/profile/username-check', checkUsernameAvailability);

// View any user's profile by username
router.get('/:username/profile', getProfile);

// Get problem statistics by username
router.get('/:username/problems-stats', getProblemsStats);

// Get heatmap data by username (optional query: ?year=2024)
router.get('/:username/heatmap', getHeatmapData);

// Get recent submissions by username
router.get('/:username/recent-submissions', getRecentSubmissions);

// ========================================
// PROTECTED ROUTES (Authentication Required)
// ========================================

// NOTE: authMiddleware applied per-route, not via router.use(authMiddleware)
// — this router is mounted at the generic '/api' prefix shared by other
// routers. A router-level .use() with no path runs for every request
// reaching this router, even ones meant for a different, later-mounted
// router, silently blocking them with 401 before they're ever reached.

// Update own profile (requires authentication)
router.patch('/profile', authMiddleware, updateProfile);



// Follow/Unfollow Routes
router.post('/:username/follow', authMiddleware, followUser);
router.delete('/:username/unfollow', authMiddleware, unfollowUser);
router.get('/:username/follow-status', authMiddleware, getFollowStatus);

export default router;
