import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { serve } from "@hono/node-server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { tools } from "./tool-definitions.js";
import { env } from "process";
import { auth } from "./lib/auth.js";



console.log(env.BETTER_AUTH_SECRET)

const app = new Hono();
app.use("*", cors());

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
  
});
const openai = createOpenAI({
  apiKey: process.env.GOOGLE_API_KEY,
  baseURL: "http://localhost:4141/v1/",
  name: "copilot-openai-provider",
});

const provider = createOpenAICompatible({
  apiKey: process.env.GOOGLE_API_KEY,
  baseURL: "http://localhost:4141/v1",
  name: "copilot-openai-provider",
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const {
    messages,
    options,
    model,
    currentcontext,
  }: {
    messages: UIMessage[];
    options: {};
    model: string;
    currentcontext?: { activetabContent?: string; opentabs?: unknown[] };
  } = body;
  console.log("got body", body);
  console.log(`${JSON.stringify(currentcontext, null, 2)}`);
  console.log("size of messages", messages.length);
  console.log("messages :", JSON.stringify(messages, null, 2));
  const result = streamText({
    // model: google("gemini-2.5-flash-lite"),
    model: provider(model),
    // model: provider(model),
    
    system: `
      You are a browser-based assistant designed for tab management and browsing assistance.
      Your primary goals are to help users organize tabs, manage tab groups, and extract/summarize page content.

      Capabilities:
      - Tab Management: List, open, and close tabs.
      - Tab Groups: View, create, and organize tabs into groups.
      - Content Extraction: Read and summarize the content of any open tab.
      - History: Search through browser history.

      Guidelines:
      1. Be concise and professional.
      2. Use tools proactively to gather information before asking the user.
      3. Format responses in clean Markdown with appropriate headings and lists.
      4. Use tables for structured data like tab lists or history results.

      <currentcontext>
      Current state of the browser:
      ${
        typeof currentcontext?.opentabs !== "undefined" &&
        typeof currentcontext?.activetabContent !== "undefined"
          ? `Open Tabs:
        ${JSON.stringify(currentcontext.opentabs, null, 2)}

      Active Tab Content:
      ${currentcontext.activetabContent}`
          : JSON.stringify(currentcontext, null, 2)
      }
      </currentcontext>
    `,

    messages: convertToModelMessages(messages),
    // providerOptions: {
    //   google: {
    //     thinkingConfig: {
    //       thinkingBudget: 8192,

    //       includeThoughts: true,
    //     },
    //   },
    // },
    tools: tools,
    onFinish: ({ usage }) => {
      console.log("Tooken usage :", usage);
    },
  });
  // for await (const chunk of result.textStream) {
  //   console.log(chunk);
  // }
  return result.toUIMessageStreamResponse({ sendReasoning: true });
});


app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

serve({ fetch: app.fetch, port: 8080 });
