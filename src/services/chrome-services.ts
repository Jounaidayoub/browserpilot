/**
 * Concrete Chrome implementations of service interfaces
 * These are the production implementations that use actual Chrome APIs
 */

import type {
  ITabsService,
  ITabGroupsService,
  IScriptingService,
  IMessagingService,
  IHistoryService,
} from "./interfaces";

// =============================================================================
// Chrome Tabs Service
// =============================================================================

export const chromeTabsService: ITabsService = {
  query: (queryInfo) => chrome.tabs.query(queryInfo),
  remove: (tabIds: number | number[]) => {
    if (Array.isArray(tabIds)) {
      return chrome.tabs.remove(tabIds);
    }
    return chrome.tabs.remove(tabIds);
  },
  get: (tabId) => chrome.tabs.get(tabId),

  create: (createProperties) => chrome.tabs.create(createProperties),
  group: (options) => chrome.tabs.group(options),
  sendMessage: (tabId, message) => chrome.tabs.sendMessage(tabId, message),
  onUpdated: {
    addListener: (callback) => chrome.tabs.onUpdated.addListener(callback),
    removeListener: (callback) =>
      chrome.tabs.onUpdated.removeListener(callback),
  },
};

// =============================================================================
// Chrome Tab Groups Service
// =============================================================================

export const chromeTabGroupsService: ITabGroupsService = {
  query: (queryInfo) => chrome.tabGroups.query(queryInfo ?? {}),
  update: (groupId, updateProperties) =>
    chrome.tabGroups.update(groupId, updateProperties),
};

// =============================================================================
// Chrome Scripting Service
// =============================================================================

export const chromeScriptingService: IScriptingService = {
  executeScript: (injection) => chrome.scripting.executeScript(injection),
};

// =============================================================================
// Chrome Messaging Service
// =============================================================================

export const chromeMessagingService: IMessagingService = {
  sendMessage: (message) => chrome.runtime.sendMessage(message),
  getURL: (path) => chrome.runtime.getURL(path),
  onMessage: {
    addListener: (callback) => chrome.runtime.onMessage.addListener(callback),
    removeListener: (callback) =>
      chrome.runtime.onMessage.removeListener(callback),
  },
};

// =============================================================================
// Chrome History Service
// =============================================================================

export const chromeHistoryService: IHistoryService = {
  search: (query) => chrome.history.search(query),
};
