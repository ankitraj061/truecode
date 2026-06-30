import chatService from '../services/chat.service.js';
import ChatHistory from '../models/chatHistory.js';
import { sendError } from '../contracts/apiResponse.js';

class ChatController {
  // Handle chat message
  async sendMessage(req , res, next) {
    try {
      const { problemId } = req.params;
      const { message, conversationHistory = [] } = req.body;
      const userId = req.user?._id; // From optional auth middleware

      // Process chat
      const result = await chatService.processChat(
        problemId,
        message,
        conversationHistory
      );

      // Optionally save chat history
      if (userId && !result.isOffTopic) {
        const updatedHistory = [
          ...conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: result.response }
        ];
        
        // Fire and forget - don't await
        const isPremium = req.user?.subscriptionType === 'premium';
        chatService.saveChatHistory(userId, problemId, updatedHistory, isPremium)
          .catch(() => {});
      }

      res.json({
        success: true,
        data: {
          response: result.response,
          isOffTopic: result.isOffTopic,
          tokensUsed: result.tokensUsed,
          model: result.model
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get chat history for a problem
  async getChatHistory(req, res, next) {
    try {
      const { problemId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return sendError(res, 401, 'Authentication required');
      }

      const history = await ChatHistory.findOne({ userId, problemId })
        .select('messages createdAt updatedAt')
        .lean();

      res.json({
        success: true,
        data: history || { messages: [] }
      });
    } catch (error) {
      next(error);
    }
  }

  // Clear chat history
  async clearChatHistory(req, res, next) {
    try {
      const { problemId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return sendError(res, 401, 'Authentication required');
      }

      await ChatHistory.findOneAndDelete({ userId, problemId });

      res.json({
        success: true,
        message: 'Chat history cleared'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ChatController();
