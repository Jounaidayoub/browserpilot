import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { env } from "./env.ts";
import { loadConfig } from "./userConfig.ts";

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
  const config = loadConfig();

  switch (providerId) {
    case "openai": {
      const apiKey = config.providers.openai?.apiKey;
      if (!apiKey) throw new Error("OpenAI API key is not configured. Run `npx browser-assistant setup` to add it.");
      return createOpenAI({ apiKey })(modelName);
    }

    case "anthropic": {
      const apiKey = config.providers.anthropic?.apiKey;
      if (!apiKey) throw new Error("Anthropic API key is not configured. Run `npx browser-assistant setup` to add it.");
      return createAnthropic({ apiKey })(modelName);
    }

    case "google": {
      const apiKey = config.providers.google?.apiKey;
      if (!apiKey) throw new Error("Google API key is not configured. Run `npx browser-assistant setup` to add it.");
      return createGoogleGenerativeAI({ apiKey })(modelName);
    }

    case "openrouter": {
      const apiKey = config.providers.openrouter?.apiKey;
      if (!apiKey) throw new Error("OpenRouter API key is not configured. Run `npx browser-assistant setup` or connect via the extension.");
      return getOpenRouterProvider(apiKey)(modelName);
    }

    case "github-copilot": {
      const apiKey = config.providers["github-copilot"]?.apiKey;
      const baseUrl = config.providers["github-copilot"]?.baseUrl ?? env.GITHUB_COPILOT_BASE_URL;
      if (!apiKey || !baseUrl) throw new Error("GitHub Copilot API key or base URL is not configured. Run `npx browser-assistant setup` to add it.");
      return createOpenAICompatible({
        baseURL: baseUrl,
        name: "github-copilot",
        apiKey,
      })(modelName);
    }

    case "generic":
    default:
      return defaultProvider(modelName);
  }
}
