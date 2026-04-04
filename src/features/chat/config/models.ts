export type ProviderId = "openai" | "anthropic" | "google" | "openrouter" | "github-copilot" | "generic";

export interface ModelOption {
  /** Display name shown in the UI */
  name: string;
  /** Model identifier sent to the server */
  value: string;
  /** Which provider serves this model */
  provider: ProviderId;
}

export const MODELS_API_URL = "https://models.dev/api.json";

export const SUPPORTED_PROVIDERS: ProviderId[] = [
  "openai",
  "anthropic",
  "google",
  "github-copilot",
  "openrouter",
];


export const DEFAULT_MODELS: ModelOption[] = [
  // OpenAI
  { name: "GPT-4o", value: "gpt-4o-2024-11-20", provider: "openai" },
  { name: "GPT-5 Mini", value: "gpt-5-mini", provider: "openai" },

  // Anthropic
  { name: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-latest", provider: "anthropic" },
  { name: "Claude 3.5 Haiku", value: "claude-3-5-haiku-latest", provider: "anthropic" },

  // Google
  { name: "Gemini 1.5 Pro", value: "gemini-1.5-pro", provider: "google" },
  { name: "Gemini 1.5 Flash", value: "gemini-1.5-flash", provider: "google" },

  // Generic / Custom Endpoints
  { name: "gpt-4.1", value: "gpt-4.1", provider: "generic" },
];


export const OPENROUTER_MODELS: ModelOption[] = [
  { name: "DeepSeek R1", value: "deepseek/deepseek-r1", provider: "openrouter" },
  { name: "Llama 3 70B", value: "meta-llama/llama-3-70b-instruct", provider: "openrouter" },
];

export const DEFAULT_MODEL_VALUE = "gpt-4o-2024-11-20";


export function getAvailableModels(
  isOpenRouterConnected: boolean,
): ModelOption[] {
  return isOpenRouterConnected
    ? [...DEFAULT_MODELS, ...OPENROUTER_MODELS]
    : DEFAULT_MODELS;
}

/**
 * Resolves the provider id for a given model value.
 * Falls back to "generic" if the model is not found.
 */
export function resolveProvider(
  modelValue: string,
  models: ModelOption[],
): ProviderId {
  return models.find((m) => m.value === modelValue)?.provider ?? "generic";
}
