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

    // API Keys
    // GOOGLE_API_KEY: getRequiredEnv("GOOGLE_API_KEY"),

    // AI Provider
    AI_BASE_URL: process.env.AI_BASE_URL || "http://localhost:4141/v1",

    // Auth
    BETTER_AUTH_SECRET: getRequiredEnv("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:8080",

    // Database
    DB_FILE_NAME: getRequiredEnv("DB_FILE_NAME"),
} as const;
