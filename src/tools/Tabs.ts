import { defineTool } from "./defineTool";
import {
  getGroupsDef,
  getTabsDef,
  closeTabsDef,
  groupTabsByIdsDef,
  openNewTabDef,
} from "./definitions/tabs.def";
import { fetchTabContent } from "./Page";
import type { IServices } from "@/services";

import {  } from "./definitions";

// Helper functions
export const fetchTabGroups = async (svc: IServices) => {
  const groups = await svc.tabGroups.query({});
  return groups;
};

export const fetchTabsMeta = async (svc: IServices) => {
  const tabs = await svc.tabs.query({ lastFocusedWindow: true });
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

async function createTabAndWait(
  createProperties: chrome.tabs.CreateProperties,
  services: IServices
): Promise<chrome.tabs.Tab> {
  const tab = await services.tabs.create(createProperties);

  return new Promise((resolve) => {
    const listener = (
      tabId: number,
      info: chrome.tabs.OnUpdatedInfo,
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

// Tools using defineTool
export const get_groups = defineTool(getGroupsDef, async (_input, services) => {
  return JSON.stringify(await fetchTabGroups(services));
});

export const get_tabs = defineTool(getTabsDef, async (_input, services) => {
  return JSON.stringify(await fetchTabsMeta(services));
});

export const close_tabs = defineTool(closeTabsDef, async ({ tabIds }, services) => {
  await services.tabs.remove(tabIds);
  return "Tabs closed with IDs: " + tabIds.join(", ");
});

export const group_tabs_by_ids = defineTool(groupTabsByIdsDef, async ({ groups }, services) => {
  await Promise.all(
    groups.map(async (group) => {
      const { tabIds, title, color } = group;
      const groupid = await services.tabs.group({
        tabIds: tabIds as [number, ...number[]],
      });
      await services.tabGroups.update(groupid, { title, color });
    })
  );
  return "Grouped tabs into " + groups.length + " groups.";
});

export const open_new_tab = defineTool(openNewTabDef, async ({ url, Withcontent }, services) => {
  const newTab = await createTabAndWait({ url }, services);

  let content = null;
  try {
    if (Withcontent) {
      content = await fetchTabContent(newTab.id!, services);
    }
  } catch (error) {
    console.error("Error fetching content for new tab:", error);
  }

  const tabId = newTab.id ?? "unknown";
  const contentSuffix = Withcontent ? `, with content : ${content?.markdown}` : "";

  return `Opened new tab with id ${tabId} for url: ${url}${contentSuffix}`;
});
