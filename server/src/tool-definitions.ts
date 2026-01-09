import { z } from "zod";
import type { ToolSet } from "ai";
import { registeredTools } from "browser-assistant-extension/tools";

/**
 * Maps extension tools to AI SDK ToolSet format.
 * Extension tools have: { name, description, inputSchema, execute }
 * AI SDK expects: { name, description, inputSchema, outputSchema }
 */
export const tools: ToolSet = Object.fromEntries(
  registeredTools.map((tool) => [
    tool.name,
    {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema ?? z.object({}),
      // All extension tools return stringified JSON
      outputSchema: z.string(),
    },
  ])
);
