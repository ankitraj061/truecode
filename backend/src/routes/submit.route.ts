import express from 'express';
const submitRouter = express.Router();
import { userMiddleware } from '../middlewares/userMiddleware.js';
import { submitProblem , runProblem} from '../controllers/submit.controller.js';
import  submitCodeWaitingTimeMiddleware, { runCodeWaitingTimeMiddleware } from '../middlewares/submitCodeWaitingTimeMiddleware.js';

// NOTE: applied per-route, not via submitRouter.use(userMiddleware) — this
// router is mounted at the generic '/api' prefix shared by several other
// routers (chat, theme, etc). A router-level .use() with no path runs for
// EVERY request that reaches this router, including ones meant for a
// different, later-mounted router whose own routes don't match here. That
// previously caused unrelated public endpoints (e.g. /api/chat/...) to be
// silently blocked with 401 "Token not found" before ever reaching their
// own controller.
submitRouter.post('/submit/:problemId', userMiddleware, submitCodeWaitingTimeMiddleware, submitProblem);
submitRouter.post('/run/:problemId', userMiddleware, runCodeWaitingTimeMiddleware, runProblem);

export default submitRouter;
