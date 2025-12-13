//This the tool executer , this is the file the responsivle for evaluating the tool calls comming from the llm
//it gets the right tool from a Map of tools
//it parse the input and excutee the tool and send back the result to the llm 
import type { UIMessage, InferUIMessageToolCall } from "ai";
import { ZodError } from "zod";
import { ToolStore } from "@/tools";
import { formatZodIssues, type AddToolResultFn } from "@/tools/utils";

export const evaluateToolCall = async (
  toolCall: InferUIMessageToolCall<UIMessage>,
  addToolResult: AddToolResultFn
) => {

  const tool = ToolStore.get(toolCall.toolName);

  if (!tool) {
    console.warn("Unknown tool:", toolCall.toolName);
    return;
  }

  try {
    const parsed = tool.inputSchema?.safeParse(toolCall.input);
    if (parsed && !parsed.success) {
      throw parsed.error;
    }
    const output = await tool.execute(parsed?.data);

    await addToolResult({
      tool: tool.name,
      toolCallId: toolCall.toolCallId,
      output,
    });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? formatZodIssues(error)
        : error instanceof Error
        ? error.message
        : String(error);

    console.error(`Tool ${tool.name} failed:`, error);

    await addToolResult({
      state: "output-error",
      tool: tool.name,
      toolCallId: toolCall.toolCallId,
      errorText: message,
    });
  }
};
