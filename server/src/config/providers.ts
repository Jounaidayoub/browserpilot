import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { env } from "./env";

/**
 * Default compatible provider for chat completions
 */
export const defaultProvider = createOpenAICompatible({
  baseURL: env.AI_BASE_URL,
  name: "copilot-openai-provider",
});

export const getOpenRouterProvider = (api: string) =>
  createOpenAICompatible({
    baseURL: "https://openrouter.ai/api/v1",
    name: "openrouter",
    apiKey: api,
  });
