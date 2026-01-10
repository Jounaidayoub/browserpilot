import type { Tool } from "./defineTool";
import {
  get_groups,
  get_tabs,
  close_tabs,
  group_tabs_by_ids,
  open_new_tab,
  fetchTabGroups,
  fetchTabsMeta,
} from "./Tabs";
import { search_history } from "./History";
import { get_current_time } from "./Time";
import { run_script } from "./Scripting";
import {
  get_tab_content,
  get_page_content,
  get_page_dom_snapshot,
  fetchTabContent,
} from "./Page";

// Re-export services for convenience
export { services, createServices } from "@/services";
export type { IServices } from "@/services";

// Re-export definitions (server imports from here)
export { toolDefinitions } from "./definitions";
export type { ToolDefinition } from "./types";
export type { Tool } from "./defineTool";

const registeredTools: Tool[] = [
  get_groups,
  get_tabs,
  close_tabs,
  group_tabs_by_ids,
  open_new_tab,
  run_script,
  get_tab_content,
  get_page_content,
  get_page_dom_snapshot,
  search_history,
  get_current_time,
];

const ToolStore = new Map(registeredTools.map((tool) => [tool.name, tool]));

export {
  registeredTools,
  ToolStore,
  fetchTabGroups,
  fetchTabsMeta,
  fetchTabContent,
};
