import "dotenv/config";

/**
 * Environment variables configuration with validation
 */

function getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const env = {
    // Server
    PORT: parseInt(process.env.PORT || "8080", 10),

    // AI Provider Keys (Optional to start, will fail if used without being set)
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,

    // Base generic Endpoint override
    AI_BASE_URL: process.env.AI_BASE_URL || "http://localhost:4141/v1",

    // Auth
    BETTER_AUTH_SECRET: getRequiredEnv("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:8080",

    // Database
    DB_FILE_NAME: getRequiredEnv("DB_FILE_NAME"),
} as const;
