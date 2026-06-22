import express from "express";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { activeAccountMiddleware } from "../middlewares/activeAccountMiddleware.js";
import { requestLoggingMiddleware } from "../middlewares/requestLoggingMiddleware.js";
import { ipRateLimitMiddleware } from "../middlewares/ipRateLimitMiddleware.js";
import {
    getAvailableProblemsForContest,
    createContest,
    listContestsAdmin,
    getContestAdmin,
    updateContestAdmin,
    deleteContestAdmin,
} from "../controllers/adminContest.controller.js";

const adminContestRouter = express.Router();

adminContestRouter.use(
    ipRateLimitMiddleware,
    requestLoggingMiddleware,
    adminMiddleware,
    activeAccountMiddleware
);

adminContestRouter.get("/available-problems", getAvailableProblemsForContest);
adminContestRouter.post("/", createContest);
adminContestRouter.get("/", listContestsAdmin);
adminContestRouter.get("/:contestId", getContestAdmin);
adminContestRouter.patch("/:contestId", updateContestAdmin);
adminContestRouter.delete("/:contestId", deleteContestAdmin);

export default adminContestRouter;
