import { GoogleGenerativeAI } from "@google/generative-ai";
import geminiConfig from "../config/gemini.config.js";
import { AppError, BadRequestError, TooManyRequestsError } from "../contracts/apiResponse.js";

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

interface ChatMessage {
  role: string;
  content: string;
}

class GeminiClient {
  private client: GoogleGenerativeAI | null = null;

  getClient(): GoogleGenerativeAI {
    if (!this.client) {
      if (!geminiConfig.apiKey?.trim()) {
        throw new Error('Gemini API key is not configured');
      }
      this.client = new GoogleGenerativeAI(geminiConfig.apiKey);
    }
    return this.client;
  }

  async createChatCompletion(messages: ChatMessage[], options: ChatCompletionOptions = {}) {
    try {
      const client = this.getClient();
      const systemMessage = messages.find(m => m.role === 'system');
      const turnMessages = messages.filter(m => m.role !== 'system');
      const lastUserMessage = turnMessages[turnMessages.length - 1];
      const history = turnMessages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const model = client.getGenerativeModel({
        model: options.model || geminiConfig.model,
        systemInstruction: systemMessage?.content,
        generationConfig: {
          temperature: options.temperature ?? geminiConfig.temperature,
          maxOutputTokens: options.maxTokens || geminiConfig.maxTokens,
          topP: options.topP || geminiConfig.topP,
        },
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastUserMessage.content);
      const response = result.response;
      const text = response.text();
      const usage = response.usageMetadata;

      return {
        choices: [{ message: { content: text } }],
        usage: { total_tokens: usage?.totalTokenCount || 0 },
        model: options.model || geminiConfig.model,
      };
    } catch (error) {
      this.handleGeminiError(error);
    }
  }

  handleGeminiError(error: unknown): never {
    const status = (error as any)?.status;
    switch (status) {
      case 400:
        throw new BadRequestError("Invalid request to AI service");
      case 401:
      case 403:
        throw new AppError("AI service unavailable", 503, "AI_AUTH_FAILED");
      case 429:
        throw new TooManyRequestsError("Too many AI requests. Please try again later");
      case 500:
      case 502:
      case 503:
        throw new AppError("AI service temporarily unavailable", 503, "AI_UPSTREAM_ERROR");
      default:
        throw new AppError("Failed to process AI request", 503, "AI_UNKNOWN_ERROR");
    }
  }
}

const geminiClient = new GeminiClient();
export default geminiClient;
