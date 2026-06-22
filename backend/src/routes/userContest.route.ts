import express from "express";
import { userMiddleware } from "../middlewares/userMiddleware.js";
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

userContestRouter.use(
    ipRateLimitMiddleware,
    requestLoggingMiddleware,
    userMiddleware,
    activeAccountMiddleware
);

userContestRouter.get("/list", listContests);
userContestRouter.get("/my", myContests);
userContestRouter.get("/:contestId", getContest);
userContestRouter.post("/:contestId/register", registerContest);
userContestRouter.get("/:contestId/leaderboard", getLeaderboard);
userContestRouter.get("/:contestId/problem/:problemId", getContestProblem);
userContestRouter.post("/:contestId/submit/:problemId", submitCodeWaitingTimeMiddleware, submitContestProblem);

export default userContestRouter;
