import groqClient from '../utils/groqClient.js';
import geminiClient from '../utils/geminiClient.js';
import { promptGenerator } from '../utils/promtGenerator.js';
import Problem from '../models/problem.js';
import ChatHistory from '../models/chatHistory.js';
import { NotFoundError, ForbiddenError, AppError } from '../contracts/apiResponse.js';


class ChatService {
  async processChat(problemId: string, userMessage: string, conversationHistory: any[] = []) {
    // Fetch problem from database with all necessary fields
    const problem: any = await Problem.findById(problemId)
      .select('-hiddenTestCases') // Don't include hidden test cases in AI context
      .lean();


    if (!problem) {
      throw new NotFoundError('Problem not found');
    }


    // Check if problem is active
    if (!problem.isActive) {
      throw new ForbiddenError('This problem is not currently available');
    }


    // Validate message relevance
    const validation = promptGenerator.validateMessageRelevance(
      userMessage,
      problem
    );


    if (!validation.isRelevant) {
      return {
        response: validation.response,
        isOffTopic: true,
        reason: validation.reason,
        tokensUsed: 0
      };
    }


    // Check if user is asking for complete solution
    const askingForSolution = promptGenerator.isAskingForCompleteSolution(userMessage);


    // Check if user is asking for a hint
    const hintMatch = userMessage.toLowerCase().match(/hint\s*(\d+)?|give.*hint|need.*hint/);
    if (hintMatch && problem.hints && problem.hints.length > 0) {
      const hintNumber = parseInt(hintMatch[1]) || 1;
      const hintData = promptGenerator.getHintResponse(problem, hintNumber);

      if (hintData) {
        const hintResponse = `**Hint ${hintData.hintNumber}/${hintData.totalHints}:** ${hintData.hint}\n\n${
          hintData.hasMore
            ? `Would you like another hint? Just ask for "hint ${hintData.hintNumber + 1}".`
            : 'This is the last hint. Try implementing the solution now!'
        }`;

        return {
          response: hintResponse,
          isOffTopic: false,
          isHint: true,
          tokensUsed: 0
        };
      }
    }


    // Build messages array
    const systemPrompt = promptGenerator.generateSystemPrompt(problem);

    // Add difficulty guidance if it's the first message
    let enhancedUserMessage = userMessage;
    if (conversationHistory.length === 0 && !askingForSolution) {
      const difficultyGuidance = promptGenerator.getDifficultyGuidance(problem.difficulty);
      enhancedUserMessage = `${userMessage}\n\n[Context: ${difficultyGuidance}]`;
    }

    // ✅ FIX: Sanitize conversation history to remove timestamp and other non-Groq fields
    const sanitizedHistory = conversationHistory
      .slice(-10) // Keep last 10 messages for context (limit token usage)
      .map(msg => ({
        role: msg.role,
        content: msg.content
        // Only include 'role' and 'content' - strip timestamp, _id, createdAt, etc.
      }));

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...sanitizedHistory, // ✅ Use sanitized history instead of raw conversationHistory
      {
        role: 'user',
        content: enhancedUserMessage
      }
    ];


    // Call Groq API, falling back to Gemini if Groq is unavailable
    let completion: any;
    try {
      completion = await groqClient.createChatCompletion(messages);
    } catch (error) {
      // Fall back to Gemini for anything that isn't a client-input problem
      // (auth failure, rate limit, or upstream/unknown Groq errors).
      if (error instanceof AppError && error.statusCode !== 400) {
        completion = await geminiClient.createChatCompletion(messages);
      } else {
        throw error;
      }
    }


    const aiResponse = completion.choices[0].message.content;


    // Post-process response
    const finalResponse = this.postProcessResponse(aiResponse, problem);


    return {
      response: finalResponse,
      isOffTopic: false,
      tokensUsed: completion.usage.total_tokens,
      model: completion.model,
      problemDifficulty: problem.difficulty,
      availableHints: problem.hints?.length || 0
    };
  }


  postProcessResponse(response: string, problem: any): string {
    // Check if AI is going truly off-topic despite system prompt
    // (Note: identity statements like "I'm TrueCode's AI assistant" and platform
    // discussion mentioning "other problems" are now allowed by the system prompt,
    // so we only guard against genuinely unrelated content here.)
    const offTopicIndicators = [
      'As an AI language model',
      'tell you a joke',
      'recommend a movie'
    ];


    const isOffTopic = offTopicIndicators.some(indicator =>
      response.toLowerCase().includes(indicator.toLowerCase())
    );


    if (isOffTopic) {
      return `I can only discuss the problem: "${problem.title}" or general TrueCode platform questions. How can I help?`;
    }


    return response;
  }


  async saveChatHistory(userId: string, problemId: string, messages: any[], isPremium = false): Promise<void> {
    try {
      const limit = isPremium ? 40 : 20;
      await ChatHistory.findOneAndUpdate(
        { userId, problemId },
        {
          $set: {
            messages: messages.slice(-limit) // Keep last N messages only (premium gets a longer window)
          }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      // Don't throw - chat should work even if history save fails
    }
  }
}


const chatService = new ChatService();
export default chatService;
