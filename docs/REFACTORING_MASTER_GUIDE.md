# Chrome Extension Refactoring Master Guide

**Project:** Browser Assistant - AI Agent Chrome Extension
**Author:** Lead Engineering Team
**Date:** 2025-11-18
**Version:** 1.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Technical Debt Inventory](#technical-debt-inventory)
4. [Refactoring Strategy & Principles](#refactoring-strategy--principles)
5. [Target Architecture](#target-architecture)
6. [Execution Contexts in Chrome Extensions](#execution-contexts-in-chrome-extensions)
7. [Phase-by-Phase Implementation Plan](#phase-by-phase-implementation-plan)
8. [Migration Checklist](#migration-checklist)
9. [Related Documentation](#related-documentation)

---

## Executive Summary

This document serves as the **master reference** for a comprehensive refactoring initiative aimed at transforming a prototype Chrome extension into a production-ready, maintainable, and scalable architecture.

### The Problem

The current codebase has grown organically from a simple prototype to a feature-rich browser-based AI agent. This growth has resulted in:

- **Scattered responsibilities** across execution contexts
- **Ad-hoc message passing** without consistent patterns
- **Mixed concerns** in component files
- **Tight coupling** between UI, business logic, and browser APIs
- **Difficult debugging** due to unclear data flow
- **Hard to extend** with new features or tools

### The Solution

A **layered, modular architecture** with:

- **Clear separation of concerns** across layers (Presentation, Application, Domain, Infrastructure)
- **Robust message bus** with type-safe contracts
- **Service-oriented background script** handling all privileged operations
- **Declarative tool system** with consistent execution patterns
- **Standardized error handling** and logging
- **Comprehensive testing strategy**

### Success Metrics

- **Reduced cognitive load**: Developers can understand any component in < 5 minutes
- **Faster feature development**: New tools can be added in < 30 minutes
- **Better debugging**: Message flow can be traced with console logs
- **Improved reliability**: Type safety catches errors at compile time
- **Easier onboarding**: New developers can contribute within days

---

## Current Architecture Analysis

### File Structure

```
src/
├── background.ts              # Main background service worker
├── bg.ts                      # Background entry point (imports background.ts)
├── background/
│   └── messageHandlers.ts    # Array of message handler functions
├── content/
│   └── main.tsx              # Content script (keyboard shortcuts, message relay)
├── sidepanel/
│   ├── main.tsx              # Side panel entry
│   ├── App.tsx               # Root component
│   ├── ChatBotDemo.tsx       # Main chat interface (390 lines)
│   ├── evaluator.ts          # Tool execution logic
│   └── Inspector.ts          # Element inspector function
├── popup/
│   ├── main.tsx              # Popup entry
│   └── App.tsx               # Popup UI
├── tools/
│   ├── index.ts              # Tool registry (ToolStore)
│   ├── types.ts              # Tool interface
│   ├── Tabs.ts               # Tab management tools
│   ├── Page.ts               # Page content tools
│   ├── Scripting.ts          # Script execution tools
│   ├── History.ts            # Browser history tools
│   └── utils.ts              # Shared utilities
└── components/               # UI components (atomic & compound)
```

### Execution Contexts

Chrome extensions operate across **multiple isolated JavaScript execution contexts**:

| Context | File | Purpose | Capabilities | Limitations |
|---------|------|---------|--------------|-------------|
| **Background Service Worker** | `src/bg.ts`, `src/background.ts` | Central event hub, message routing, privileged operations | Full Chrome API access, persistent state (service worker lifecycle) | No DOM access, can be terminated by browser |
| **Content Script** | `src/content/main.tsx` | Bridge between page and extension | Limited Chrome API, DOM access | Isolated from page JS, limited permissions |
| **Side Panel** | `src/sidepanel/*.tsx` | Main UI for chat interface | Chrome API via messages, React UI | No direct tab manipulation |
| **Popup** | `src/popup/*.tsx` | Quick access UI | Chrome API via messages, React UI | Closes when focus lost |
| **Injected Scripts** | `public/injector/runner.js` | Execute in page context | Full page access, can modify page | No Chrome API access |

### Current Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SIDE PANEL (UI)                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ ChatBotDemo.tsx                                         │    │
│  │  - useChat hook (AI SDK)                               │    │
│  │  - onToolCall → evaluateToolCall()                     │    │
│  └────────────┬───────────────────────────────────────────┘    │
│               │                                                  │
│               ▼                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ evaluator.ts                                            │    │
│  │  - Get tool from ToolStore                             │    │
│  │  - Validate input with Zod                             │    │
│  │  - Execute tool.execute()                              │    │
│  └────────────┬───────────────────────────────────────────┘    │
└───────────────┼──────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          TOOL LAYER                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Tool.execute() (e.g., get_page_content)                │    │
│  │  - Some tools: Direct Chrome API calls                 │    │
│  │  - Some tools: chrome.runtime.sendMessage()            │    │
│  └────────────┬───────────────────────────────────────────┘    │
└───────────────┼──────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKGROUND SERVICE WORKER                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ background.ts                                           │    │
│  │  - chrome.runtime.onMessage.addListener()              │    │
│  │  - Loop through messageHandlers array                  │    │
│  │  - Each handler checks message.action                  │    │
│  └────────────┬───────────────────────────────────────────┘    │
│               │                                                  │
│               ▼                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ messageHandlers.ts                                      │    │
│  │  - handleGetPageContent (uses playwright-crx)          │    │
│  │  - handleGetDomSnapshot (uses playwright-crx)          │    │
│  │  - handleOpenNewTab (uses playwright-crx)              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Issues Identified

#### 1. Mixed Messaging Patterns

**Problem:** Tools use different strategies to interact with background:

```typescript
// Pattern 1: Direct Chrome API (in Tool)
const close_tabs: Tool = {
  execute: async ({ tabIds }) => {
    chrome.tabs.remove(tabIds);  // Direct API call
    return "Tabs closed";
  }
};

// Pattern 2: Message to background (in Tool)
const get_page_content: Tool = {
  execute: async ({ tabId }) => {
    const response = await chrome.runtime.sendMessage({
      action: "get_page_dom_snapshot",
      tabId,
    });
    return response._snap;
  }
};
```

**Impact:** Inconsistent patterns make it hard to understand capabilities and debug issues.

#### 2. Redundant Background Entry Point

**Problem:** `bg.ts` just imports `background.ts`:

```typescript
// bg.ts (unnecessary layer)
import { crx, type CrxApplication } from "playwright-crx";
import { messageHandlers } from "./background/messageHandlers";
// ... all the logic
```

**Impact:** Adds confusion without clear benefit.

#### 3. Tight Coupling in ChatBotDemo

**Problem:** 390-line component mixing:
- UI rendering (messages, inputs, attachments)
- AI SDK integration
- Tool evaluation coordination
- Inspector injection
- State management

**Impact:** Hard to test, reuse, or modify individual concerns.

#### 4. Type-Unsafe Message Contracts

**Problem:** Messages use `any` types:

```typescript
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // message is 'any' - no type safety
  for (const handler of messageHandlers) {
    const handled = handler(message, sendResponse, crxApp);
  }
});
```

**Impact:** Runtime errors, unclear contracts, hard to refactor.

#### 5. Error Handling Inconsistency

**Problem:** Different error handling strategies:
- Some tools throw errors
- Some return error strings
- Some log and continue
- Background handlers return `{ success: false, error: string }`

**Impact:** Unpredictable failure modes, difficult debugging.

#### 6. Tool Registration is Static

**Problem:** Tools are registered in a manual array:

```typescript
const registeredTools: Tool<ZodType | null>[] = [
  get_groups,
  get_tabs,
  close_tabs,
  // ... must manually add each tool
];
```

**Impact:** Easy to forget, no hot-reloading, coupling.

---

## Technical Debt Inventory

### Critical (Blocks Scalability)

- ✅ **No unified message bus architecture**
  - Messages are ad-hoc strings
  - No request/response type safety
  - Difficult to trace message flow

- ✅ **Playwright-crx integration unclear**
  - Used only for a few operations
  - Mixed with native Chrome APIs
  - Adds complexity and confusion

- ✅ **No service layer abstraction**
  - Tools directly call Chrome APIs OR send messages
  - Business logic scattered between UI and background

### High (Impacts Maintainability)

- ✅ **Component responsibility overload**
  - ChatBotDemo.tsx does too much
  - Evaluator is tightly coupled to UI

- ✅ **Inconsistent async patterns**
  - Mixed promise/callback styles
  - Unclear error propagation

- ✅ **No logging/monitoring strategy**
  - Console.log scattered everywhere
  - No structured logging for debugging

### Medium (Hinders Feature Development)

- ✅ **Tool system lacks metadata**
  - No versioning
  - No capability discovery
  - No documentation generation

- ✅ **No state management strategy**
  - Each component manages own state
  - No shared state between contexts

- ✅ **Limited testing infrastructure**
  - No unit tests
  - No integration tests
  - Playwright available but not used

### Low (Quality of Life)

- ⚠️ **Commented-out code**
  - Old implementations left in files
  - Creates confusion

- ⚠️ **Inconsistent naming conventions**
  - snake_case vs camelCase
  - Unclear file naming

---

## Refactoring Strategy & Principles

### Core Principles

#### 1. Separation of Concerns (SoC)

Each module should have **one clear responsibility**:

```
Presentation Layer (UI)    → Render, user interaction, visual state
Application Layer (Logic)  → Orchestration, workflows, tool coordination
Domain Layer (Business)    → Tools, rules, validations
Infrastructure Layer (I/O) → Chrome APIs, messages, external services
```

#### 2. Dependency Inversion

High-level modules should **not depend on low-level modules**. Both should depend on **abstractions**.

```typescript
// ❌ Bad: Direct dependency
class ToolExecutor {
  execute(tool: Tool) {
    chrome.tabs.query({}, ...);  // Direct Chrome API
  }
}

// ✅ Good: Depend on abstraction
interface IBrowserService {
  getTabs(): Promise<Tab[]>;
}

class ToolExecutor {
  constructor(private browser: IBrowserService) {}
  execute(tool: Tool) {
    this.browser.getTabs();  // Abstraction
  }
}
```

#### 3. Single Source of Truth

- **One registry** for tools
- **One service** for each Chrome API namespace
- **One message bus** for all inter-context communication

#### 4. Type Safety First

Use TypeScript fully:
- Strict mode enabled
- No `any` types in public APIs
- Discriminated unions for message types
- Zod for runtime validation

#### 5. Explicit Over Implicit

Make data flow **visible and traceable**:

```typescript
// ❌ Implicit: Where does this go?
chrome.runtime.sendMessage({ action: "do-something" });

// ✅ Explicit: Clear contract
MessageBus.send(new GetTabsRequest(tabIds));
```

---

## Target Architecture

### Layered Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   Side Panel     │  │      Popup       │  │  Content Script  │ │
│  │   (React UI)     │  │   (React UI)     │  │  (DOM Bridge)    │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
└───────────┼─────────────────────┼─────────────────────┼────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Message Bus                             │  │
│  │  - Type-safe message contracts                               │  │
│  │  - Request/Response pattern                                  │  │
│  │  - Event broadcasting                                        │  │
│  └────────────────────────────┬─────────────────────────────────┘  │
└───────────────────────────────┼────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DOMAIN LAYER                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  Tool Registry   │  │  Tool Executor   │  │  Tool Schemas    │ │
│  │  (Discovery)     │  │  (Orchestration) │  │  (Validation)    │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  TabsService     │  │  PageService     │  │ ScriptingService │ │
│  │  (chrome.tabs)   │  │  (DOM access)    │  │  (executeScript) │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ HistoryService   │  │  StorageService  │  │  PlaywrightSvc   │ │
│  │ (chrome.history) │  │  (chrome.storage)│  │  (automation)    │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Message Bus Architecture

The **Message Bus** is the central nervous system connecting all contexts.

#### Key Components

1. **Message Types** (Discriminated Unions)

```typescript
// src/core/messages/types.ts
export type Message =
  | GetTabsRequest
  | GetTabsResponse
  | ExecuteToolRequest
  | ExecuteToolResponse
  | PageContentRequest
  | PageContentResponse
  | ErrorMessage
  | EventMessage;

export interface GetTabsRequest {
  type: "GET_TABS_REQUEST";
  requestId: string;
  filters?: TabQueryFilters;
}

export interface GetTabsResponse {
  type: "GET_TABS_RESPONSE";
  requestId: string;
  tabs: TabMetadata[];
}
```

2. **Message Bus Client** (Used in UI contexts)

```typescript
// src/core/messages/MessageBus.ts
export class MessageBus {
  private static pendingRequests = new Map<string, PendingRequest>();

  static async send<TRequest extends Message, TResponse extends Message>(
    request: TRequest
  ): Promise<TResponse> {
    const requestId = nanoid();
    const requestWithId = { ...request, requestId };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      chrome.runtime.sendMessage(requestWithId, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });

      // Timeout after 30s
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Request timeout: ${request.type}`));
        }
      }, 30000);
    });
  }

  static subscribe<T extends Message>(
    messageType: T["type"],
    handler: (message: T) => void
  ): () => void {
    const listener = (message: any) => {
      if (message.type === messageType) {
        handler(message);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }
}
```

3. **Message Router** (Used in background)

```typescript
// src/background/MessageRouter.ts
export class MessageRouter {
  private handlers = new Map<string, MessageHandler>();

  register<T extends Message>(
    messageType: T["type"],
    handler: MessageHandler<T>
  ) {
    this.handlers.set(messageType, handler);
  }

  async route(message: Message, sender: chrome.runtime.MessageSender): Promise<any> {
    const handler = this.handlers.get(message.type);

    if (!handler) {
      throw new Error(`No handler for message type: ${message.type}`);
    }

    return handler(message, sender);
  }

  initialize() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.route(message, sender)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            type: "ERROR_RESPONSE",
            requestId: message.requestId,
            error: error.message,
          });
        });
      return true; // Async response
    });
  }
}
```

### Service Layer Architecture

Services encapsulate **all Chrome API interactions** and provide clean interfaces.

```typescript
// src/services/TabsService.ts
export interface ITabsService {
  query(filters: TabQueryFilters): Promise<TabMetadata[]>;
  get(tabId: number): Promise<TabMetadata>;
  create(options: CreateTabOptions): Promise<TabMetadata>;
  close(tabIds: number[]): Promise<void>;
  group(tabIds: number[], options: GroupOptions): Promise<number>;
}

export class TabsService implements ITabsService {
  async query(filters: TabQueryFilters = {}): Promise<TabMetadata[]> {
    const tabs = await chrome.tabs.query(filters);
    return tabs.map(this.mapToMetadata);
  }

  async close(tabIds: number[]): Promise<void> {
    await chrome.tabs.remove(tabIds);
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
}
```

### Tool System Architecture

Tools become **pure business logic** that depend on service abstractions.

```typescript
// src/tools/domain/CloseTabsTool.ts
export class CloseTabsTool implements ITool {
  name = "close_tabs";
  description = "Close tabs by their IDs";
  version = "1.0.0";

  inputSchema = z.object({
    tabIds: z.array(z.number()).min(1),
  });

  constructor(private tabsService: ITabsService) {}

  async execute(input: z.infer<typeof this.inputSchema>): Promise<ToolResult> {
    const { tabIds } = this.inputSchema.parse(input);

    await this.tabsService.close(tabIds);

    return {
      success: true,
      data: `Closed ${tabIds.length} tab(s)`,
    };
  }
}
```

---

## Execution Contexts in Chrome Extensions

Understanding Chrome extension execution contexts is **critical** for proper architecture.

### Context Isolation

Each context has **its own JavaScript environment**:

```
┌─────────────────────┐      ┌─────────────────────┐
│  Background Worker  │      │    Content Script   │
│  window !== page    │      │  window !== page    │
│  globals isolated   │      │  globals isolated   │
└──────────┬──────────┘      └──────────┬──────────┘
           │                             │
           └──────────┬──────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │  Message Passing │
            │  (chrome.runtime)│
            └──────────────────┘
```

### Capabilities Matrix

| Capability | Background | Content | Side Panel | Popup | Injected |
|------------|-----------|---------|-----------|-------|----------|
| Chrome APIs (full) | ✅ | ❌ | ⚠️ Limited | ⚠️ Limited | ❌ |
| DOM Access | ❌ | ✅ | ✅ (own) | ✅ (own) | ✅ |
| Page JS Access | ❌ | ❌ | ❌ | ❌ | ✅ |
| Persistent | ✅ | ✅ | ❌ | ❌ | ❌ |
| Network Requests | ✅ | ⚠️ CORS | ⚠️ CORS | ⚠️ CORS | ✅ |
| Storage API | ✅ | ✅ | ✅ | ✅ | ❌ |

### Communication Patterns

#### 1. UI → Background (Request/Response)

```typescript
// In Side Panel
const tabs = await MessageBus.send<GetTabsRequest, GetTabsResponse>({
  type: "GET_TABS_REQUEST",
  filters: { active: true },
});
```

#### 2. Background → UI (Event Broadcast)

```typescript
// In Background
chrome.tabs.onActivated.addListener((info) => {
  MessageBus.broadcast({
    type: "TAB_ACTIVATED_EVENT",
    tabId: info.tabId,
  });
});

// In Side Panel
MessageBus.subscribe("TAB_ACTIVATED_EVENT", (event) => {
  console.log("Tab activated:", event.tabId);
});
```

#### 3. Content Script → Background → UI (Relay)

```typescript
// In Content Script (page bridge)
document.addEventListener("click", () => {
  chrome.runtime.sendMessage({
    type: "PAGE_INTERACTION_EVENT",
    action: "click",
  });
});

// In Background (relay)
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "PAGE_INTERACTION_EVENT") {
    // Broadcast to all UI contexts
    chrome.runtime.sendMessage(msg);
  }
});
```

#### 4. Page → Content Script → Background (PostMessage Bridge)

```typescript
// In Injected Script (page context)
window.postMessage({
  type: "ELEMENT_INSPECTOR_SELECTED",
  elementHTML: el.outerHTML,
}, "*");

// In Content Script (bridge)
window.addEventListener("message", (event) => {
  if (event.data.type === "ELEMENT_INSPECTOR_SELECTED") {
    chrome.runtime.sendMessage({
      type: "ELEMENT_INSPECTOR_RESULT",
      ...event.data,
    });
  }
});
```

---

## Phase-by-Phase Implementation Plan

### Phase 0: Preparation (No Code Changes)

**Goal:** Set up infrastructure and documentation

- ✅ Create `/docs` folder structure
- ✅ Document current architecture (this file)
- ✅ Set up TypeScript strict mode
- ✅ Create architectural decision records (ADRs)
- Add linting rules for consistency

### Phase 1: Message Bus Foundation (Week 1)

**Goal:** Establish type-safe messaging layer

**Tasks:**

1. Create message type definitions
   - `src/core/messages/types.ts`
   - Define all request/response pairs
   - Use discriminated unions

2. Implement MessageBus client
   - `src/core/messages/MessageBus.ts`
   - Request/response with timeouts
   - Event subscription

3. Implement MessageRouter in background
   - `src/background/MessageRouter.ts`
   - Handler registration
   - Error handling

4. Migrate one simple message type
   - Pick `GET_TABS_REQUEST` as proof-of-concept
   - Update sender and receiver
   - Test thoroughly

**Acceptance Criteria:**
- All messages have TypeScript types
- No `any` in message handling
- Request/response pattern works end-to-end

**See:** `docs/MESSAGE_BUS_ARCHITECTURE.md`

### Phase 2: Service Layer (Week 2)

**Goal:** Extract Chrome API interactions into services

**Tasks:**

1. Create service interfaces
   - `src/services/interfaces/`
   - Define contracts for each Chrome API namespace

2. Implement services
   - `TabsService`, `PageService`, `ScriptingService`, etc.
   - Handle errors consistently
   - Add logging

3. Register services in background
   - `src/background/services/ServiceRegistry.ts`
   - Dependency injection container

4. Update message handlers to use services
   - Replace direct Chrome API calls
   - Handler just orchestrates service calls

**Acceptance Criteria:**
- All Chrome API calls go through services
- Services are testable (interfaces)
- Background handlers are thin orchestrators

**See:** `docs/SERVICE_LAYER_ARCHITECTURE.md`

### Phase 3: Tool System Refactoring (Week 3)

**Goal:** Decouple tools from infrastructure

**Tasks:**

1. Refactor tool interface
   - Add `version`, `category`, `examples`
   - Standardize `ToolResult` type

2. Move tools to domain layer
   - `src/tools/domain/` for implementations
   - Inject services via constructor

3. Create ToolRegistry
   - Auto-discovery from folder
   - Metadata indexing
   - Version management

4. Update ToolExecutor
   - Handle errors consistently
   - Add telemetry hooks
   - Support tool middleware

**Acceptance Criteria:**
- Tools are pure business logic
- New tools can be added without touching registry
- Tool execution is traceable

**See:** `docs/TOOL_SYSTEM_GUIDE.md`

### Phase 4: UI Layer Refactoring (Week 4)

**Goal:** Break down monolithic components

**Tasks:**

1. Extract ChatBotDemo concerns
   - Create `ChatContainer` (layout)
   - Create `MessageList` (rendering)
   - Create `ToolExecutionPanel` (tool UI)
   - Create `PromptInputContainer` (input logic)

2. Create hooks for common patterns
   - `useToolExecution`
   - `useChatMessages`
   - `useInspector`

3. Implement view models
   - Separate UI state from business logic
   - Use context for shared state

**Acceptance Criteria:**
- No component > 200 lines
- Each component has single responsibility
- UI logic separated from business logic

### Phase 5: Error Handling & Logging (Week 5)

**Goal:** Unified error handling and observability

**Tasks:**

1. Create error hierarchy
   - `ToolExecutionError`, `MessageBusError`, etc.
   - Include context and severity

2. Implement structured logging
   - `src/core/logging/Logger.ts`
   - Context-aware (include component, user action)
   - Levels: debug, info, warn, error

3. Add error boundaries
   - React error boundaries for UI
   - Try/catch in background handlers

4. Create error reporting UI
   - Show user-friendly error messages
   - Include "Report Issue" button

**Acceptance Criteria:**
- All errors are typed
- Logs are structured and filterable
- Users see helpful error messages

### Phase 6: Testing Infrastructure (Week 6)

**Goal:** Enable automated testing

**Tasks:**

1. Set up testing frameworks
   - Vitest for unit tests
   - Playwright for E2E tests

2. Write service tests
   - Mock Chrome APIs
   - Test error cases

3. Write tool tests
   - Mock service dependencies
   - Test input validation

4. Write UI component tests
   - Test user interactions
   - Test error states

**Acceptance Criteria:**
- 80% code coverage for services
- All tools have unit tests
- Critical user flows have E2E tests

### Phase 7: Documentation & Migration (Week 7)

**Goal:** Document everything and help team migrate

**Tasks:**

1. Generate API documentation
   - Use TypeDoc
   - Document all public interfaces

2. Create migration guides
   - "How to add a new tool"
   - "How to add a new message type"
   - "How to add a new service"

3. Record architecture decision records
   - Why these patterns?
   - What alternatives were considered?

4. Team training
   - Walkthrough sessions
   - Code review guidelines

**Acceptance Criteria:**
- All public APIs documented
- New developers can contribute in < 2 days
- Zero tribal knowledge

---

## Migration Checklist

Use this checklist to track refactoring progress:

### Message Bus
- [ ] Message types defined (`types.ts`)
- [ ] MessageBus client implemented
- [ ] MessageRouter implemented
- [ ] All existing messages migrated
- [ ] Type safety verified (no `any`)

### Services
- [ ] Service interfaces defined
- [ ] TabsService implemented
- [ ] PageService implemented
- [ ] ScriptingService implemented
- [ ] HistoryService implemented
- [ ] StorageService implemented
- [ ] PlaywrightService refactored
- [ ] ServiceRegistry implemented
- [ ] All handlers use services

### Tools
- [ ] Tool interface updated
- [ ] ToolRegistry with auto-discovery
- [ ] ToolExecutor refactored
- [ ] All tools migrated to domain layer
- [ ] Tools inject service dependencies
- [ ] Tool metadata complete

### UI
- [ ] ChatBotDemo split into components
- [ ] Custom hooks extracted
- [ ] View models implemented
- [ ] State management clarified

### Quality
- [ ] Error hierarchy defined
- [ ] Structured logging implemented
- [ ] Error boundaries added
- [ ] Unit tests added
- [ ] E2E tests added

### Documentation
- [ ] API docs generated
- [ ] Migration guides written
- [ ] ADRs recorded
- [ ] Team trained

---

## Related Documentation

- [Message Bus Architecture](./MESSAGE_BUS_ARCHITECTURE.md) - Deep dive into messaging patterns
- [Service Layer Architecture](./SERVICE_LAYER_ARCHITECTURE.md) - Service design and implementation
- [Tool System Guide](./TOOL_SYSTEM_GUIDE.md) - Creating and managing tools
- [UI Component Patterns](./UI_COMPONENT_PATTERNS.md) - React best practices
- [Testing Strategy](./TESTING_STRATEGY.md) - Testing approach and examples

---

## Appendix: Key Learnings

### On Chrome Extension Development

1. **Service workers are ephemeral** - Don't rely on in-memory state
2. **Message passing is asynchronous** - Always handle timeouts
3. **Content scripts are limited** - Use them as bridges only
4. **executeScript runs in isolation** - Need postMessage to communicate with page
5. **Permissions matter** - Request minimal, check before using

### On Refactoring

1. **Start with types** - Type safety catches 80% of issues
2. **Refactor in layers** - Don't try to change everything at once
3. **Test boundaries** - Focus tests on interfaces, not implementations
4. **Document decisions** - Future you will thank present you
5. **Incremental migration** - Both old and new patterns can coexist temporarily

### On Architecture

1. **Clarity > Cleverness** - Simple, obvious code beats clever abstractions
2. **Boundaries enable scale** - Clear layers allow parallel development
3. **Services > Utilities** - Stateful services better than stateless utils
4. **Types are documentation** - Good types reduce need for comments
5. **Conventions > Configuration** - Auto-discovery beats manual registration

---

**End of Master Guide**

Next steps: Read the component-specific guides for implementation details.
