// Time tool definitions - NO browser dependencies
import { z } from "zod";
import type { ToolDefinition } from "../types";
import { emptyInput } from "../types";

export const getCurrentTimeDef: ToolDefinition<typeof emptyInput> = {
    name: "get_current_time",
    description: "Get the current time in ISO 8601 format.",
    inputSchema: emptyInput,
};
