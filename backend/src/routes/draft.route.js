import express from 'express';
import { checkAuth } from '../middlewares/checkAuthMiddleware.js';
import {
    saveSolutionDraft,
    getSolutionDraft,
    deleteSolutionDraft,
    getUserDrafts
} from '../controllers/draft.controller.js';

const router = express.Router();

// NOTE: checkAuth is applied per-route, not via router.use(checkAuth) — this
// router is mounted at the generic '/api' prefix shared by other routers
// (chat, etc). A router-level .use() with no path runs for every request
// reaching this router, even ones meant for a different, later-mounted
// router, silently blocking them with 401 before they're ever reached.

// Problem-specific draft routes
router.post('/problems/:problemId/draft', checkAuth, saveSolutionDraft);
router.get('/problems/:problemId/draft', checkAuth, getSolutionDraft);
router.delete('/problems/:problemId/draft', checkAuth, deleteSolutionDraft);

// User draft management
router.get('/drafts', checkAuth, getUserDrafts);

export default router;
