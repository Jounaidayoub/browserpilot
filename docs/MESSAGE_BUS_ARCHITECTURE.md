# Message Bus Architecture

**Component:** Inter-Context Communication Layer
**Priority:** Critical (Foundation)
**Status:** Design Complete - Ready for Implementation
**Dependencies:** None (foundational layer)

---

## Table of Contents

1. [Overview](#overview)
2. [The Problem](#the-problem)
3. [The Solution](#the-solution)
4. [Architecture Design](#architecture-design)
5. [Implementation Guide](#implementation-guide)
6. [Message Types Catalog](#message-types-catalog)
7. [Usage Patterns](#usage-patterns)
8. [Error Handling](#error-handling)
9. [Testing Strategy](#testing-strategy)
10. [Migration Path](#migration-path)

---

## Overview

The **Message Bus** is the communication backbone connecting all execution contexts in the Chrome extension. It provides:

- **Type-safe** request/response messaging
- **Async/await** interface over Chrome's callback-based APIs
- **Timeout handling** for reliable communication
- **Event broadcasting** for pub/sub patterns
- **Request tracing** for debugging
- **Error propagation** with context

### Why We Need This

Chrome extensions operate across **multiple isolated JavaScript contexts** that can only communicate via message passing. Without a structured approach, this leads to:

- Type-unsafe `any` messages
- Callback hell
- Inconsistent error handling
- Difficult debugging ("where did this message go?")
- No request/response pattern

The Message Bus solves these problems with a **clean, typed abstraction**.

---

## The Problem

### Current State Analysis

Looking at `src/background.ts:67-75`:

```typescript
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // 'message' is 'any' - no type safety!
  for (const handler of messageHandlers) {
    const handled = handler(message, sendResponse, crxApp);
    if (handled) {
      return true;  // What does true mean? Unclear contract
    }
  }
});
```

And in `src/background/messageHandlers.ts:40-65`:

```typescript
const handleGetPageContent: MessageHandler = (message, sendResponse, crxApp) => {
  if (message?.action !== "get-page-content") return;  // String matching - brittle!

  const tabID = message.tabId;  // No type safety on message shape
  (async () => {
    try {
      if (!crxApp) {
        throw new Error("crxApp is not initialized");
      }
      const page = await crxApp.attach(tabID);
      const content = await page?.content();
      sendResponse({ success: true, content });  // Manual success wrapper
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  return true;  // Must remember to return true for async!
};
```

And in tools like `src/tools/Page.ts:67-84`:

```typescript
const get_page_content: Tool<typeof get_page_contentInput> = {
  name: "get_page_content",
  description: "Retrieve the serialized DOM snapshot for the given tab.",
  inputSchema: get_page_contentInput,
  execute: async ({ tabId }) => {
    const response = await chrome.runtime.sendMessage({
      action: "get_page_dom_snapshot",  // Magic string
      tabId,
    });

    if (!response?.success) {  // Manual success checking
      throw new Error(response?.error || "Failed to get page content");
    }

    const snapshot = response._snap;  // Weird property name, no types
    return typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot);
  },
};
```

### Issues Identified

1. **No Type Safety**
   - Messages are `any`
   - No compile-time verification
   - Easy to mistype action strings

2. **Inconsistent Patterns**
   - Some use `action` field
   - Some use `type` field
   - Some use custom fields

3. **Manual Error Handling**
   - Each handler wraps in try/catch
   - Inconsistent error response format
   - No centralized error logging

4. **Callback Complexity**
   - Must remember `return true` for async
   - sendResponse must be called exactly once
   - Race conditions possible

5. **No Request Tracking**
   - Can't correlate request/response
   - Difficult to debug timeouts
   - No retry mechanism

---

## The Solution

### Design Principles

1. **Type-Safe Messages**
   - Every message is a discriminated union type
   - TypeScript enforces correct message shape
   - Autocomplete in IDEs

2. **Request/Response Pattern**
   - Clear request → response mapping
   - Automatic correlation via `requestId`
   - Promise-based API (async/await)

3. **Centralized Routing**
   - Single registration point for handlers
   - Automatic error handling
   - Consistent logging

4. **Event Broadcasting**
   - Pub/sub for one-to-many communication
   - Type-safe event subscriptions
   - Automatic cleanup

5. **Developer Experience**
   - Simple API: `await MessageBus.send(request)`
   - Clear error messages
   - Traceability with request IDs

---

## Architecture Design

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          UI CONTEXT                                 │
│  (Side Panel, Popup, Content Script)                                │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    MessageBus Client                           │ │
│  │                                                                 │ │
│  │  send<TReq, TRes>(request: TReq): Promise<TRes>               │ │
│  │  subscribe<TEvent>(type, handler): Unsubscribe                │ │
│  │  broadcast<TEvent>(event: TEvent): void                       │ │
│  └────────────────────────┬──────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            │ chrome.runtime.sendMessage
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKGROUND CONTEXT                              │
│  (Service Worker)                                                   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    MessageRouter                               │ │
│  │                                                                 │ │
│  │  register<TMsg>(type, handler): void                          │ │
│  │  route(message, sender): Promise<Response>                    │ │
│  │  initialize(): void                                            │ │
│  └────────────────────────┬──────────────────────────────────────┘ │
│                           │                                          │
│                           ▼                                          │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                 Registered Handlers                            │ │
│  │                                                                 │ │
│  │  Map<MessageType, MessageHandler>                             │ │
│  │  - GetTabsHandler                                              │ │
│  │  - ExecuteToolHandler                                          │ │
│  │  - GetPageContentHandler                                       │ │
│  │  - ...                                                         │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Type System

```typescript
// src/core/messages/types.ts

/**
 * Base message interface - all messages extend this
 */
export interface BaseMessage {
  type: string;
  requestId?: string;
  timestamp?: number;
}

/**
 * Request message - sent from UI to background
 */
export interface RequestMessage extends BaseMessage {
  requestId: string;  // Required for correlation
}

/**
 * Response message - sent from background to UI
 */
export interface ResponseMessage extends BaseMessage {
  requestId: string;  // Correlates to request
  success: boolean;
}

/**
 * Error response - when something goes wrong
 */
export interface ErrorResponse extends ResponseMessage {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Event message - broadcast to all contexts
 */
export interface EventMessage extends BaseMessage {
  // No requestId - one-way broadcast
}

/**
 * Discriminated union of all message types
 */
export type Message =
  // Tab messages
  | GetTabsRequest
  | GetTabsResponse
  | CreateTabRequest
  | CreateTabResponse
  | CloseTabsRequest
  | CloseTabsResponse
  | GroupTabsRequest
  | GroupTabsResponse

  // Page messages
  | GetPageContentRequest
  | GetPageContentResponse
  | GetDomSnapshotRequest
  | GetDomSnapshotResponse

  // Tool messages
  | ExecuteToolRequest
  | ExecuteToolResponse

  // Script messages
  | ExecuteScriptRequest
  | ExecuteScriptResponse

  // Event messages
  | TabActivatedEvent
  | TabCreatedEvent
  | TabRemovedEvent

  // Error
  | ErrorResponse;
```

---

## Implementation Guide

### Step 1: Define Message Types

Create `src/core/messages/types.ts`:

```typescript
import { z } from "zod";

// ============================================================================
// Base Types
// ============================================================================

export interface BaseMessage {
  type: string;
  requestId?: string;
  timestamp?: number;
}

export interface RequestMessage extends BaseMessage {
  requestId: string;
}

export interface ResponseMessage extends BaseMessage {
  requestId: string;
  success: boolean;
}

export interface ErrorResponse extends ResponseMessage {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface EventMessage extends BaseMessage {}

// ============================================================================
// Tab Messages
// ============================================================================

export interface GetTabsRequest extends RequestMessage {
  type: "GET_TABS_REQUEST";
  filters?: {
    active?: boolean;
    currentWindow?: boolean;
    url?: string | string[];
  };
}

export interface GetTabsResponse extends ResponseMessage {
  type: "GET_TABS_RESPONSE";
  success: true;
  tabs: Array<{
    id: number;
    title: string;
    url: string;
    active: boolean;
    groupId: number;
    windowId: number;
    index: number;
  }>;
}

export interface CloseTabsRequest extends RequestMessage {
  type: "CLOSE_TABS_REQUEST";
  tabIds: number[];
}

export interface CloseTabsResponse extends ResponseMessage {
  type: "CLOSE_TABS_RESPONSE";
  success: true;
  closedCount: number;
}

export interface GroupTabsRequest extends RequestMessage {
  type: "GROUP_TABS_REQUEST";
  groups: Array<{
    tabIds: number[];
    title: string;
    color?: chrome.tabGroups.ColorEnum;
  }>;
}

export interface GroupTabsResponse extends ResponseMessage {
  type: "GROUP_TABS_RESPONSE";
  success: true;
  groupIds: number[];
}

// ============================================================================
// Page Content Messages
// ============================================================================

export interface GetPageContentRequest extends RequestMessage {
  type: "GET_PAGE_CONTENT_REQUEST";
  tabId: number;
  options?: {
    includeHtml?: boolean;
    includeText?: boolean;
    includeReadability?: boolean;
  };
}

export interface GetPageContentResponse extends ResponseMessage {
  type: "GET_PAGE_CONTENT_RESPONSE";
  success: true;
  content: {
    title: string;
    url: string;
    html?: string;
    text?: string;
    article?: {
      title: string;
      content: string;
      excerpt: string;
    };
  };
}

export interface GetDomSnapshotRequest extends RequestMessage {
  type: "GET_DOM_SNAPSHOT_REQUEST";
  tabId: number;
}

export interface GetDomSnapshotResponse extends ResponseMessage {
  type: "GET_DOM_SNAPSHOT_RESPONSE";
  success: true;
  snapshot: string; // Serialized snapshot
}

// ============================================================================
// Tool Execution Messages
// ============================================================================

export interface ExecuteToolRequest extends RequestMessage {
  type: "EXECUTE_TOOL_REQUEST";
  toolName: string;
  input: any; // Tool-specific input
}

export interface ExecuteToolResponse extends ResponseMessage {
  type: "EXECUTE_TOOL_RESPONSE";
  success: true;
  output: string;
}

// ============================================================================
// Script Execution Messages
// ============================================================================

export interface ExecuteScriptRequest extends RequestMessage {
  type: "EXECUTE_SCRIPT_REQUEST";
  tabId: number;
  code: string;
}

export interface ExecuteScriptResponse extends ResponseMessage {
  type: "EXECUTE_SCRIPT_RESPONSE";
  success: true;
  result: any;
}

// ============================================================================
// Event Messages
// ============================================================================

export interface TabActivatedEvent extends EventMessage {
  type: "TAB_ACTIVATED_EVENT";
  tabId: number;
  windowId: number;
}

export interface TabCreatedEvent extends EventMessage {
  type: "TAB_CREATED_EVENT";
  tab: {
    id: number;
    title: string;
    url: string;
  };
}

export interface TabRemovedEvent extends EventMessage {
  type: "TAB_REMOVED_EVENT";
  tabId: number;
}

// ============================================================================
// Union Type
// ============================================================================

export type Message =
  | GetTabsRequest
  | GetTabsResponse
  | CloseTabsRequest
  | CloseTabsResponse
  | GroupTabsRequest
  | GroupTabsResponse
  | GetPageContentRequest
  | GetPageContentResponse
  | GetDomSnapshotRequest
  | GetDomSnapshotResponse
  | ExecuteToolRequest
  | ExecuteToolResponse
  | ExecuteScriptRequest
  | ExecuteScriptResponse
  | TabActivatedEvent
  | TabCreatedEvent
  | TabRemovedEvent
  | ErrorResponse;

// ============================================================================
// Type Guards
// ============================================================================

export function isRequestMessage(msg: Message): msg is RequestMessage {
  return "requestId" in msg && msg.requestId !== undefined;
}

export function isResponseMessage(msg: Message): msg is ResponseMessage {
  return "success" in msg;
}

export function isErrorResponse(msg: Message): msg is ErrorResponse {
  return isResponseMessage(msg) && msg.success === false;
}

export function isEventMessage(msg: Message): msg is EventMessage {
  return !("requestId" in msg);
}
```

### Step 2: Implement MessageBus Client

Create `src/core/messages/MessageBus.ts`:

```typescript
import { nanoid } from "nanoid";
import type {
  Message,
  RequestMessage,
  ResponseMessage,
  ErrorResponse,
  EventMessage,
} from "./types";

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

/**
 * MessageBus - Client-side message bus for UI contexts
 *
 * Usage in Side Panel, Popup, or Content Scripts:
 *
 * const tabs = await MessageBus.send<GetTabsRequest, GetTabsResponse>({
 *   type: "GET_TABS_REQUEST",
 *   filters: { active: true }
 * });
 */
export class MessageBus {
  private static pendingRequests = new Map<string, PendingRequest>();
  private static eventListeners = new Map<string, Set<Function>>();
  private static isInitialized = false;

  /**
   * Initialize the message bus (call once per context)
   */
  static initialize() {
    if (this.isInitialized) return;

    // Listen for responses and events
    chrome.runtime.onMessage.addListener((message: Message) => {
      if ("requestId" in message && message.requestId) {
        // This is a response to a request
        this.handleResponse(message as ResponseMessage);
      } else {
        // This is an event broadcast
        this.handleEvent(message as EventMessage);
      }
    });

    this.isInitialized = true;
  }

  /**
   * Send a request and wait for response
   *
   * @param request - Request message
   * @param timeout - Timeout in ms (default: 30000)
   * @returns Promise that resolves with response
   */
  static async send<
    TRequest extends RequestMessage,
    TResponse extends ResponseMessage
  >(
    request: Omit<TRequest, "requestId" | "timestamp">,
    timeout: number = 30000
  ): Promise<TResponse> {
    const requestId = nanoid();
    const timestamp = Date.now();

    const fullRequest: TRequest = {
      ...request,
      requestId,
      timestamp,
    } as TRequest;

    return new Promise<TResponse>((resolve, reject) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(
          new Error(
            `Request timeout after ${timeout}ms: ${request.type} (${requestId})`
          )
        );
      }, timeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      // Send message
      chrome.runtime.sendMessage(fullRequest, (response) => {
        // Handle immediate errors (e.g., no background script)
        if (chrome.runtime.lastError) {
          this.pendingRequests.delete(requestId);
          clearTimeout(timeoutHandle);
          reject(new Error(chrome.runtime.lastError.message));
        }

        // Note: Actual response handling happens in handleResponse()
        // This callback just handles immediate send errors
      });
    });
  }

  /**
   * Subscribe to event broadcasts
   *
   * @param eventType - Event message type
   * @param handler - Handler function
   * @returns Unsubscribe function
   */
  static subscribe<T extends EventMessage>(
    eventType: T["type"],
    handler: (event: T) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    this.eventListeners.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(handler);
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Broadcast an event to all contexts (call from background)
   * Note: This should typically only be called from background context
   */
  static broadcast<T extends EventMessage>(event: Omit<T, "timestamp">) {
    const fullEvent: T = {
      ...event,
      timestamp: Date.now(),
    } as T;

    chrome.runtime.sendMessage(fullEvent);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private static handleResponse(response: ResponseMessage) {
    const pending = this.pendingRequests.get(response.requestId);

    if (!pending) {
      console.warn(
        `[MessageBus] Received response for unknown request: ${response.requestId}`
      );
      return;
    }

    // Clear timeout
    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.requestId);

    // Check if error response
    if (!response.success) {
      const errorResponse = response as ErrorResponse;
      const error = new Error(errorResponse.error.message);
      (error as any).code = errorResponse.error.code;
      (error as any).details = errorResponse.error.details;
      pending.reject(error);
      return;
    }

    // Resolve with response
    pending.resolve(response);
  }

  private static handleEvent(event: EventMessage) {
    const listeners = this.eventListeners.get(event.type);

    if (!listeners || listeners.size === 0) {
      return; // No listeners for this event
    }

    // Call all listeners
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(
          `[MessageBus] Error in event listener for ${event.type}:`,
          error
        );
      }
    }
  }

  /**
   * Get debug information about pending requests
   */
  static getDebugInfo() {
    return {
      pendingRequests: Array.from(this.pendingRequests.keys()),
      eventListeners: Array.from(this.eventListeners.keys()),
    };
  }
}

// Auto-initialize
MessageBus.initialize();
```

### Step 3: Implement MessageRouter (Background)

Create `src/background/MessageRouter.ts`:

```typescript
import type {
  Message,
  RequestMessage,
  ResponseMessage,
  ErrorResponse,
} from "@/core/messages/types";

export type MessageHandler<T extends RequestMessage = RequestMessage> = (
  message: T,
  sender: chrome.runtime.MessageSender
) => Promise<ResponseMessage>;

/**
 * MessageRouter - Background-side message routing
 *
 * Registers handlers for each message type and routes incoming messages
 * to the appropriate handler.
 */
export class MessageRouter {
  private handlers = new Map<string, MessageHandler>();
  private isInitialized = false;

  /**
   * Register a handler for a specific message type
   *
   * @param messageType - The message type (e.g., "GET_TABS_REQUEST")
   * @param handler - The handler function
   */
  register<T extends RequestMessage>(
    messageType: T["type"],
    handler: MessageHandler<T>
  ) {
    if (this.handlers.has(messageType)) {
      console.warn(
        `[MessageRouter] Overwriting handler for message type: ${messageType}`
      );
    }

    this.handlers.set(messageType, handler as MessageHandler);
    console.log(`[MessageRouter] Registered handler for: ${messageType}`);
  }

  /**
   * Route an incoming message to its handler
   *
   * @param message - The message to route
   * @param sender - The message sender
   * @returns Promise that resolves with response
   */
  async route(
    message: Message,
    sender: chrome.runtime.MessageSender
  ): Promise<ResponseMessage> {
    const handler = this.handlers.get(message.type);

    if (!handler) {
      console.error(
        `[MessageRouter] No handler registered for message type: ${message.type}`
      );

      return this.createErrorResponse(
        (message as RequestMessage).requestId,
        "NO_HANDLER",
        `No handler registered for message type: ${message.type}`
      );
    }

    try {
      console.log(
        `[MessageRouter] Routing message: ${message.type}`,
        message
      );

      const response = await handler(message as RequestMessage, sender);

      console.log(
        `[MessageRouter] Response for ${message.type}:`,
        response
      );

      return response;
    } catch (error) {
      console.error(
        `[MessageRouter] Error handling message ${message.type}:`,
        error
      );

      return this.createErrorResponse(
        (message as RequestMessage).requestId,
        "HANDLER_ERROR",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? { stack: error.stack } : undefined
      );
    }
  }

  /**
   * Initialize the message router (call once in background script)
   */
  initialize() {
    if (this.isInitialized) {
      console.warn("[MessageRouter] Already initialized");
      return;
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Route the message
      this.route(message, sender)
        .then(sendResponse)
        .catch((error) => {
          console.error("[MessageRouter] Fatal error in route:", error);
          sendResponse(
            this.createErrorResponse(
              message.requestId,
              "FATAL_ERROR",
              "Fatal error in message routing"
            )
          );
        });

      // Return true to indicate async response
      return true;
    });

    this.isInitialized = true;
    console.log("[MessageRouter] Initialized");
  }

  /**
   * Get list of registered message types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private createErrorResponse(
    requestId: string,
    code: string,
    message: string,
    details?: any
  ): ErrorResponse {
    return {
      type: "ERROR_RESPONSE" as any,
      requestId,
      success: false,
      error: {
        code,
        message,
        details,
      },
    };
  }
}

// Create singleton instance
export const messageRouter = new MessageRouter();
```

### Step 4: Create Message Handlers

Create `src/background/handlers/GetTabsHandler.ts`:

```typescript
import type {
  GetTabsRequest,
  GetTabsResponse,
} from "@/core/messages/types";
import type { MessageHandler } from "../MessageRouter";
import { tabsService } from "@/services/TabsService";

/**
 * Handler for GET_TABS_REQUEST
 *
 * Queries tabs based on filters and returns metadata
 */
export const GetTabsHandler: MessageHandler<GetTabsRequest> = async (
  message,
  sender
) => {
  const { filters = {} } = message;

  // Use service to get tabs
  const tabs = await tabsService.query(filters);

  const response: GetTabsResponse = {
    type: "GET_TABS_RESPONSE",
    requestId: message.requestId,
    success: true,
    tabs: tabs.map((tab) => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      active: tab.active,
      groupId: tab.groupId,
      windowId: tab.windowId,
      index: tab.index,
    })),
  };

  return response;
};
```

### Step 5: Register Handlers in Background

Update `src/background.ts`:

```typescript
import { crx, type CrxApplication } from "playwright-crx";
import { messageRouter } from "./background/MessageRouter";

// Import all handlers
import { GetTabsHandler } from "./background/handlers/GetTabsHandler";
import { CloseTabsHandler } from "./background/handlers/CloseTabsHandler";
import { GetPageContentHandler } from "./background/handlers/GetPageContentHandler";
// ... more handlers

(async () => {
  let crxApp: CrxApplication | null = null;

  try {
    crxApp = await crx.start({ slowMo: 50 });
  } catch (e) {
    console.error("Error starting crx:", e);
  }

  // Register all message handlers
  messageRouter.register("GET_TABS_REQUEST", GetTabsHandler);
  messageRouter.register("CLOSE_TABS_REQUEST", CloseTabsHandler);
  messageRouter.register("GET_PAGE_CONTENT_REQUEST", GetPageContentHandler);
  // ... more registrations

  // Initialize router (sets up onMessage listener)
  messageRouter.initialize();

  // Other background script setup
  chrome.runtime.onInstalled.addListener(() => {
    if (chrome.sidePanel?.setPanelBehavior) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
  });

  console.log("[Background] Initialized");
  console.log("[Background] Registered message types:", messageRouter.getRegisteredTypes());
})();
```

---

## Message Types Catalog

Here's a complete catalog of all message types needed for the current application:

| Category | Request | Response | Purpose |
|----------|---------|----------|---------|
| **Tabs** | `GET_TABS_REQUEST` | `GET_TABS_RESPONSE` | Query tabs with filters |
| | `CREATE_TAB_REQUEST` | `CREATE_TAB_RESPONSE` | Open new tab |
| | `CLOSE_TABS_REQUEST` | `CLOSE_TABS_RESPONSE` | Close tabs by IDs |
| | `GROUP_TABS_REQUEST` | `GROUP_TABS_RESPONSE` | Group tabs |
| | `GET_TAB_GROUPS_REQUEST` | `GET_TAB_GROUPS_RESPONSE` | Get all tab groups |
| **Page** | `GET_PAGE_CONTENT_REQUEST` | `GET_PAGE_CONTENT_RESPONSE` | Get page HTML/text |
| | `GET_DOM_SNAPSHOT_REQUEST` | `GET_DOM_SNAPSHOT_RESPONSE` | Get Playwright snapshot |
| **Scripting** | `EXECUTE_SCRIPT_REQUEST` | `EXECUTE_SCRIPT_RESPONSE` | Run script in tab |
| | `INJECT_INSPECTOR_REQUEST` | `INJECT_INSPECTOR_RESPONSE` | Inject element inspector |
| **Tools** | `EXECUTE_TOOL_REQUEST` | `EXECUTE_TOOL_RESPONSE` | Execute a tool |
| | `GET_TOOLS_REQUEST` | `GET_TOOLS_RESPONSE` | List available tools |
| **Events** | - | `TAB_ACTIVATED_EVENT` | Tab became active |
| | - | `TAB_CREATED_EVENT` | New tab created |
| | - | `TAB_REMOVED_EVENT` | Tab closed |

---

## Usage Patterns

### Pattern 1: Request/Response (UI → Background)

**In Side Panel:**

```typescript
import { MessageBus } from "@/core/messages/MessageBus";
import type { GetTabsRequest, GetTabsResponse } from "@/core/messages/types";

async function loadTabs() {
  try {
    const response = await MessageBus.send<GetTabsRequest, GetTabsResponse>({
      type: "GET_TABS_REQUEST",
      filters: { currentWindow: true },
    });

    console.log("Tabs:", response.tabs);
    return response.tabs;
  } catch (error) {
    console.error("Failed to get tabs:", error);
    throw error;
  }
}
```

### Pattern 2: Event Subscription (Listen to Background)

**In Side Panel:**

```typescript
import { MessageBus } from "@/core/messages/MessageBus";
import type { TabActivatedEvent } from "@/core/messages/types";
import { useEffect } from "react";

function MyComponent() {
  useEffect(() => {
    // Subscribe to tab activation events
    const unsubscribe = MessageBus.subscribe<TabActivatedEvent>(
      "TAB_ACTIVATED_EVENT",
      (event) => {
        console.log("Tab activated:", event.tabId);
        // Update UI accordingly
      }
    );

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  return <div>...</div>;
}
```

### Pattern 3: Event Broadcasting (Background → All)

**In Background:**

```typescript
import { MessageBus } from "@/core/messages/MessageBus";
import type { TabActivatedEvent } from "@/core/messages/types";

// Listen to Chrome event
chrome.tabs.onActivated.addListener((activeInfo) => {
  // Broadcast to all UI contexts
  MessageBus.broadcast<TabActivatedEvent>({
    type: "TAB_ACTIVATED_EVENT",
    tabId: activeInfo.tabId,
    windowId: activeInfo.windowId,
  });
});
```

### Pattern 4: Custom Hook for Tool Execution

**Create `src/hooks/useToolExecution.ts`:**

```typescript
import { useState, useCallback } from "react";
import { MessageBus } from "@/core/messages/MessageBus";
import type {
  ExecuteToolRequest,
  ExecuteToolResponse,
} from "@/core/messages/types";

export function useToolExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeTool = useCallback(
    async (toolName: string, input: any): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const response = await MessageBus.send<
          ExecuteToolRequest,
          ExecuteToolResponse
        >({
          type: "EXECUTE_TOOL_REQUEST",
          toolName,
          input,
        });

        return response.output;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { executeTool, loading, error };
}

// Usage in component:
// const { executeTool, loading } = useToolExecution();
// const result = await executeTool("close_tabs", { tabIds: [1, 2, 3] });
```

---

## Error Handling

### Error Types

All errors follow a consistent structure:

```typescript
interface ErrorResponse {
  type: "ERROR_RESPONSE";
  requestId: string;
  success: false;
  error: {
    code: string;        // Machine-readable error code
    message: string;     // Human-readable message
    details?: any;       // Additional context
  };
}
```

### Standard Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `NO_HANDLER` | No handler registered for message type | Check message type spelling |
| `HANDLER_ERROR` | Handler threw an exception | Check handler implementation |
| `TIMEOUT` | Request timed out | Increase timeout or check background |
| `VALIDATION_ERROR` | Input validation failed | Check request payload |
| `PERMISSION_ERROR` | Missing required permission | Check manifest permissions |
| `NOT_FOUND` | Resource not found (e.g., tab) | Check if resource exists |
| `FATAL_ERROR` | Unexpected fatal error | Report bug |

### Error Handling Best Practices

```typescript
// ✅ Good: Specific error handling
try {
  const tabs = await MessageBus.send<GetTabsRequest, GetTabsResponse>({
    type: "GET_TABS_REQUEST",
  });
} catch (error) {
  if ((error as any).code === "TIMEOUT") {
    console.warn("Request timed out, retrying...");
    // Retry logic
  } else if ((error as any).code === "PERMISSION_ERROR") {
    alert("Extension needs permission to access tabs");
  } else {
    console.error("Unexpected error:", error);
    // Generic error handling
  }
}

// ❌ Bad: Generic catch-all
try {
  await MessageBus.send(...);
} catch (error) {
  console.error(error); // Not helpful
}
```

---

## Testing Strategy

### Unit Tests for MessageBus

```typescript
// src/core/messages/__tests__/MessageBus.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MessageBus } from "../MessageBus";

describe("MessageBus", () => {
  beforeEach(() => {
    // Mock chrome.runtime
    global.chrome = {
      runtime: {
        sendMessage: vi.fn(),
        onMessage: {
          addListener: vi.fn(),
        },
      },
    } as any;
  });

  it("should send message with requestId", async () => {
    const mockSendMessage = vi.fn((msg, callback) => {
      callback({ success: true, requestId: msg.requestId });
    });
    chrome.runtime.sendMessage = mockSendMessage;

    await MessageBus.send({
      type: "GET_TABS_REQUEST",
    });

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "GET_TABS_REQUEST",
        requestId: expect.any(String),
      }),
      expect.any(Function)
    );
  });

  it("should timeout after specified duration", async () => {
    chrome.runtime.sendMessage = vi.fn(); // Never responds

    await expect(
      MessageBus.send({ type: "GET_TABS_REQUEST" }, 100)
    ).rejects.toThrow("Request timeout");
  });

  it("should handle subscription and event broadcasting", () => {
    const handler = vi.fn();

    const unsubscribe = MessageBus.subscribe("TAB_ACTIVATED_EVENT", handler);

    // Simulate receiving event
    MessageBus["handleEvent"]({
      type: "TAB_ACTIVATED_EVENT",
      tabId: 123,
    });

    expect(handler).toHaveBeenCalledWith({
      type: "TAB_ACTIVATED_EVENT",
      tabId: 123,
    });

    unsubscribe();
  });
});
```

### Integration Tests

```typescript
// tests/integration/message-bus.test.ts
import { test, expect } from "@playwright/test";

test("message bus request/response flow", async ({ page }) => {
  // Load extension
  // Send message from content script
  // Verify response
});
```

---

## Migration Path

### Phase 1: Parallel Implementation (Week 1)

1. Implement new message bus alongside old system
2. Migrate one simple message type (GET_TABS_REQUEST)
3. Verify both systems work

### Phase 2: Gradual Migration (Week 2-3)

1. Migrate message types one by one
2. Update senders and handlers
3. Test each migration

**Migration Checklist per Message:**

- [ ] Define request/response types in `types.ts`
- [ ] Create handler in `background/handlers/`
- [ ] Register handler in `background.ts`
- [ ] Update sender to use `MessageBus.send()`
- [ ] Test end-to-end
- [ ] Remove old code

### Phase 3: Cleanup (Week 4)

1. Remove old message handling code
2. Delete `messageHandlers.ts`
3. Update documentation
4. Add E2E tests

---

## Performance Considerations

### Request Correlation Overhead

- `requestId` generation: ~0.1ms (nanoid)
- Map lookup: O(1), negligible
- Total overhead: < 1ms per request

### Memory Usage

- Each pending request: ~100 bytes
- Max concurrent requests: ~100
- Total memory: < 10KB (negligible)

### Timeout Management

- Timeouts use native setTimeout (no polling)
- Automatic cleanup on response or timeout
- No memory leaks

---

## Debugging Tips

### Enable Debug Logging

```typescript
// In background.ts
messageRouter.initialize();

// Log all registered handlers
console.log("Registered handlers:", messageRouter.getRegisteredTypes());

// In UI context
console.log("MessageBus debug:", MessageBus.getDebugInfo());
```

### Trace Request Flow

```typescript
// Add middleware logging
const originalSend = MessageBus.send;
MessageBus.send = function(...args) {
  console.log("[MessageBus] Sending:", args[0].type);
  return originalSend.apply(this, args).then((response) => {
    console.log("[MessageBus] Received:", response);
    return response;
  });
};
```

### Chrome DevTools Network Tab

Messages won't show in Network tab, but you can:
1. Use console.log in background and UI
2. Use Chrome extension inspector
3. Add breakpoints in handlers

---

## Conclusion

The Message Bus architecture provides:

✅ **Type safety** - Catch errors at compile time
✅ **Clear contracts** - Request/response pairs are explicit
✅ **Better DX** - async/await instead of callbacks
✅ **Debuggability** - Request IDs for tracing
✅ **Maintainability** - Centralized routing
✅ **Extensibility** - Easy to add new message types

This foundation enables all other refactoring work. Once the message bus is in place, services and tools can be refactored with confidence.

---

**Next Steps:**
1. Review this design with team
2. Start implementation with Phase 1
3. Migrate one message type as proof-of-concept
4. Iterate and gather feedback

**Related Documents:**
- [Service Layer Architecture](./SERVICE_LAYER_ARCHITECTURE.md)
- [Tool System Guide](./TOOL_SYSTEM_GUIDE.md)
