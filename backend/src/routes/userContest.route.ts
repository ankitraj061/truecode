import express from "express";
import { userMiddleware } from "../middlewares/userMiddleware.js";
import { optionalUserMiddleware } from "../middlewares/optionalUserMiddleware.js";
import { activeAccountMiddleware } from "../middlewares/activeAccountMiddleware.js";
import { requestLoggingMiddleware } from "../middlewares/requestLoggingMiddleware.js";
import { ipRateLimitMiddleware } from "../middlewares/ipRateLimitMiddleware.js";
import {
    listContests,
    getContest,
    registerContest,
    getLeaderboard,
    getContestProblem,
    myContests,
} from "../controllers/userContest.controller.js";
import { submitContestProblem } from "../controllers/submit.controller.js";
import submitCodeWaitingTimeMiddleware from "../middlewares/submitCodeWaitingTimeMiddleware.js";

const userContestRouter = express.Router();

userContestRouter.use(ipRateLimitMiddleware, requestLoggingMiddleware);

// Public: viewing contests doesn't require login
userContestRouter.get("/list", optionalUserMiddleware, listContests);
userContestRouter.get("/:contestId/leaderboard", optionalUserMiddleware, getLeaderboard);

// Auth required: anything that acts on behalf of the user
userContestRouter.get("/my", userMiddleware, activeAccountMiddleware, myContests);
userContestRouter.post("/:contestId/register", userMiddleware, activeAccountMiddleware, registerContest);
userContestRouter.get("/:contestId/problem/:problemId", userMiddleware, activeAccountMiddleware, getContestProblem);
userContestRouter.post("/:contestId/submit/:problemId", userMiddleware, activeAccountMiddleware, submitCodeWaitingTimeMiddleware, submitContestProblem);

// Public: viewing a single contest's details doesn't require login
userContestRouter.get("/:contestId", optionalUserMiddleware, getContest);

export default userContestRouter;
