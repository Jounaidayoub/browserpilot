import { z } from "zod";

export interface Tool<ToolInput extends z.ZodType | null> {
  name: string;
  description: string;
  inputSchema: ToolInput;
  execute: (input: z.infer<ToolInput>) => Promise<string>;
  //for now the output schema is always string, since tools return stringified json
  //need a better handelling later
}

export const emptyInput = z.object({});
