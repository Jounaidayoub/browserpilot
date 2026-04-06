import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { env } from "./config/env.ts";
import { loadConfig, hasAnyProviderConfigured } from "./config/userConfig.ts";
import { initMCP } from "./lib/mcp-client.ts";

export async function startServer(): Promise<void> {
    const config = loadConfig();
    const port = env.PORT ?? config.port;

    if (!hasAnyProviderConfigured()) {
        console.log("\n⚠️  No AI provider keys configured.");
        console.log("   Run `npx browser-assistant setup` to add your API keys.\n");
    }

    const app = createApp();

    initMCP()
        .then(() => console.log("MCP initialized"))
        .catch((err) => console.error("Failed to initialize MCP:", err));

    console.log(`🚀 Server starting on port ${port}`);
    serve({ fetch: app.fetch, port });
}
