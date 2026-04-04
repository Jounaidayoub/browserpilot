import { Hono } from "hono";
import { convertToModelMessages, streamText, type UIMessage, wrapLanguageModel } from "ai";
import { getAIModel, getOpenRouterProvider } from "../config/providers.ts";
import { systemPrompt, type BrowserContext } from "../lib/prompts.ts";
import { tools } from "../tools/definitions.ts";
import { AppContext } from "../app.ts";
import { getUserProviderKey, type ProviderId } from "../lib/integrations.ts";
import { getMCPTools } from "../lib/mcp-client.ts";
import { devToolsMiddleware } from "@ai-sdk/devtools";

/**
 * Chat request body schema
 */
interface ChatRequestBody {
  messages: UIMessage[];
  model: string;
  providerId?: ProviderId;
  options?: Record<string, unknown>;
  webSearch?: boolean;
  currentcontext?: BrowserContext;
}

const chatRoutes = new Hono<AppContext>();

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
  //   console.log("[Chat] Context:", JSON.stringify(currentcontext, null, 2));

  let modelInstance;
  try {
    modelInstance = getAIModel(providerId, model);
  } catch (err: any) {
    if (providerId === "openrouter") {
      // fallback to user specific key if env is not provided
      const user = c.get("user");
      const keyRow = await getUserProviderKey(user.id, "openrouter");
      if (!keyRow) {
        return c.json({ error: "OpenRouter not connected and no ENV key present" }, 400);
      }
      modelInstance = getOpenRouterProvider(keyRow.apiKey)(model);
    } else {
      return c.json({ error: err.message }, 400);
    }
  }

  const mcpTools = await getMCPTools();
  const result = streamText({
    model: wrapLanguageModel({
      model: modelInstance,
      middleware: devToolsMiddleware(),
    }),
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
