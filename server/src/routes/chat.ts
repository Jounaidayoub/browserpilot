import { Hono } from "hono";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getAIModel, getOpenRouterProvider } from "../config/providers.ts";
import { systemPrompt, type BrowserContext } from "../lib/prompts.ts";
import { tools } from "../tools/definitions.ts";
import { getProviderKey } from "../lib/integrations.ts";
import { getMCPTools } from "../lib/mcp-client.ts";

/**
 * Chat request body schema
 */
interface ChatRequestBody {
  messages: UIMessage[];
  model: string;
  providerId?: string;
  options?: Record<string, unknown>;
  currentcontext?: BrowserContext;
}

const chatRoutes = new Hono();

/**
 * POST / - Main chat endpoint
 * Handles streaming chat completions serving the useChat hook
 */
chatRoutes.post("/", async (c) => {
  const body = await c.req.json<ChatRequestBody>();
  const { messages, model, currentcontext, providerId = "default" } = body;

  console.log("[Chat] Received request for model:", model);
  console.log("[Chat] Provider:", providerId);
  console.log("[Chat] Messages count:", messages.length);

  let modelInstance;
  try {
    modelInstance = getAIModel(providerId, model);
  } catch (err: unknown) {
    if (providerId === "openrouter") {
      // fallback to stored key if not yet loaded in config cache
      const keyRow = getProviderKey("openrouter");
      if (!keyRow) {
        return c.json({ error: "OpenRouter not connected and no key present" }, 400);
      }
      modelInstance = getOpenRouterProvider(keyRow.apiKey)(model);
    } else {
      const message = err instanceof Error ? err.message : "Unknown error";
      return c.json({ error: message }, 400);
    }
  }

  const mcpTools = await getMCPTools();
  const result = streamText({
    model: modelInstance,
    system: systemPrompt(currentcontext),
    messages: await convertToModelMessages(messages),
    tools: { ...mcpTools, ...tools },
    onFinish: ({ usage }) => {
      console.log("[Chat] Token usage:", usage);
    },
  });
  return result.toUIMessageStreamResponse({ sendReasoning: true });
});

export { chatRoutes };
