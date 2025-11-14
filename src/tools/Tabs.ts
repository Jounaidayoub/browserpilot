import z, { ZodObject } from "zod";
import { Tool } from "./types";

const get_groups: Tool<null> = {
  name: "get_groups",
  description: "Get all tab groups in the browser.",
  execute: async () => {
    const Groups = await chrome.tabGroups.query({});

    return JSON.stringify(Groups);
  },
};

const get_tabs: Tool<null> = {
  name: "get_tabs",
  description: "Get all tabs in the browser.",
  execute: async () => {
    const tabs = await chrome.tabs.query({});

    const tabs_meta = tabs.map((tab) => ({
      active: tab.active,
      id: tab.id,
      title: tab.title,
      url: tab.url,
      groupid: tab.groupId,
      index: tab.index,
      windowid: tab.windowId,
    }));

    return JSON.stringify(tabs_meta);
  },
};

export { get_groups, get_tabs };
