import { createMCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";
import { debugLog } from "./logger.ts";

const isWindows = process.platform === "win32";
if (isWindows) {
  debugLog("[MCP] Windows detected");
}
const MCP_SERVER_CONFIG = isWindows ?
  {
    command: "cmd",
    args: ["/c", "npx", "-y", "chrome-devtools-mcp@latest", "--auto-connect", "--no-usage-statistics", "--no-performance-crux"] as string[],
  }
  :
  {
    command: "npx",
    args: ["-y", "chrome-devtools-mcp@latest", "--auto-connect", "--no-usage-statistics", "--no-performance-crux"] as string[],
  };

let cachedClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;
export async function initMCP() {
  if (!cachedClient) {
    debugLog("[MCP] Initializing client...");
    const transport = new Experimental_StdioMCPTransport(MCP_SERVER_CONFIG);
    cachedClient = await createMCPClient({ transport });
    debugLog("[MCP] Client initialized");
  }
};
const ALLOWED_TOOLS = [
  "navigate_page",
  "new_page",
  "close_page",
  "select_page",
  "list_pages",
  "click",
  "fill",
  "type_text",
  "hover",
  "press_key",
  "drag",
  "fill_form",
  "upload_file",
  "evaluate_script",
  "wait_for",
  "handle_dialog",
  "take_snapshot",
];

export async function getMCPTools() {
  if (!cachedClient) {
    debugLog("[MCP] Creating new client...");
    const transport = new Experimental_StdioMCPTransport(MCP_SERVER_CONFIG);
    cachedClient = await createMCPClient({ transport });
    debugLog("[MCP] Client created");
  }

  const allTools = await cachedClient.tools();
  const filteredTools: Record<string, any> = {};
  for (const toolName of ALLOWED_TOOLS) {
    if (allTools[toolName]) {
      filteredTools[toolName] = allTools[toolName];
    }
  }
  // console.log("[MCP] Available filtered tools:", Object.keys(filteredTools));
  return filteredTools;
}

export async function closeMCPClient(): Promise<void> {
  if (cachedClient) {
    debugLog("[MCP] Closing client...");
    await cachedClient.close();
    cachedClient = null;
  }
}
