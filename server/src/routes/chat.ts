import { Hono } from "hono";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { defaultProvider, getOpenRouterProvider } from "../config/providers.ts";
import { env } from "../config/env.ts";
import { systemPrompt, type BrowserContext } from "../lib/prompts.ts";
import { tools } from "../tools/definitions.ts";
import { AppContext } from "../app.ts";
import { getUserProviderKey, type ProviderId } from "../lib/integrations.ts";

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

  let modelProvider = defaultProvider(model);
  if (providerId === "openrouter") {
    const user = c.get("user");
    const keyRow = getUserProviderKey(user.id, "openrouter");
    if (!keyRow) {
      return c.json({ error: "OpenRouter not connected" }, 400);
    }

    const provider = getOpenRouterProvider(keyRow.apiKey);
    modelProvider = provider(model);
  }

  const result = streamText({
    model: modelProvider,
    system: systemPrompt(currentcontext),
    messages: convertToModelMessages(messages),
    tools,
    onFinish: ({ usage }) => {
      console.log("[Chat] Token usage:", usage);
    },
  });

  return result.toUIMessageStreamResponse({ sendReasoning: true });
});

export { chatRoutes };
