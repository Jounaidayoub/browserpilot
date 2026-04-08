import { z } from "zod";

// Empty input helper - used by tools that take no parameters
export const emptyInput = z.object({});

// Definition only - no execute, no browser deps
// This is safe to import in server context
export interface ToolDefinition<TInput extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  inputSchema: TInput;
}
