import { z } from "zod";
import type { ToolSet } from "ai";

export const tools: ToolSet = {
  get_groups: {
    name: "get_groups",
    description:
      "Get all tab groups in the browser. Each group includes its id, title, color, collapsed status, and windowId.",
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        id: z.number(),
        title: z.string(),
        color: z.string(),
        collapsed: z.boolean(),
        windowId: z.number(),
      })
    ),
  },
  get_tabs: {
    name: "get_tabs",
    description:
      "Get metadata for all currently open tabs in the browser, including id, title, url, group id, index, window id, and active status.",
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        active: z.boolean().optional(),
        id: z.number(),
        title: z.string().optional(),
        url: z.string().optional(),
        groupId: z.number().optional(),
        index: z.number().optional(),
        windowId: z.number().optional(),
      })
    ),
  },
  close_tabs: {
    name: "close_tabs",
    description:
      "Closes one or more tabs by their IDs. Example: { tabIds: [123, 456] }",
    inputSchema: z.object({
      tabIds: z.array(z.number()),
    }),
    outputSchema: z.string(),
  },
  group_tabs_by_ids: {
    name: "group_tabs_by_ids",
    description:
      "Group the given tabs by their ids into new groups. Each group should include tabIds, color, and title. Organizes tabs into topics based on URLs and titles. group titles should be relativly short and descriptive (due to the limited space browsers tab bar)",
    inputSchema: z.object({
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
    }),
    outputSchema: z.string(),
  },
  open_new_tab: {
    name: "open_new_tab",
    description:
      "Open a new tab with a given URL. The `Withcontent` option determines whether to include the page content. if the user query involves reading or summarizing the page content, set Withcontent to true.(this better that opening a tab and then getting the content separately , fallback to get tab content tool if this does not work)",
    inputSchema: z.object({
      url: z.string().min(1, "URL is required"),
      Withcontent: z.boolean().optional(),
    }),
    outputSchema: z.object({
      tabId: z.number(),
      content: z.string().optional(),
    }),
  },
  run_script: {
    name: "run_script",
    description:
      "Executes a string of JavaScript code in the context of a specific tab. If no tabId is provided, it runs on the active tab.",
    inputSchema: z.object({
      code: z.string().min(1, "Code is required"),
      tabId: z.number().optional(),
    }),
    outputSchema: z.string(),
  },
  get_tab_content: {
    name: "get_tab_content",
    description:
      "Get the readable content (using Mozilla's Readability), title, and URL for a specific tab by its ID.",
    inputSchema: z.object({
      tabId: z.number(),
    }),
    outputSchema: z.object({
      content: z.string(),
      title: z.string(),
      url: z.string(),
    }),
  },
  get_page_content: {
    name: "get_page_content",
    description: "Get the full DOM snapshot of a specific tab by its ID.",
    inputSchema: z.object({
      tabId: z.number(),
    }),
    outputSchema: z.string(),
  },
  get_page_dom_snapshot: {
    name: "get_page_dom_snapshot",
    description: "Capture a DOM snapshot of the current page given a TabId.",
    inputSchema: z.object({
      tabId: z.number(),
      options: z.record(z.string(), z.unknown()).optional(),
    }),
    outputSchema: z.string(),
  },
};
