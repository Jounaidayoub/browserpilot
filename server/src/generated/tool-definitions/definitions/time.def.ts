// Time tool definitions - NO browser dependencies
import type { ToolDefinition } from "../types";
import { emptyInput } from "../types";

export const getCurrentTimeDef: ToolDefinition<typeof emptyInput> = {
    name: "get_current_time",
    description: "Get the current date and time in ISO 8601 format. Useful for time-based history queries.",
    inputSchema: emptyInput,
};
