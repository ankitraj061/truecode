import groqClient from '../utils/groqClient.js';
import geminiClient from '../utils/geminiClient.js';
import { promptGenerator } from '../utils/promtGenerator.js';
import Problem from '../models/problem.js';
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
    // Check if AI is going off-topic despite system prompt
    const offTopicIndicators = [
      'I am an AI assistant',
      'I can help you with many things',
      'As an AI language model',
      'I was created by',
      'I was trained by',
      'tell you a joke',
      'recommend a movie',
      'nice to meet you',
      'my name is',
      'I don\'t have a name'
    ];


    const isOffTopic = offTopicIndicators.some(indicator =>
      response.toLowerCase().includes(indicator.toLowerCase())
    );


    if (isOffTopic) {
      return `I can only discuss the problem: "${problem.title}". How can I help you solve it?`;
    }


    // Check if response is discussing other problems
    if (response.toLowerCase().includes('other problem') ||
        response.toLowerCase().includes('different problem') ||
        response.toLowerCase().includes('another problem')) {
      return `I'm focused solely on helping you with "${problem.title}". What specific aspect of this problem would you like to discuss?`;
    }


    return response;
  }


  async saveChatHistory(userId: string, problemId: string, messages: any[]): Promise<void> {
    // NOTE: src/models/ChatHistory.js does not exist — this was already
    // broken/dead code before the TS migration. Left as-is (pre-existing
    // behavior: the catch below silently swallows the failure) since
    // fixing it is out of scope for this migration.
    try {
      // @ts-expect-error - ChatHistory model does not exist (pre-existing issue)
      const { default: ChatHistory } = await import('../models/ChatHistory.js');

      await ChatHistory.findOneAndUpdate(
        { userId, problemId },
        {
          $set: {
            messages: messages.slice(-20), // Keep last 20 messages only
            updatedAt: new Date()
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
