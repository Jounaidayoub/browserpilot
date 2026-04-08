import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { env } from "./config/env";
import { initMCP } from "./lib/mcp-client.ts";
import { debugError, debugLog, isDebugEnabled } from "./lib/logger.ts";

export async function startServer(): Promise<void> {
  const app = createApp();

  initMCP()
    .then(() => {
      debugLog("[debug] MCP initialized");
    })
    .catch((err) => {
      debugError("[debug] Failed to initialize MCP:", err);
    });

  console.log(`BrowserPilot server is running at http://localhost:${env.PORT}`);
  if (isDebugEnabled()) {
    debugLog("[debug] Request logging enabled");
  }

  serve({ fetch: app.fetch, port: env.PORT });
}
