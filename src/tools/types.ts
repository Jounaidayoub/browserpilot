import { z } from "zod";
import type { IServices } from "@/services";

export interface Tool<ToolInput extends z.ZodType | null> {
  name: string;
  description: string;
  inputSchema: ToolInput;
  execute: (input: z.infer<ToolInput>, services?: IServices) => Promise<string>;
  //for now the output schema is always string, since tools return stringified json
  //need a better handelling later
}

// Re-export emptyInput from definitions for backwards compatibility
export { emptyInput } from "./definitions";
