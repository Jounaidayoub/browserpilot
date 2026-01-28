import "dotenv/config";

/**
 * Environment variables configuration with validation
 */
export const env = {
    // Server
    PORT: parseInt(process.env.PORT || "8080", 10),

    // API Keys
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,

    // AI Provider
    AI_BASE_URL: process.env.AI_BASE_URL || "http://localhost:4141/v1",

    // Auth
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:8080",
} as const;
