// Scripting tool definitions - NO browser dependencies
import { z } from "zod";
import type { ToolDefinition } from "../types";

export const runScriptSchema = z.object({
    code: z.string().min(1, "Code is required"),
    tabId: z.number().optional(),
});

export const runScriptDef: ToolDefinition<typeof runScriptSchema> = {
    name: "run_script",
    description: "Executes a string of JavaScript code in the context of a specific tab. If no tabId is provided, it runs on the active tab.",
    inputSchema: runScriptSchema,
};
