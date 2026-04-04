// This is the tool executor file responsible for evaluating tool calls from the LLM.
// It gets the right tool from a map of tools.
// It parses the input, executes the tool, and sends back the result to the LLM.
import { ZodError } from "zod";
import { ToolStore } from "@/tools";
import { formatZodIssues, type AddToolResultFn } from "@/tools/utils";

type EvaluatableToolCall = {
  toolName: string;
  toolCallId: string;
  input: unknown;
};

export const evaluateToolCall = async (
  toolCall: EvaluatableToolCall,
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
