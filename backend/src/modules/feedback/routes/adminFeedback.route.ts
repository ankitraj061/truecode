import express from "express";
import { adminMiddleware } from "../../../middlewares/adminMiddleware.js";
import {
    getAllFeedback,
    updateFeedbackStatus,
} from "../controllers/adminFeedback.controller.js";

const adminFeedbackRouter = express.Router();

adminFeedbackRouter.use(adminMiddleware);

adminFeedbackRouter.get("/", getAllFeedback);
adminFeedbackRouter.patch("/:id/status", updateFeedbackStatus);

export default adminFeedbackRouter;
