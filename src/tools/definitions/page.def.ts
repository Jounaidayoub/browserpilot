// Page tool definitions - NO browser dependencies
import { z } from "zod";
import type { ToolDefinition } from "../types";

export const getTabContentSchema = z.object({
    tabId: z.number(),
});

export const getPageContentSchema = z.object({
    tabId: z.number(),
});

export const getPageDomSnapshotSchema = z.object({
    tabId: z.number(),
    options: z.record(z.string(), z.unknown()).optional(),
});

export const getTabContentDef: ToolDefinition<typeof getTabContentSchema> = {
    name: "get_tab_content",
    description: "Get the readable content (using Mozilla's Readability), title, and URL for a specific tab by its ID.",
    inputSchema: getTabContentSchema,
};

export const getPageContentDef: ToolDefinition<typeof getPageContentSchema> = {
    name: "get_page_content",
    description: "Get the full DOM snapshot of a specific tab by its ID.",
    inputSchema: getPageContentSchema,
};

export const getPageDomSnapshotDef: ToolDefinition<typeof getPageDomSnapshotSchema> = {
    name: "get_page_dom_snapshot",
    description: "Capture a DOM snapshot of the current page given a TabId.",
    inputSchema: getPageDomSnapshotSchema,
};
