import express from "express";
import { formatCode, getLastSubmission } from "../controllers/code.controller.js";
import { userMiddleware } from "../../../middlewares/userMiddleware.js";

const codeRouter = express.Router();

codeRouter.post('/format',
    userMiddleware, // Ensure user is authenticated
    formatCode
);

codeRouter.get('/last/:problemId',
    userMiddleware,
    getLastSubmission
);

export default codeRouter;
