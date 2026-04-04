/**
 * Model configuration for the chat agent.
 *
 * Centralizes all available model definitions and provides
 * a helper to resolve the full list based on provider connectivity.
 */

export interface ModelOption {
  /** Display name shown in the UI */
  name: string;
  /** Model identifier sent to the server */
  value: string;
  /** Which provider serves this model */
  provider: "default" | "openrouter";
}

// ─── Built-in models (always available) ──────────────────────────

export const DEFAULT_MODELS: ModelOption[] = [
  { name: "GPT-4.1", value: "gpt-4.1-2025-04-14", provider: "default" },
  { name: "Grok Code Fast 1", value: "grok-code-fast-1", provider: "default" },
  { name: "GPT-4o", value: "gpt-4o-2024-11-20", provider: "default" },
  { name: "GPT-5 mini", value: "gpt-5-mini", provider: "default" },
];

// ─── OpenRouter models (available when connected) ────────────────

export const OPENROUTER_MODELS: ModelOption[] = [
  {
    name: "NemoTron 3 Nano 30B A3B (free)",
    value: "nvidia/nemotron-3-nano-30b-a3b:free",
    provider: "openrouter",
  },
  {
    name: "OpenAI: gpt-oss-120b (free)",
    value: "openai/gpt-oss-120b:free",
    provider: "openrouter",
  },
  {
    name: "DeepSeek R1T2 Chimera (free)",
    value: "tngtech/deepseek-r1t2-chimera:free",
    provider: "openrouter",
  },
  {
    name: "Claude 3.5 Sonnet",
    value: "anthropic/claude-3.5-sonnet",
    provider: "openrouter",
  },
  {
    name: "DeepSeek R1",
    value: "deepseek/deepseek-r1",
    provider: "openrouter",
  },
  {
    name: "Llama 3 70B",
    value: "meta-llama/llama-3-70b-instruct",
    provider: "openrouter",
  },
  {
    name: "GLM 4.5 Air (free)",
    value: "z-ai/glm-4.5-air:free",
    provider: "openrouter",
  },
];

export const DEFAULT_MODEL_VALUE = "gpt-4o-2024-11-20";

/**
 * Returns the full list of models available to the user.
 * When OpenRouter is connected, its models are appended.
 */
export function getAvailableModels(
  isOpenRouterConnected: boolean,
): ModelOption[] {
  return isOpenRouterConnected
    ? [...DEFAULT_MODELS, ...OPENROUTER_MODELS]
    : DEFAULT_MODELS;
}

/**
 * Resolves the provider id for a given model value.
 * Falls back to "default" if the model is not found.
 */
export function resolveProvider(
  modelValue: string,
  models: ModelOption[],
): "default" | "openrouter" {
  return models.find((m) => m.value === modelValue)?.provider ?? "default";
}
