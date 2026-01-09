/**
 * Tool definitions shared between extension and server.
 * This file contains ONLY the schema definitions (no execute functions, no browser dependencies).
 * The extension uses these definitions to create full tools with execute functions.
 * The server uses these definitions to map to AI SDK ToolSet format.
 */
import { z } from "zod";

// ============ Tool Schema Definitions ============

export const emptyInput = z.object({});

export const close_tabsSchema = z.object({
  tabIds: z.array(z.number()),
});

export const group_tabs_by_idsSchema = z.object({
  groups: z.array(
    z.object({
      tabIds: z.array(z.number()),
      color: z
        .enum([
          "blue",
          "cyan",
          "green",
          "grey",
          "orange",
          "pink",
          "purple",
          "red",
          "yellow",
        ])
        .optional(),
      title: z.string(),
    })
  ),
});

export const open_new_tabSchema = z.object({
  url: z.string().min(1, "URL is required"),
  Withcontent: z.boolean().optional(),
});

export const get_tab_contentSchema = z.object({
  tabId: z.number(),
});

export const get_page_contentSchema = z.object({
  tabId: z.number(),
});

export const get_page_dom_snapshotSchema = z.object({
  tabId: z.number(),
  options: z.record(z.string(), z.unknown()).optional(),
});

export const run_scriptSchema = z.object({
  code: z.string().min(1, "Code is required"),
  tabId: z.number().optional(),
});

// ============ Tool Definition Interface ============

export interface ToolDefinition<T extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  inputSchema: T;
}

// ============ All Tool Definitions ============

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "get_groups",
    description:
      "Get all tab groups in the browser. Each group includes its id, title, color, collapsed status, and windowId.",
    inputSchema: emptyInput,
  },
  {
    name: "get_tabs",
    description:
      "Get metadata for all currently open tabs in the browser, including id, title, url, group id, index, window id, and active status.",
    inputSchema: emptyInput,
  },
  {
    name: "close_tabs",
    description:
      'Closes one or more tabs by their IDs. Example: { tabIds: [123, 456] }',
    inputSchema: close_tabsSchema,
  },
  {
    name: "group_tabs_by_ids",
    description:
      "Group the given tabs by their ids into new groups. Each group should include tabIds, color, and title. Organizes tabs into topics based on URLs and titles. group titles should be relatively short and descriptive (due to the limited space browsers tab bar)",
    inputSchema: group_tabs_by_idsSchema,
  },
  {
    name: "open_new_tab",
    description:
      "Open a new tab with a given URL. The `Withcontent` option determines whether to include the page content. if the user query involves reading or summarizing the page content, set Withcontent to true.(this better that opening a tab and then getting the content separately , fallback to get tab content tool if this does not work)",
    inputSchema: open_new_tabSchema,
  },
  {
    name: "run_script",
    description:
      "Executes a string of JavaScript code in the context of a specific tab. If no tabId is provided, it runs on the active tab.",
    inputSchema: run_scriptSchema,
  },
  {
    name: "get_tab_content",
    description:
      "Get the readable content (using Mozilla's Readability), title, and URL for a specific tab by its ID.",
    inputSchema: get_tab_contentSchema,
  },
  {
    name: "get_page_content",
    description: "Get the full DOM snapshot of a specific tab by its ID.",
    inputSchema: get_page_contentSchema,
  },
  {
    name: "get_page_dom_snapshot",
    description: "Capture a DOM snapshot of the current page given a TabId.",
    inputSchema: get_page_dom_snapshotSchema,
  },
];
