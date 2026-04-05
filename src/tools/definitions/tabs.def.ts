// Tabs tool definitions - NO browser dependencies
import { z } from "zod";
import type { ToolDefinition } from "../types";
import { emptyInput } from "../types";

export const closeTabsSchema = z.object({
    tabIds: z.array(z.number()),
});

export const groupTabsByIdsSchema = z.object({
    groups: z.array(
        z.object({
            tabIds: z.array(z.number()),
            color: z
                .enum(["blue", "cyan", "green", "grey", "orange", "pink", "purple", "red", "yellow"])
                .optional(),
            title: z.string(),
        })
    ),
});

export const openNewTabSchema = z.object({
    url: z.string().min(1, "URL is required"),
    // withContent: z.boolean().optional(),
});

export const getGroupsDef: ToolDefinition<typeof emptyInput> = {
    name: "get_groups",
    description: "Retrieve all tab groups. Returns each group's ID, title, color, collapsed state, and window ID.",
    inputSchema: emptyInput,
};

export const getTabsDef: ToolDefinition<typeof emptyInput> = {
    name: "get_tabs",
    description: "List all open tabs with metadata: ID, title, URL, group ID, index, window ID, and active status.",
    inputSchema: emptyInput,
};

export const closeTabsDef: ToolDefinition<typeof closeTabsSchema> = {
    name: "close_tabs",
    description: "Close one or more tabs by their IDs.",
    inputSchema: closeTabsSchema,
};

export const groupTabsByIdsDef: ToolDefinition<typeof groupTabsByIdsSchema> = {
    name: "group_tabs_by_ids",
    description: "Organize tabs into named groups. Provide tab IDs, a short descriptive title, and optional color for each group. Use this to categorize tabs by topic or project. \n Note: given the limited window space, keep group titles concise and short use abbreviations where possible., also don't create too many groups to not overwhelm the tab bar.",
    inputSchema: groupTabsByIdsSchema,
};

export const openNewTabDef: ToolDefinition<typeof openNewTabSchema> = {
    name: "open_new_tab",
    description: "Open a new tab with the specified URL.",
    inputSchema: openNewTabSchema,
};
