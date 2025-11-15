import z, { ZodObject } from "zod";
import { emptyInput, Tool } from "./types";
import { get } from "http";

const get_groups: Tool<typeof emptyInput> = {
  name: "get_groups",
  description: "Get all tab groups in the browser.",
  inputSchema: emptyInput,
  execute: async () => {
    const Groups = await chrome.tabGroups.query({});

    return JSON.stringify(Groups);
  },
};

const get_tabs: Tool<typeof emptyInput> = {
  name: "get_tabs",
  description: "Get all tabs in the browser.",
  inputSchema: emptyInput,
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

const close_tabsType = z.object({
  tabIds: z.array(z.number()),
});
const close_tabs: Tool<typeof close_tabsType> = {
  name: "close_tabs",
  description: "Close tabs by their IDs.",
  inputSchema: close_tabsType,
  execute: async ({ tabIds }) => {
    chrome.tabs.query({}, () => {
      chrome.tabs.remove(tabIds);
    });

    return "Tabs closed with IDs: " + tabIds.join(", ");
  },
};

const group_tabs_by_idsInput = z.object({
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

const group_tabs_by_ids: Tool<typeof group_tabs_by_idsInput> = {
  name: "group_tabs_by_ids",
  description:
    "Group the given tabs by their ids into new groups. Each group should include tabIds, color, and title. Organizes tabs into topics based on URLs and titles. Example: { groups: [{ tabIds: [123, 456], color: 'blue', title: 'Docs' }] }",
  inputSchema: group_tabs_by_idsInput,
  execute: async ({ groups }) => {
    groups.forEach(async (group) => {
      console.log("grouping", group);
      const { tabIds, title, color } = group;

      const groupid = await chrome.tabs.group({
        tabIds: tabIds as [number, ...number[]],
      });
      console.log("created group", groupid);
      await chrome.tabGroups.update(groupid, {
        title: title,
        color: color,
      });
      console.log(
        `Grouped tabs ${tabIds} into group ${groupid} with title "${title}" and color "${color}"`
      );
    });
    return "Grouped tabs into " + groups.length + " groups.";
  },
};

export { get_groups, get_tabs, close_tabs, group_tabs_by_ids };
