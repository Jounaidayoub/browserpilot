import { Hono } from "hono";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { defaultProvider } from "../config/providers.ts";
import { systemPrompt, type BrowserContext } from "../lib/prompts.ts";
import { tools } from "../tools/definitions.ts";
import { AppContext } from "../app.ts";

/**
 * Chat request body schema
 */
interface ChatRequestBody {
    messages: UIMessage[];
    model: string;
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
    const { messages, model, currentcontext } = body;

    console.log("[Chat] Received request for model:", model);
    console.log("[Chat] Messages count:", messages.length);
    console.log("[Chat] Context:", JSON.stringify(currentcontext, null, 2));

    const result = streamText({
        model: defaultProvider(model),
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
