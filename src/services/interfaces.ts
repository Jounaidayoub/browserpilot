/**
 * Service interfaces for abstracting Chrome APIs
 * Enables unit testing with mocks while keeping production behavior unchanged
 */


// =============================================================================
// Tabs Service
// =============================================================================
export interface ITabsService {
    query(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]>;
    remove(tabIds: number | number[]): Promise<void>;
    create(
        createProperties: chrome.tabs.CreateProperties
    ): Promise<chrome.tabs.Tab>;
    group(options: chrome.tabs.GroupOptions): Promise<number>;
    sendMessage<T = unknown>(tabId: number, message: unknown): Promise<T>;
    // Event subscription for onUpdated
    onUpdated: {
        addListener(
            callback: (
                tabId: number,
                changeInfo: chrome.tabs.OnUpdatedInfo,
                tab: chrome.tabs.Tab
            ) => void
        ): void;
        removeListener(
            callback: (
                tabId: number,
                changeInfo: chrome.tabs.OnUpdatedInfo,
                tab: chrome.tabs.Tab
            ) => void
        ): void;
    };
}

// =============================================================================
// Tab Groups Service
// =============================================================================

export interface ITabGroupsService {
    query(
        queryInfo?: chrome.tabGroups.QueryInfo
    ): Promise<chrome.tabGroups.TabGroup[]>;
    update(
        groupId: number,
        updateProperties: chrome.tabGroups.UpdateProperties
    ): Promise<chrome.tabGroups.TabGroup>;
}

// =============================================================================
// Scripting Service
// =============================================================================

export interface IScriptingService {
    executeScript<Args extends any[], Result>(
        injection: chrome.scripting.ScriptInjection<Args, Result>
    ): Promise<Array<chrome.scripting.InjectionResult<Awaited<Result>>>>;
}

// =============================================================================
// Messaging Service (chrome.runtime messaging)
// =============================================================================

export interface IMessagingService {
    sendMessage<T = unknown>(message: unknown): Promise<T>;
    getURL(path: string): string;
    onMessage: {
        addListener(
            callback: (
                message: unknown,
                sender: chrome.runtime.MessageSender,
                sendResponse: (response?: unknown) => void
            ) => void | boolean
        ): void;
        removeListener(
            callback: (
                message: unknown,
                sender: chrome.runtime.MessageSender,
                sendResponse: (response?: unknown) => void
            ) => void | boolean
        ): void;
    };
}

// =============================================================================
// History Service
// =============================================================================

export interface IHistoryService {
    search(
        query: chrome.history.HistoryQuery
    ): Promise<chrome.history.HistoryItem[]>;
}

// =============================================================================
// Service Container Type
// =============================================================================

export interface IServices {
    tabs: ITabsService;
    tabGroups: ITabGroupsService;
    scripting: IScriptingService;
    messaging: IMessagingService;
    history: IHistoryService;
}
