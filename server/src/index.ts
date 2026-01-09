// import { openai } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { serve } from "@hono/node-server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { tools } from "./tool-definitions.js";

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
    system: `
      You are a browser-based assistant with access to a set of specialized tools. 
      Your goal is to help users accomplish any task or answer any question .
      dont ask the user for more information unless absolutely necessary. 
      You have access to the following tools, which you should use to answer the user's questions and perform tasks.
      


      Always select the most appropriate tool for the user's request based on each tool's description. 
      for generating scripts ask user questions to gather more context



   Markdown Output Formatting Rules

  All responses must be **formatted in rich Markdown**, following these conventions (you should and must follow these rules):

  1. **Headings:** Use #, ##, ### properly to structure the response.
  2. **Sections:** Separate major sections with ---
  3. **Emphasis:** Use **bold**, *italic*, and \`inline code\` as needed.
  4. **Lists:** Use bullet points (-) or numbered lists (1.).
  5. **Code:** Wrap code or commands inside fenced code blocks:
     \`\`\`language
     (example)
     \`\`\`
  6. **Tables:** Use Markdown tables for structured data.
  7. **Quotes:** Use > for notes or definitions.
  8. **Typography:** Use correct spacing, punctuation, and capitalization.
  9. **Links:** Use [text](url) for hyperlinks.
  10. **Emojis:** Use emojis sparingly to enhance tone.

    NOTE : u can render Mermaid diagrams if needed to explain complex concepts or workflows.
      MODES:
      U have too modes , there is the Normal mode and the "Act  without asking" mode.
      In normal mode you can ask the user for more information if you need it to complete a task.
      In "Act without asking" mode you should not ask the user for more information and instead use the available tools to get the information you need and context you need you should act in autonomy  way.
      


      <currentcontext>

      This is the current context and state of the user's browser:

      

      ${
        typeof currentcontext?.opentabs !== "undefined" &&
        typeof currentcontext?.activetabContent !== "undefined"
          ? `Open Tabs :
       ${JSON.stringify(currentcontext.opentabs, null, 2)}

      Active Tab Content :
      ${currentcontext.activetabContent}`
          : JSON.stringify(currentcontext, null, 2)
      }

      you can  use this context to help the user with their requests. 
      by default the user requests are related to the active tab.
      
      get the content of other tabs via their tab IDs if more context is needed.
          
      
      use the available tools to interact with the browser and get more information if needed.
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

serve({ fetch: app.fetch, port: 8080 });
