import Groq from "groq-sdk";
import groqConfig from "../config/groq.config.js";
import {
  AppError,
  BadRequestError,
  TooManyRequestsError,
} from "../../../contracts/apiResponse.js";

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

class GroqClient {
  private client: Groq | null = null;

  getClient(): Groq {
    if (!this.client) {
      if (!groqConfig.apiKey?.trim()) {
        throw new Error('Groq API key is not configured');
      }

      this.client = new Groq({
        apiKey: groqConfig.apiKey,
        timeout: groqConfig.timeout,
        maxRetries: groqConfig.maxRetries,
      });
    }

    return this.client;
  }

  async createChatCompletion(messages: any[], options: ChatCompletionOptions = {}) {
    try {
      const client = this.getClient();
      const completion = await client.chat.completions.create({
        messages,
        model: options.model || groqConfig.model,
        temperature: options.temperature || groqConfig.temperature,
        max_tokens: options.maxTokens || groqConfig.maxTokens,
        top_p: options.topP || groqConfig.topP,
        stream: options.stream || false,
      } as any);

      return completion;
    } catch (error) {
      this.handleGroqError(error);
    }
  }

  handleGroqError(error: unknown): never {
    if (error instanceof Groq.APIError) {
      switch (error.status) {
        case 400:
          throw new BadRequestError("Invalid request to AI service");
        case 401:
          // A 401 from Groq means OUR API key is bad — that's a server
          // misconfiguration, not something the calling user can fix, so
          // surface it as 503 rather than implying the user needs to log in.
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
    throw error;
  }
}

const groqClient = new GroqClient();
export default groqClient;
