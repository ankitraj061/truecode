import express from "express";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { activeAccountMiddleware } from "../middlewares/activeAccountMiddleware.js";
import { requestLoggingMiddleware } from "../middlewares/requestLoggingMiddleware.js";
import { ipRateLimitMiddleware } from "../middlewares/ipRateLimitMiddleware.js";
import {
    getAllProblemsAdmin,
    toggleProblemActive,
} from "../controllers/problemCreator.controller.js";

const adminProblemRouter = express.Router();

// All routes here are admin-only problem management
adminProblemRouter.use(
    ipRateLimitMiddleware,
    requestLoggingMiddleware,
    adminMiddleware,
    activeAccountMiddleware
);

// List problems with filters/pagination
adminProblemRouter.get("/", getAllProblemsAdmin);

// Quick toggle for isActive
adminProblemRouter.patch("/:id/toggle-active", toggleProblemActive);

export default adminProblemRouter;

