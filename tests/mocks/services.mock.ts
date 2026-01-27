/**
 * Mock implementations of service interfaces for testing
 * Use these to create predictable test scenarios without Chrome APIs
 */

import { vi } from "vitest";
import type {
    ITabsService,
    ITabGroupsService,
    IScriptingService,
    IMessagingService,
    IHistoryService,
    IServices,
} from "@/services/interfaces";

// Mock Event Helper

function createMockEvent<T extends (...args: unknown[]) => void>() {
    const listeners: T[] = [];
    return {
        addListener: vi.fn((callback: T) => {
            listeners.push(callback);
        }),
        removeListener: vi.fn((callback: T) => {
            const index = listeners.indexOf(callback);
            if (index > -1) listeners.splice(index, 1);
        }),
        // Helper to trigger all listeners (for testing)
        _trigger: (...args: Parameters<T>) => {
            listeners.forEach((listener) => listener(...args));
        },
        _listeners: listeners,
    };
}

// Mock Tabs Service

export function createMockTabsService(
    overrides: Partial<ITabsService> = {}
): ITabsService {
    return {
        query: vi.fn().mockResolvedValue([]),
        remove: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockResolvedValue({ id: 1, url: "about:blank" }),
        group: vi.fn().mockResolvedValue(1),
        sendMessage: vi.fn().mockResolvedValue({}),
        onUpdated: createMockEvent(),
        ...overrides,
    };
}

// Mock Tab Groups Service

export function createMockTabGroupsService(
    overrides: Partial<ITabGroupsService> = {}
): ITabGroupsService {
    return {
        query: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue({ id: 1, title: "Test Group" }),
        ...overrides,
    };
}

// Mock Scripting Service

export function createMockScriptingService(
    overrides: Partial<IScriptingService> = {}
): IScriptingService {
    return {
        executeScript: vi.fn().mockResolvedValue([{ result: undefined }]),
        ...overrides,
    };
}

// Mock Messaging Service

export function createMockMessagingService(
    overrides: Partial<IMessagingService> = {}
): IMessagingService {
    return {
        sendMessage: vi.fn().mockResolvedValue({}),
        getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
        onMessage: createMockEvent(),
        ...overrides,
    };
}

// Mock History Service

export function createMockHistoryService(
    overrides: Partial<IHistoryService> = {}
): IHistoryService {
    return {
        search: vi.fn().mockResolvedValue([]),
        ...overrides,
    };
}

// Full Mock Services Container

export function createMockServices(
    overrides: Partial<IServices> = {}
): IServices {
    return {
        tabs: createMockTabsService(),
        tabGroups: createMockTabGroupsService(),
        scripting: createMockScriptingService(),
        messaging: createMockMessagingService(),
        history: createMockHistoryService(),
        ...overrides,
    };
}

// Test Data Factories

export const testData = {
    tab: (overrides: Partial<chrome.tabs.Tab> = {}): chrome.tabs.Tab => ({
        id: 1,
        index: 0,
        windowId: 1,
        highlighted: false,
        active: true,
        pinned: false,
        incognito: false,
        title: "Test Tab",
        url: "https://example.com",
        groupId: -1,
        ...overrides,
    }),

    tabGroup: (
        overrides: Partial<chrome.tabGroups.TabGroup> = {}
    ): chrome.tabGroups.TabGroup => ({
        id: 1,
        windowId: 1,
        collapsed: false,
        color: "blue",
        title: "Test Group",
        ...overrides,
    }),

    historyItem: (
        overrides: Partial<chrome.history.HistoryItem> = {}
    ): chrome.history.HistoryItem => ({
        id: "1",
        url: "https://example.com",
        title: "Example Page",
        lastVisitTime: Date.now(),
        visitCount: 1,
        typedCount: 0,
        ...overrides,
    }),
};
