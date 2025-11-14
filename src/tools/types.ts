import { z } from "zod";

export interface Tool<ToolInput extends z.ZodType | null> {
  name: string;
  description: string;
  execute: (input: z.infer<ToolInput>) => Promise<string>;
}
