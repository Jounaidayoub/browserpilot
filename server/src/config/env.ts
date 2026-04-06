/**
 * Environment variables configuration
 *
 * AI provider keys are now stored in ~/.config/browser-assistant/config.json
 * via userConfig.ts. Only infrastructure overrides remain here.
 */

export const env = {
    // Server port — config.json value is used by default; PORT env var overrides it
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,

    // Server URL for OAuth callbacks
    SERVER_URL: process.env.SERVER_URL || "http://localhost:8080",

    // Optional base URL overrides
    AI_BASE_URL: process.env.AI_BASE_URL || "http://localhost:4141/v1",
    GITHUB_COPILOT_BASE_URL: process.env.GITHUB_COPILOT_BASE_URL,
} as const;
