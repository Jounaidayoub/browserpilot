import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { env } from "./config/env";
import { initMCP } from "./lib/mcp-client.ts";
import { debugError, debugLog, isDebugEnabled } from "./lib/logger.ts";

type ServerOptions = {
  debug?: boolean;
};

export async function startServer(options?: ServerOptions): Promise<void> {
  const debug = options?.debug ?? isDebugEnabled();
  if (debug) {
    process.env.BROWSERPILOT_DEBUG = "true";
  }
  const app = createApp({ debug });

  initMCP()
    .then(() => {
      debugLog("[debug] MCP initialized");
    })
    .catch((err) => {
      debugError("[debug] Failed to initialize MCP:", err);
    });

  console.log(`BrowserPilot server is running at http://localhost:${env.PORT}`);
  if (debug) {
    debugLog("[debug] Request logging enabled");
  }

  serve({ fetch: app.fetch, port: env.PORT });
}
