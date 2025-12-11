# Service Layer Architecture

**Component:** Infrastructure Abstraction Layer
**Priority:** Critical (Foundation)
**Status:** Design Complete - Ready for Implementation
**Dependencies:** Message Bus (for communication patterns)

---

## Table of Contents

1. [Overview](#overview)
2. [The Problem](#the-problem)
3. [The Solution](#the-solution)
4. [Architecture Design](#architecture-design)
5. [Service Catalog](#service-catalog)
6. [Implementation Guide](#implementation-guide)
7. [Dependency Injection](#dependency-injection)
8. [Testing Strategy](#testing-strategy)
9. [Migration Path](#migration-path)

---

## Overview

The **Service Layer** abstracts all Chrome API interactions behind clean, testable interfaces. This layer sits in the **background context** and provides the foundation for all privileged operations.

### Purpose

- **Encapsulate** Chrome API complexity
- **Standardize** error handling
- **Enable** unit testing through mocking
- **Centralize** permission checking
- **Abstract** implementation details

### Benefits

✅ **Testability** - Mock services for unit tests
✅ **Maintainability** - One place to update Chrome API usage
✅ **Type Safety** - Full TypeScript coverage
✅ **Error Handling** - Consistent error propagation
✅ **Flexibility** - Easy to swap implementations (e.g., Playwright vs native)

---

## The Problem

### Current State Analysis

Tools currently have **three different patterns** for browser interactions:

#### Pattern 1: Direct Chrome API in Tool

From `src/tools/Tabs.ts:47-58`:

```typescript
const close_tabs: Tool<typeof close_tabsType> = {
  name: "close_tabs",
  description: "Close tabs by their IDs.",
  inputSchema: close_tabsType,
  execute: async ({ tabIds }) => {
    chrome.tabs.query({}, () => {
      chrome.tabs.remove(tabIds);  // Direct Chrome API call
    });

    return "Tabs closed with IDs: " + tabIds.join(", ");
  },
};
```

**Issues:**
- Tool is coupled to Chrome API
- Can't unit test without Chrome environment
- No error handling
- Callback inside promise (mixing patterns)

#### Pattern 2: Message to Background

From `src/tools/Page.ts:71-83`:

```typescript
const get_page_content: Tool<typeof get_page_contentInput> = {
  name: "get_page_content",
  description: "Retrieve the serialized DOM snapshot for the given tab.",
  inputSchema: get_page_contentInput,
  execute: async ({ tabId }) => {
    const response = await chrome.runtime.sendMessage({
      action: "get_page_dom_snapshot",
      tabId,
    });

    if (!response?.success) {
      throw new Error(response?.error || "Failed to get page content");
    }

    const snapshot = response._snap;
    return typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot);
  },
};
```

**Issues:**
- Tool knows about messaging protocol
- Unclear why this needs background (vs Pattern 1)
- Tool does error handling (should be in service)

#### Pattern 3: Background Handler with Playwright

From `src/background/messageHandlers.ts:40-65`:

```typescript
const handleGetPageContent: MessageHandler = (message, sendResponse, crxApp) => {
  if (message?.action !== "get-page-content") return;

  const tabID = message.tabId;
  (async () => {
    try {
      if (!crxApp) {
        throw new Error("crxApp is not initialized");
      }
      const page = await crxApp.attach(tabID);
      const content = await page?.content();
      sendResponse({ success: true, content });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  return true;
};
```

**Issues:**
- Business logic mixed with message handling
- crxApp dependency injected via parameter (not clean)
- No abstraction layer
- Hard to test

### Core Issues

1. **Mixed Concerns** - Tools shouldn't know about Chrome APIs OR message passing
2. **No Abstraction** - Direct coupling to Chrome runtime
3. **Inconsistent Patterns** - Three different ways to do similar things
4. **Hard to Test** - Can't mock Chrome APIs easily
5. **Unclear Capabilities** - When to use Playwright vs native Chrome API?

---

## The Solution

### Service Layer Principles

1. **Single Responsibility** - Each service manages one Chrome API namespace
2. **Interface-Based** - Services implement interfaces (dependency inversion)
3. **Background-Only** - Services run only in background context
4. **Stateless** - Services don't hold state (use Chrome storage if needed)
5. **Error Consistent** - All services use same error handling pattern

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        UI CONTEXT                                   │
│  (Side Panel, Popup, Content Script)                                │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Tool / Component                                               │ │
│  │  - Calls MessageBus.send()                                    │ │
│  └────────────────────────┬──────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            │ Message Bus
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKGROUND CONTEXT                              │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Message Handler                                                │ │
│  │  - Validates request                                          │ │
│  │  - Calls service method                                       │ │
│  │  - Returns response                                           │ │
│  └────────────────────────┬──────────────────────────────────────┘ │
│                           │                                          │
│                           ▼                                          │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    SERVICE LAYER                               │ │
│  │                                                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │ │
│  │  │TabsService  │  │PageService  │  │ScriptingService│        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │ │
│  │  │HistoryService│ │StorageService│ │PlaywrightSvc │          │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │ │
│  └────────────────────────┬──────────────────────────────────────┘ │
│                           │                                          │
│                           ▼                                          │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    CHROME APIs                                 │ │
│  │  chrome.tabs, chrome.scripting, chrome.history, etc.         │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Design

### Service Interface Pattern

Every service follows this pattern:

```typescript
// 1. Define domain types
export interface TabMetadata {
  id: number;
  title: string;
  url: string;
  active: boolean;
  groupId: number;
  windowId: number;
  index: number;
}

export interface TabQueryFilters {
  active?: boolean;
  currentWindow?: boolean;
  url?: string | string[];
  groupId?: number;
}

// 2. Define service interface
export interface ITabsService {
  query(filters?: TabQueryFilters): Promise<TabMetadata[]>;
  get(tabId: number): Promise<TabMetadata>;
  create(options: CreateTabOptions): Promise<TabMetadata>;
  update(tabId: number, updates: TabUpdateOptions): Promise<TabMetadata>;
  close(tabIds: number[]): Promise<void>;
  group(tabIds: number[], options: GroupOptions): Promise<number>;
}

// 3. Implement service
export class TabsService implements ITabsService {
  async query(filters: TabQueryFilters = {}): Promise<TabMetadata[]> {
    try {
      const tabs = await chrome.tabs.query(filters);
      return tabs.map(this.mapToMetadata);
    } catch (error) {
      throw new TabsServiceError(
        "QUERY_FAILED",
        "Failed to query tabs",
        { filters, error }
      );
    }
  }

  private mapToMetadata(tab: chrome.tabs.Tab): TabMetadata {
    return {
      id: tab.id!,
      title: tab.title || "",
      url: tab.url || "",
      active: tab.active,
      groupId: tab.groupId,
      windowId: tab.windowId,
      index: tab.index,
    };
  }

  // ... other methods
}
```

### Service Error Pattern

All services throw typed errors:

```typescript
// src/services/errors/ServiceError.ts

export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class TabsServiceError extends ServiceError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, details);
    this.name = "TabsServiceError";
  }
}

export class PageServiceError extends ServiceError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, details);
    this.name = "PageServiceError";
  }
}

// Usage in service:
throw new TabsServiceError(
  "TAB_NOT_FOUND",
  `Tab with ID ${tabId} not found`,
  { tabId }
);
```

---

## Service Catalog

### 1. TabsService

**Responsibility:** Manage browser tabs

**Interface:**

```typescript
export interface ITabsService {
  // Queries
  query(filters?: TabQueryFilters): Promise<TabMetadata[]>;
  get(tabId: number): Promise<TabMetadata>;
  getCurrent(): Promise<TabMetadata>;

  // Mutations
  create(options: CreateTabOptions): Promise<TabMetadata>;
  update(tabId: number, updates: TabUpdateOptions): Promise<TabMetadata>;
  close(tabIds: number[]): Promise<void>;
  duplicate(tabId: number): Promise<TabMetadata>;
  reload(tabId: number, bypassCache?: boolean): Promise<void>;

  // Grouping
  group(tabIds: number[], options: GroupOptions): Promise<number>;
  ungroup(tabIds: number[]): Promise<void>;

  // Navigation
  goBack(tabId: number): Promise<void>;
  goForward(tabId: number): Promise<void>;
}
```

**Implementation:** `src/services/TabsService.ts`

### 2. TabGroupsService

**Responsibility:** Manage tab groups

**Interface:**

```typescript
export interface ITabGroupsService {
  query(options?: TabGroupQueryOptions): Promise<TabGroup[]>;
  get(groupId: number): Promise<TabGroup>;
  update(groupId: number, updates: TabGroupUpdateOptions): Promise<TabGroup>;
  move(groupId: number, moveProperties: { windowId: number; index: number }): Promise<TabGroup>;
}
```

**Implementation:** `src/services/TabGroupsService.ts`

### 3. PageService

**Responsibility:** Access page content (HTML, text, snapshots)

**Interface:**

```typescript
export interface IPageService {
  getContent(tabId: number, options?: PageContentOptions): Promise<PageContent>;
  getSnapshot(tabId: number): Promise<string>;
  getReadableContent(tabId: number): Promise<ReadableArticle | null>;
  waitForLoad(tabId: number, timeout?: number): Promise<void>;
}

export interface PageContent {
  title: string;
  url: string;
  html?: string;
  text?: string;
  meta?: Record<string, string>;
}

export interface ReadableArticle {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline: string | null;
  dir: string | null;
  siteName: string | null;
}
```

**Implementation:** `src/services/PageService.ts`

### 4. ScriptingService

**Responsibility:** Execute scripts in tabs

**Interface:**

```typescript
export interface IScriptingService {
  executeScript<T = any>(
    tabId: number,
    options: ExecuteScriptOptions
  ): Promise<T>;

  executeFunction<TArgs extends any[], TResult>(
    tabId: number,
    func: (...args: TArgs) => TResult,
    args?: TArgs
  ): Promise<TResult>;

  injectFile(tabId: number, file: string): Promise<void>;

  registerContentScript(options: chrome.scripting.RegisteredContentScript): Promise<void>;
  unregisterContentScript(id: string): Promise<void>;
}
```

**Implementation:** `src/services/ScriptingService.ts`

### 5. HistoryService

**Responsibility:** Access browser history

**Interface:**

```typescript
export interface IHistoryService {
  search(query: string, options?: HistorySearchOptions): Promise<HistoryItem[]>;
  getVisits(url: string): Promise<VisitItem[]>;
  addUrl(url: string): Promise<void>;
  deleteUrl(url: string): Promise<void>;
  deleteRange(startTime: number, endTime: number): Promise<void>;
}
```

**Implementation:** `src/services/HistoryService.ts`

### 6. StorageService

**Responsibility:** Persist data

**Interface:**

```typescript
export interface IStorageService {
  // Local storage (private to extension)
  local: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
  };

  // Sync storage (synced across devices)
  sync: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
  };
}
```

**Implementation:** `src/services/StorageService.ts`

### 7. PlaywrightService

**Responsibility:** Advanced automation via Playwright

**Interface:**

```typescript
export interface IPlaywrightService {
  isAvailable(): boolean;
  attach(tabId: number): Promise<PlaywrightPage>;
  newPage(options: { url: string }): Promise<PlaywrightPage>;
  getSnapshot(tabId: number): Promise<string>;
}
```

**Implementation:** `src/services/PlaywrightService.ts`

**Note:** This service wraps `playwright-crx` and provides fallback to native APIs when Playwright is unavailable.

---

## Implementation Guide

### Step 1: Create Service Interfaces

Create `src/services/interfaces/ITabsService.ts`:

```typescript
export interface TabMetadata {
  id: number;
  title: string;
  url: string;
  active: boolean;
  groupId: number;
  windowId: number;
  index: number;
}

export interface TabQueryFilters {
  active?: boolean;
  currentWindow?: boolean;
  highlighted?: boolean;
  pinned?: boolean;
  audible?: boolean;
  muted?: boolean;
  url?: string | string[];
  status?: "loading" | "complete";
  windowType?: "normal" | "popup" | "panel";
}

export interface CreateTabOptions {
  url: string;
  active?: boolean;
  index?: number;
  pinned?: boolean;
  windowId?: number;
  openerTabId?: number;
}

export interface TabUpdateOptions {
  url?: string;
  active?: boolean;
  pinned?: boolean;
  muted?: boolean;
}

export interface GroupOptions {
  title?: string;
  color?: chrome.tabGroups.ColorEnum;
}

export interface ITabsService {
  query(filters?: TabQueryFilters): Promise<TabMetadata[]>;
  get(tabId: number): Promise<TabMetadata>;
  getCurrent(): Promise<TabMetadata>;
  create(options: CreateTabOptions): Promise<TabMetadata>;
  update(tabId: number, updates: TabUpdateOptions): Promise<TabMetadata>;
  close(tabIds: number[]): Promise<void>;
  group(tabIds: number[], options: GroupOptions): Promise<number>;
  duplicate(tabId: number): Promise<TabMetadata>;
  reload(tabId: number, bypassCache?: boolean): Promise<void>;
}
```

### Step 2: Implement Service

Create `src/services/TabsService.ts`:

```typescript
import type {
  ITabsService,
  TabMetadata,
  TabQueryFilters,
  CreateTabOptions,
  TabUpdateOptions,
  GroupOptions,
} from "./interfaces/ITabsService";
import { TabsServiceError } from "./errors/ServiceError";

export class TabsService implements ITabsService {
  /**
   * Query tabs based on filters
   */
  async query(filters: TabQueryFilters = {}): Promise<TabMetadata[]> {
    try {
      const tabs = await chrome.tabs.query(filters);
      return tabs.map(this.mapToMetadata);
    } catch (error) {
      throw new TabsServiceError(
        "QUERY_FAILED",
        "Failed to query tabs",
        { filters, error }
      );
    }
  }

  /**
   * Get single tab by ID
   */
  async get(tabId: number): Promise<TabMetadata> {
    try {
      const tab = await chrome.tabs.get(tabId);
      return this.mapToMetadata(tab);
    } catch (error) {
      if ((error as any).message?.includes("No tab with id")) {
        throw new TabsServiceError(
          "TAB_NOT_FOUND",
          `Tab with ID ${tabId} not found`,
          { tabId }
        );
      }
      throw new TabsServiceError(
        "GET_FAILED",
        `Failed to get tab ${tabId}`,
        { tabId, error }
      );
    }
  }

  /**
   * Get currently active tab
   */
  async getCurrent(): Promise<TabMetadata> {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        throw new TabsServiceError(
          "NO_ACTIVE_TAB",
          "No active tab found"
        );
      }

      return this.mapToMetadata(tab);
    } catch (error) {
      if (error instanceof TabsServiceError) throw error;
      throw new TabsServiceError(
        "GET_CURRENT_FAILED",
        "Failed to get current tab",
        { error }
      );
    }
  }

  /**
   * Create new tab
   */
  async create(options: CreateTabOptions): Promise<TabMetadata> {
    try {
      const tab = await chrome.tabs.create(options);
      return this.mapToMetadata(tab);
    } catch (error) {
      throw new TabsServiceError(
        "CREATE_FAILED",
        "Failed to create tab",
        { options, error }
      );
    }
  }

  /**
   * Update tab properties
   */
  async update(
    tabId: number,
    updates: TabUpdateOptions
  ): Promise<TabMetadata> {
    try {
      const tab = await chrome.tabs.update(tabId, updates);
      return this.mapToMetadata(tab);
    } catch (error) {
      throw new TabsServiceError(
        "UPDATE_FAILED",
        `Failed to update tab ${tabId}`,
        { tabId, updates, error }
      );
    }
  }

  /**
   * Close one or more tabs
   */
  async close(tabIds: number[]): Promise<void> {
    try {
      await chrome.tabs.remove(tabIds);
    } catch (error) {
      throw new TabsServiceError(
        "CLOSE_FAILED",
        `Failed to close tabs`,
        { tabIds, error }
      );
    }
  }

  /**
   * Group tabs together
   */
  async group(tabIds: number[], options: GroupOptions): Promise<number> {
    try {
      // Create group
      const groupId = await chrome.tabs.group({
        tabIds: tabIds as [number, ...number[]],
      });

      // Update group properties
      await chrome.tabGroups.update(groupId, {
        title: options.title,
        color: options.color,
      });

      return groupId;
    } catch (error) {
      throw new TabsServiceError(
        "GROUP_FAILED",
        "Failed to group tabs",
        { tabIds, options, error }
      );
    }
  }

  /**
   * Duplicate a tab
   */
  async duplicate(tabId: number): Promise<TabMetadata> {
    try {
      const tab = await chrome.tabs.duplicate(tabId);
      return this.mapToMetadata(tab);
    } catch (error) {
      throw new TabsServiceError(
        "DUPLICATE_FAILED",
        `Failed to duplicate tab ${tabId}`,
        { tabId, error }
      );
    }
  }

  /**
   * Reload a tab
   */
  async reload(tabId: number, bypassCache: boolean = false): Promise<void> {
    try {
      await chrome.tabs.reload(tabId, { bypassCache });
    } catch (error) {
      throw new TabsServiceError(
        "RELOAD_FAILED",
        `Failed to reload tab ${tabId}`,
        { tabId, bypassCache, error }
      );
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private mapToMetadata(tab: chrome.tabs.Tab): TabMetadata {
    if (!tab.id) {
      throw new TabsServiceError(
        "INVALID_TAB",
        "Tab missing required ID field"
      );
    }

    return {
      id: tab.id,
      title: tab.title || "",
      url: tab.url || "",
      active: tab.active,
      groupId: tab.groupId,
      windowId: tab.windowId,
      index: tab.index,
    };
  }
}

// Export singleton instance
export const tabsService = new TabsService();
```

### Step 3: Create Service Registry

Create `src/services/ServiceRegistry.ts`:

```typescript
import { TabsService, tabsService } from "./TabsService";
import { TabGroupsService, tabGroupsService } from "./TabGroupsService";
import { PageService, pageService } from "./PageService";
import { ScriptingService, scriptingService } from "./ScriptingService";
import { HistoryService, historyService } from "./HistoryService";
import { StorageService, storageService } from "./StorageService";
import { PlaywrightService, playwrightService } from "./PlaywrightService";

import type { ITabsService } from "./interfaces/ITabsService";
import type { ITabGroupsService } from "./interfaces/ITabGroupsService";
import type { IPageService } from "./interfaces/IPageService";
import type { IScriptingService } from "./interfaces/IScriptingService";
import type { IHistoryService } from "./interfaces/IHistoryService";
import type { IStorageService } from "./interfaces/IStorageService";
import type { IPlaywrightService } from "./interfaces/IPlaywrightService";

/**
 * Service Registry - Central access point for all services
 *
 * This implements a simple service locator pattern for dependency injection.
 * All services are singletons initialized at startup.
 */
export class ServiceRegistry {
  private static services = new Map<string, any>();

  // Register all services at startup
  static initialize() {
    this.register("tabs", tabsService);
    this.register("tabGroups", tabGroupsService);
    this.register("page", pageService);
    this.register("scripting", scriptingService);
    this.register("history", historyService);
    this.register("storage", storageService);
    this.register("playwright", playwrightService);

    console.log("[ServiceRegistry] Initialized with services:", [
      ...this.services.keys(),
    ]);
  }

  static register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  static get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service not found: ${name}`);
    }
    return service;
  }

  // Typed getters for convenience
  static get tabs(): ITabsService {
    return this.get("tabs");
  }

  static get tabGroups(): ITabGroupsService {
    return this.get("tabGroups");
  }

  static get page(): IPageService {
    return this.get("page");
  }

  static get scripting(): IScriptingService {
    return this.get("scripting");
  }

  static get history(): IHistoryService {
    return this.get("history");
  }

  static get storage(): IStorageService {
    return this.get("storage");
  }

  static get playwright(): IPlaywrightService {
    return this.get("playwright");
  }
}
```

### Step 4: Use Services in Message Handlers

Update handlers to use services instead of direct Chrome APIs:

```typescript
// src/background/handlers/GetTabsHandler.ts
import type { GetTabsRequest, GetTabsResponse } from "@/core/messages/types";
import type { MessageHandler } from "../MessageRouter";
import { ServiceRegistry } from "@/services/ServiceRegistry";

export const GetTabsHandler: MessageHandler<GetTabsRequest> = async (
  message,
  sender
) => {
  const { filters = {} } = message;

  // Use service instead of direct Chrome API
  const tabs = await ServiceRegistry.tabs.query(filters);

  const response: GetTabsResponse = {
    type: "GET_TABS_RESPONSE",
    requestId: message.requestId,
    success: true,
    tabs,
  };

  return response;
};
```

### Step 5: Initialize in Background

Update `src/background.ts`:

```typescript
import { crx, type CrxApplication } from "playwright-crx";
import { messageRouter } from "./background/MessageRouter";
import { ServiceRegistry } from "./services/ServiceRegistry";

// Import handlers
import { GetTabsHandler } from "./background/handlers/GetTabsHandler";
// ... more handlers

(async () => {
  // Initialize services FIRST
  ServiceRegistry.initialize();

  // Initialize Playwright (optional)
  let crxApp: CrxApplication | null = null;
  try {
    crxApp = await crx.start({ slowMo: 50 });
    // Register with service registry if available
    if (crxApp) {
      ServiceRegistry.register("playwrightApp", crxApp);
    }
  } catch (e) {
    console.warn("Playwright not available:", e);
  }

  // Register message handlers
  messageRouter.register("GET_TABS_REQUEST", GetTabsHandler);
  // ... more registrations

  // Initialize message router
  messageRouter.initialize();

  console.log("[Background] Initialized");
})();
```

---

## Dependency Injection

### Why Dependency Injection?

1. **Testability** - Mock services in tests
2. **Flexibility** - Swap implementations
3. **Decoupling** - Components don't know about concrete implementations

### Pattern: Constructor Injection

Tools receive service dependencies via constructor:

```typescript
// src/tools/domain/CloseTabsTool.ts
import type { ITabsService } from "@/services/interfaces/ITabsService";
import type { ITool, ToolResult } from "../types";
import { z } from "zod";

export class CloseTabsTool implements ITool {
  name = "close_tabs";
  description = "Close tabs by their IDs";
  version = "1.0.0";

  inputSchema = z.object({
    tabIds: z.array(z.number()).min(1, "At least one tab ID required"),
  });

  // Service injected via constructor
  constructor(private tabsService: ITabsService) {}

  async execute(input: z.infer<typeof this.inputSchema>): Promise<ToolResult> {
    const { tabIds } = this.inputSchema.parse(input);

    // Use injected service
    await this.tabsService.close(tabIds);

    return {
      success: true,
      data: `Closed ${tabIds.length} tab(s)`,
    };
  }
}

// In tool registry:
import { ServiceRegistry } from "@/services/ServiceRegistry";

const closeTabsTool = new CloseTabsTool(ServiceRegistry.tabs);
```

### Pattern: Service Locator (Simpler)

For simpler cases, use service registry directly:

```typescript
// src/tools/domain/GetTabsTool.ts
import { ServiceRegistry } from "@/services/ServiceRegistry";

export class GetTabsTool implements ITool {
  name = "get_tabs";

  async execute(input: any): Promise<ToolResult> {
    // Access service via registry
    const tabs = await ServiceRegistry.tabs.query(input.filters);

    return {
      success: true,
      data: JSON.stringify(tabs),
    };
  }
}
```

**Trade-off:**
- Constructor injection: More testable, more boilerplate
- Service locator: Simpler, harder to test

**Recommendation:** Use constructor injection for tools, service locator for handlers.

---

## Testing Strategy

### Unit Test Services (with Chrome API Mocks)

```typescript
// src/services/__tests__/TabsService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TabsService } from "../TabsService";
import { TabsServiceError } from "../errors/ServiceError";

describe("TabsService", () => {
  let service: TabsService;

  beforeEach(() => {
    // Mock chrome.tabs API
    global.chrome = {
      tabs: {
        query: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        group: vi.fn(),
      },
      tabGroups: {
        update: vi.fn(),
      },
    } as any;

    service = new TabsService();
  });

  describe("query", () => {
    it("should return tab metadata", async () => {
      const mockTabs = [
        {
          id: 1,
          title: "Test Tab",
          url: "https://example.com",
          active: true,
          groupId: -1,
          windowId: 1,
          index: 0,
        },
      ];

      (chrome.tabs.query as any).mockResolvedValue(mockTabs);

      const result = await service.query({ active: true });

      expect(result).toEqual([
        {
          id: 1,
          title: "Test Tab",
          url: "https://example.com",
          active: true,
          groupId: -1,
          windowId: 1,
          index: 0,
        },
      ]);
    });

    it("should throw TabsServiceError on failure", async () => {
      (chrome.tabs.query as any).mockRejectedValue(new Error("API Error"));

      await expect(service.query()).rejects.toThrow(TabsServiceError);
      await expect(service.query()).rejects.toThrow("Failed to query tabs");
    });
  });

  describe("get", () => {
    it("should throw TAB_NOT_FOUND error", async () => {
      (chrome.tabs.get as any).mockRejectedValue(
        new Error("No tab with id: 999")
      );

      await expect(service.get(999)).rejects.toThrow("Tab with ID 999 not found");
    });
  });

  describe("close", () => {
    it("should close multiple tabs", async () => {
      (chrome.tabs.remove as any).mockResolvedValue(undefined);

      await service.close([1, 2, 3]);

      expect(chrome.tabs.remove).toHaveBeenCalledWith([1, 2, 3]);
    });
  });
});
```

### Unit Test Tools (with Service Mocks)

```typescript
// src/tools/domain/__tests__/CloseTabsTool.test.ts
import { describe, it, expect, vi } from "vitest";
import { CloseTabsTool } from "../CloseTabsTool";
import type { ITabsService } from "@/services/interfaces/ITabsService";

describe("CloseTabsTool", () => {
  it("should close tabs via service", async () => {
    // Mock service
    const mockTabsService: ITabsService = {
      close: vi.fn().mockResolvedValue(undefined),
    } as any;

    const tool = new CloseTabsTool(mockTabsService);

    const result = await tool.execute({ tabIds: [1, 2, 3] });

    expect(mockTabsService.close).toHaveBeenCalledWith([1, 2, 3]);
    expect(result.success).toBe(true);
    expect(result.data).toContain("Closed 3 tab(s)");
  });

  it("should throw on invalid input", async () => {
    const mockTabsService: ITabsService = {} as any;
    const tool = new CloseTabsTool(mockTabsService);

    await expect(tool.execute({ tabIds: [] })).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
// tests/integration/tabs-service.test.ts
import { test, expect } from "@playwright/test";
import { chromium } from "playwright";

test("TabsService integration", async () => {
  // Load real extension
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=/path/to/extension`,
      `--load-extension=/path/to/extension`,
    ],
  });

  // Test real tab operations
  const page = await context.newPage();
  await page.goto("https://example.com");

  // Send message to background to query tabs
  const tabs = await page.evaluate(() => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: "GET_TABS_REQUEST" },
        resolve
      );
    });
  });

  expect(tabs).toBeDefined();
  expect(tabs.tabs.length).toBeGreaterThan(0);
});
```

---

## Migration Path

### Phase 1: Create Service Layer (Week 1)

**Tasks:**
1. Create service interfaces
2. Implement TabsService (start with most-used)
3. Create ServiceRegistry
4. Write unit tests

**Acceptance Criteria:**
- [ ] All service interfaces defined
- [ ] TabsService implemented and tested
- [ ] ServiceRegistry working
- [ ] 100% test coverage for TabsService

### Phase 2: Migrate Message Handlers (Week 2)

**Tasks:**
1. Update GetTabsHandler to use TabsService
2. Update CloseTabsHandler to use TabsService
3. Implement remaining services (PageService, ScriptingService)
4. Migrate all handlers

**Acceptance Criteria:**
- [ ] All handlers use services
- [ ] No direct Chrome API calls in handlers
- [ ] All services tested

### Phase 3: Refactor Tools (Week 3)

**Tasks:**
1. Update tools to use dependency injection
2. Remove direct Chrome API calls from tools
3. Remove message sending from tools (should go through message bus)

**Acceptance Criteria:**
- [ ] All tools use services or message bus
- [ ] No direct Chrome API in tools
- [ ] Tools are unit tested with mocked services

### Phase 4: Cleanup (Week 4)

**Tasks:**
1. Remove old messageHandlers.ts
2. Update documentation
3. Add integration tests

**Acceptance Criteria:**
- [ ] Old code removed
- [ ] Documentation updated
- [ ] Integration tests passing

---

## Best Practices

### 1. Keep Services Stateless

```typescript
// ❌ Bad: Service holds state
class TabsService {
  private cachedTabs: TabMetadata[] = [];

  async query() {
    if (this.cachedTabs.length > 0) return this.cachedTabs;
    // ...
  }
}

// ✅ Good: Stateless
class TabsService {
  async query(filters: TabQueryFilters) {
    // Fresh query every time
    const tabs = await chrome.tabs.query(filters);
    return tabs.map(this.mapToMetadata);
  }
}
```

**Why:** Background service workers can be terminated by Chrome, losing in-memory state.

### 2. Always Handle Errors

```typescript
// ❌ Bad: Let errors bubble
async query(filters: TabQueryFilters) {
  const tabs = await chrome.tabs.query(filters);
  return tabs.map(this.mapToMetadata);
}

// ✅ Good: Catch and wrap errors
async query(filters: TabQueryFilters) {
  try {
    const tabs = await chrome.tabs.query(filters);
    return tabs.map(this.mapToMetadata);
  } catch (error) {
    throw new TabsServiceError(
      "QUERY_FAILED",
      "Failed to query tabs",
      { filters, error }
    );
  }
}
```

### 3. Use Domain Types, Not Chrome Types

```typescript
// ❌ Bad: Expose chrome.tabs.Tab directly
async get(tabId: number): Promise<chrome.tabs.Tab> {
  return await chrome.tabs.get(tabId);
}

// ✅ Good: Map to domain type
async get(tabId: number): Promise<TabMetadata> {
  const tab = await chrome.tabs.get(tabId);
  return this.mapToMetadata(tab);
}
```

**Why:** Decouples domain from Chrome API changes.

### 4. Add Logging for Observability

```typescript
async close(tabIds: number[]): Promise<void> {
  console.log(`[TabsService] Closing tabs:`, tabIds);

  try {
    await chrome.tabs.remove(tabIds);
    console.log(`[TabsService] Successfully closed ${tabIds.length} tabs`);
  } catch (error) {
    console.error(`[TabsService] Failed to close tabs:`, error);
    throw new TabsServiceError("CLOSE_FAILED", "Failed to close tabs", {
      tabIds,
      error,
    });
  }
}
```

---

## Conclusion

The Service Layer provides:

✅ **Abstraction** - Hide Chrome API complexity
✅ **Testability** - Mock services for unit tests
✅ **Consistency** - Standard error handling
✅ **Maintainability** - One place to update API usage
✅ **Type Safety** - Domain types, not Chrome types

This layer is the **foundation** for a clean, testable architecture. Once services are in place, tools and handlers become thin orchestrators with clear responsibilities.

---

**Next Steps:**
1. Implement TabsService as proof-of-concept
2. Update one handler to use service
3. Write tests
4. Iterate on pattern with team feedback

**Related Documents:**
- [Message Bus Architecture](./MESSAGE_BUS_ARCHITECTURE.md)
- [Tool System Guide](./TOOL_SYSTEM_GUIDE.md)
