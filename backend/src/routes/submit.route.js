import express from 'express';
const submitRouter = express.Router();
import { userMiddleware } from '../middlewares/userMiddleware.js';
import { submitProblem , runProblem} from '../controllers/submit.controller.js';
import  submitCodeWaitingTimeMiddleware, { runCodeWaitingTimeMiddleware } from '../middlewares/submitCodeWaitingTimeMiddleware.js';

submitRouter.use(userMiddleware);


submitRouter.post('/submit/:problemId', submitCodeWaitingTimeMiddleware,submitProblem);
submitRouter.post('/run/:problemId', runCodeWaitingTimeMiddleware, runProblem);

export default submitRouter;
