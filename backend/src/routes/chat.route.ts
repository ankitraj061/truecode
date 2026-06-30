import express from 'express';
const router = express.Router();
import chatController from '../controllers/chat.controller.js';
import { validateChatRequest } from '../middlewares/chatValidator.js';
import { userMiddleware } from '../middlewares/userMiddleware.js';
import { optionalUserMiddleware } from '../middlewares/optionalUserMiddleware.js';
import { rateLimit } from '../middlewares/ipRateLimitMiddleware.js';

// Send chat message (public or authenticated)
router.post(
  '/problem/:problemId',
  rateLimit,
  optionalUserMiddleware,
  validateChatRequest,
  chatController.sendMessage
);

// Get chat history (requires auth)
router.get(
  '/problem/:problemId/history',
  userMiddleware,
  chatController.getChatHistory
);

// Clear chat history (requires auth)
router.delete(
  '/problem/:problemId/history',
  userMiddleware,
  chatController.clearChatHistory
);

export default router;