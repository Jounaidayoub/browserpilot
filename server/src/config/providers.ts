import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { env } from "./env";
import { LanguageModel } from "ai";

/**
 * Default generic compatible provider
 */
export const defaultProvider = createOpenAICompatible({
  baseURL: env.AI_BASE_URL,
  name: "generic",
});

export const getOpenRouterProvider = (api: string | undefined) =>
  createOpenAICompatible({
    baseURL: "https://openrouter.ai/api/v1",
    name: "openrouter",
    apiKey: api,
  });

/**
 * Factory to get a configured AI SDK Model based on the provider ID
 */
export function getAIModel(providerId: string, modelName: string) {
  switch (providerId) {
    case "openai":
      if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured on the server.");
      return createOpenAI({ apiKey: env.OPENAI_API_KEY })(modelName);

    case "anthropic":
      if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
      return createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(modelName);

    case "google":
      if (!env.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is not configured on the server.");
      return createGoogleGenerativeAI({ apiKey: env.GOOGLE_API_KEY })(modelName);

    case "openrouter": {
      // Typically the UI will send OpenRouter requests dynamically or user keys
      // It falls back to env variable if present
      if (!env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured.");
      return getOpenRouterProvider(env.OPENROUTER_API_KEY)(modelName);
    }

    case "generic":
    default:
      return defaultProvider(modelName);
  }
}

