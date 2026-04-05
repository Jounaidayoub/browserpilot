import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { env } from "./config/env";
import { initMCP } from "./lib/mcp-client.ts";



const app = createApp();
initMCP()
  .then(() => console.log("MCP initialized"))
  .catch((err) => console.error("Failed to initialize MCP:", err));
  
console.log(` Server starting on port ${env.PORT}`);

serve({ fetch: app.fetch, port: env.PORT });
