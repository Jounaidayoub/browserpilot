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
    Withcontent: z.boolean().optional(),
});

export const getGroupsDef: ToolDefinition<typeof emptyInput> = {
    name: "get_groups",
    description: "Get all tab groups in the browser. Each group includes its id, title, color, collapsed status, and windowId.",
    inputSchema: emptyInput,
};

export const getTabsDef: ToolDefinition<typeof emptyInput> = {
    name: "get_tabs",
    description: "Get metadata for all currently open tabs in the browser, including id, title, url, group id, index, window id, and active status.",
    inputSchema: emptyInput,
};

export const closeTabsDef: ToolDefinition<typeof closeTabsSchema> = {
    name: "close_tabs",
    description: "Closes one or more tabs by their IDs. Example: { tabIds: [123, 456] }",
    inputSchema: closeTabsSchema,
};

export const groupTabsByIdsDef: ToolDefinition<typeof groupTabsByIdsSchema> = {
    name: "group_tabs_by_ids",
    description: "Group the given tabs by their ids into new groups. Each group should include tabIds, color, and title. Organizes tabs into topics based on URLs and titles. group titles should be relatively short and descriptive (due to the limited space browsers tab bar)",
    inputSchema: groupTabsByIdsSchema,
};

export const openNewTabDef: ToolDefinition<typeof openNewTabSchema> = {
    name: "open_new_tab",
    description: "Open a new tab with a given URL. The `Withcontent` option determines whether to include the page content. if the user query involves reading or summarizing the page content, set Withcontent to true.(this better that opening a tab and then getting the content separately , fallback to get tab content tool if this does not work) , NOTE : this may return a large amount of data , SET WITHCONTENT TO FALSE IF THE USER QUERY IS NOT RELATED TO THE PAGE CONTENT, or the task does not involve having an idae about the tab actual content.",
    inputSchema: openNewTabSchema,
};
