import { readConfig } from "./file-config";

const persistedConfig = readConfig();

const configuredPort = Number.parseInt(process.env.PORT ?? `${persistedConfig.server.port}`, 10);
const port = Number.isFinite(configuredPort) ? configuredPort : 8080;

const serverUrl = process.env.SERVER_URL ?? persistedConfig.server.url ?? `http://localhost:${port}`;

export const env = {
  PORT: port,
  SERVER_URL: serverUrl,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? persistedConfig.providers.openai.apiKey,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? persistedConfig.providers.anthropic.apiKey,
  GOOGLE_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? persistedConfig.providers.google.apiKey,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? persistedConfig.providers.openrouter.apiKey,
  GITHUB_COPILOT_API_KEY: process.env.GITHUB_COPILOT_API_KEY ?? persistedConfig.providers.githubCopilot.apiKey,
  GITHUB_COPILOT_BASE_URL: process.env.GITHUB_COPILOT_BASE_URL ?? persistedConfig.providers.githubCopilot.baseUrl,
  AI_BASE_URL: process.env.AI_BASE_URL ?? persistedConfig.providers.generic.baseUrl ?? "http://localhost:4141/v1",
} as const;
