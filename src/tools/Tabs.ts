import z from "zod";
import { emptyInput, Tool } from "./types";
import { fetchTabContent } from "./Page";
import { AwardIcon, Underline } from "lucide-react";
import { delay } from "motion/react";

export const fetchTabGroups = async () => {
  const groups = await chrome.tabGroups.query({});
  return groups;
};

export const fetchTabsMeta = async () => {
  const tabs = await chrome.tabs.query({});

  return tabs.map((tab) => ({
    active: tab.active,
    id: tab.id,
    title: tab.title,
    url: tab.url,
    groupid: tab.groupId,
    index: tab.index,
    windowid: tab.windowId,
  }));
};

const get_groups: Tool<typeof emptyInput> = {
  name: "get_groups",
  description: "Get all tab groups in the browser.",
  inputSchema: emptyInput,
  execute: async () => {
    return JSON.stringify(await fetchTabGroups());
  },
};

const get_tabs: Tool<typeof emptyInput> = {
  name: "get_tabs",
  description: "Get all tabs in the browser.",
  inputSchema: emptyInput,
  execute: async () => {
    return JSON.stringify(await fetchTabsMeta());
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
    await Promise.all(
      groups.map(async (group) => {
        const { tabIds, title, color } = group;

        const groupid = await chrome.tabs.group({
          tabIds: tabIds as [number, ...number[]],
        });

        await chrome.tabGroups.update(groupid, {
          title: title,
          color: color,
        });
      })
    );
    return "Grouped tabs into " + groups.length + " groups.";
  },
};

const open_new_tabInput = z.object({
  url: z.string().min(1, "URL is required"),
  Withcontent: z.boolean().optional(),
});

async function createTabAndWait(
  createProperties: chrome.tabs.CreateProperties
): Promise<chrome.tabs.Tab> {
  const tab = await chrome.tabs.create(createProperties);

  return new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve(tab);
      }
    });
  });
}

const open_new_tab: Tool<typeof open_new_tabInput> = {
  name: "open_new_tab",
  description: "Open a new browser tab with the provided URL.",
  inputSchema: open_new_tabInput,
  execute: async ({ url, Withcontent }) => {
    // const newTab = await chrome.tabs.create({ url: url, active: true });
    const newTab = await createTabAndWait({ url: url });
    
    let content = null;
    console.log("Withcontent:", Withcontent);
    try {
    if (Withcontent) {
      console.log("Fetching content for new tab:", newTab.id);

      content = await fetchTabContent(newTab.id!);
    }}
    catch (error) {
      console.error("Error fetching content for new tab:", error);
    }

    const tabId = newTab.id ?? "unknown";
    const contentSuffix = Withcontent
      ? `, with content : ${content?.markdown}`
      : "";

    return `Opened new tab with id ${tabId} for url: ${url}${contentSuffix}`;
  },
};

export { get_groups, get_tabs, close_tabs, group_tabs_by_ids, open_new_tab };
