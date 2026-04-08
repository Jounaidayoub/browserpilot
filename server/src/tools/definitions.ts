import { z } from "zod";
import type { ToolSet } from "ai";
import { toolDefinitions } from "../generated/tool-definitions/definitions/index";

/**
 * Maps extension tool definitions to AI SDK ToolSet format.
 * Extension tool definitions have: { name, description, inputSchema }
 * AI SDK expects: { name, description, inputSchema, outputSchema }
 */
export const tools: ToolSet = Object.fromEntries(
  toolDefinitions.map((tool) => [
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
