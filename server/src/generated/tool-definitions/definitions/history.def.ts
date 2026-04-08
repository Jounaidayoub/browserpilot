// History tool definitions - NO browser dependencies
import { z } from "zod";
import type { ToolDefinition } from "../types";

export const searchHistorySchema = z.object({
    query: z.string().optional(),
    maxResults: z.number().int().positive().optional(),
    startTime: z.union([z.string(), z.number(), z.iso.datetime()]).optional(),
    endTime: z.union([z.string(), z.number(), z.iso.datetime()]).optional(),
});

export const searchHistoryDef: ToolDefinition<typeof searchHistorySchema> = {
    name: "search_history",
    description: "Search browser history by keyword. Optionally filter by time range (startTime/endTime as ISO strings or timestamps) and limit results with maxResults.",
    inputSchema: searchHistorySchema,
};
