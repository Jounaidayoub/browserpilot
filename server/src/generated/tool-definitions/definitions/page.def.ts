// Page tool definitions - NO browser dependencies
import { z } from "zod";
import type { ToolDefinition } from "../types";

export const getTabContentSchema = z.object({
    tabId: z.number(),
});

export const getTabContentDef: ToolDefinition<typeof getTabContentSchema> = {
    name: "get_tab_content",
    description: "Extract readable content from a tab as semantic markdown. Returns the page title, URL, and main content. Use this to read or summarize a page's content.",
    inputSchema: getTabContentSchema,
};
