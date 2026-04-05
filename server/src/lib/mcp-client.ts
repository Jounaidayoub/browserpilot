import { createMCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";

const MCP_SERVER_CONFIG = {
  command: "npx",
  args: ["-y", "chrome-devtools-mcp@latest", "--auto-connect", "--no-usage-statistics", "--no-performance-crux"] as string[],
};

let cachedClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;
export async function initMCP() {
  if (!cachedClient) {
    console.log("[MCP] Initializing client...");
    const transport = new Experimental_StdioMCPTransport(MCP_SERVER_CONFIG);
    cachedClient = await createMCPClient({ transport });
    console.log("[MCP] Client initialized");
  }
};
export async function getMCPTools() {
  if (!cachedClient) {
    console.log("[MCP] Creating new client...");
    const transport = new Experimental_StdioMCPTransport(MCP_SERVER_CONFIG);
    cachedClient = await createMCPClient({ transport });
    console.log("[MCP] Client created");
  }

  return cachedClient.tools();
}

export async function closeMCPClient(): Promise<void> {
  if (cachedClient) {
    console.log("[MCP] Closing client...");
    await cachedClient.close();
    cachedClient = null;
  }
}
