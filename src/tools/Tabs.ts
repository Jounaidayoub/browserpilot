import z from "zod";
import { emptyInput, Tool } from "./types";
import { fetchTabContent } from "./Page";
import { services as defaultServices, IServices } from "@/services";

// Helper functions that accept services
export const fetchTabGroups = async (svc: IServices = defaultServices) => {
  const groups = await svc.tabGroups.query({});
  return groups;
};

export const fetchTabsMeta = async (svc: IServices = defaultServices) => {
  //TODO : handel tabs on different windows
  const tabs = await svc.tabs.query({ lastFocusedWindow: true });

  return tabs.map((tab) => ({
    active: tab.active,
    id: tab.id,
    title: tab.title,
    url: tab.url,
    groupid: tab.groupId,
    index: tab.index,
    windowid: tab.windowId, // ??
  }));
};

const get_groups: Tool<typeof emptyInput> = {
  name: "get_groups",
  description: "Get all tab groups in the browser.",
  inputSchema: emptyInput,
  execute: async (_input, services = defaultServices) => {
    return JSON.stringify(await fetchTabGroups(services));
  },
};

const get_tabs: Tool<typeof emptyInput> = {
  name: "get_tabs",
  description: "Get all tabs in the browser.",
  inputSchema: emptyInput,
  execute: async (_input, services = defaultServices) => {
    return JSON.stringify(await fetchTabsMeta(services));
  },
};

const close_tabsType = z.object({
  tabIds: z.array(z.number()),
});
const close_tabs: Tool<typeof close_tabsType> = {
  name: "close_tabs",
  description: "Close tabs by their IDs.",
  inputSchema: close_tabsType,
  execute: async ({ tabIds }, services = defaultServices) => {
    await services.tabs.remove(tabIds);
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
  execute: async ({ groups }, services = defaultServices) => {
    await Promise.all(
      groups.map(async (group) => {
        const { tabIds, title, color } = group;

        const groupid = await services.tabs.group({
          tabIds: tabIds as [number, ...number[]],
        });

        await services.tabGroups.update(groupid, {
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
  createProperties: chrome.tabs.CreateProperties,
  services: IServices = defaultServices
): Promise<chrome.tabs.Tab> {
  const tab = await services.tabs.create(createProperties);

  return new Promise((resolve) => {
    const listener = (
      tabId: number,
      info: chrome.tabs.TabChangeInfo,
      _tab: chrome.tabs.Tab
    ) => {
      if (tabId === tab.id && info.status === "complete") {
        services.tabs.onUpdated.removeListener(listener);
        resolve(tab);
      }
    };
    services.tabs.onUpdated.addListener(listener);
  });
}

const open_new_tab: Tool<typeof open_new_tabInput> = {
  name: "open_new_tab",
  description: "Open a new browser tab with the provided URL.",
  inputSchema: open_new_tabInput,
  execute: async ({ url, Withcontent }, services = defaultServices) => {
    const newTab = await createTabAndWait({ url: url }, services);

    let content = null;
    try {
      if (Withcontent) {
        content = await fetchTabContent(newTab.id!, services);
      }
    } catch (error) {
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
