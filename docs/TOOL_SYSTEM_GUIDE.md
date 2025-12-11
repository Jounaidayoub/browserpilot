# Tool System Refactoring Guide

**Component:** Domain Layer - Browser Automation Tools
**Priority:** High (Core Feature)
**Status:** Design Complete - Ready for Implementation
**Dependencies:** Message Bus, Service Layer

---

## Table of Contents

1. [Overview](#overview)
2. [Current Tool System Analysis](#current-tool-system-analysis)
3. [Problems with Current Approach](#problems-with-current-approach)
4. [Target Architecture](#target-architecture)
5. [Tool Interface Design](#tool-interface-design)
6. [Tool Implementation Guide](#tool-implementation-guide)
7. [Tool Registry & Discovery](#tool-registry--discovery)
8. [Tool Executor](#tool-executor)
9. [Tool Categories](#tool-categories)
10. [Testing Strategy](#testing-strategy)
11. [Migration Path](#migration-path)

---

## Overview

The **Tool System** is the core domain layer that provides browser automation capabilities to the AI agent. Tools are **declarative, type-safe functions** that the LLM can call to interact with the browser.

### Current Strengths

✅ **Zod validation** - Input schemas are well-defined
✅ **Modular design** - Each tool is a separate concern
✅ **Type-safe** - TypeScript interfaces
✅ **Clean tool interface** - name, description, schema, execute

### Areas for Improvement

⚠️ **Mixed infrastructure concerns** - Tools call Chrome APIs directly
⚠️ **Inconsistent patterns** - Some use services, some don't
⚠️ **Static registration** - Manual array of tools
⚠️ **Incomplete metadata** - Missing versioning, categories, examples
⚠️ **Tight coupling** - Tools know about messaging and Chrome APIs

---

## Current Tool System Analysis

### Current Tool Structure

From `src/tools/types.ts:3-13`:

```typescript
export interface Tool<ToolInput extends z.ZodType | null> {
  name: string;
  description: string;
  inputSchema: ToolInput;
  execute: (input: z.infer<ToolInput>) => Promise<string>;
}
```

### Current Tool Registration

From `src/tools/index.ts:23-38`:

```typescript
const registeredTools: Tool<ZodType | null>[] = [
  get_groups,
  get_tabs,
  close_tabs,
  group_tabs_by_ids,
  open_new_tab,
  // search_history,  // Commented out
  // get_current_time,  // Commented out
  run_script,
  get_tab_content_tool,
  get_page_content,
  get_page_dom_snapshot,
];

const ToolStore = new Map(registeredTools.map((tool) => [tool.name, tool]));
```

### Current Tool Execution

From `src/sidepanel/evaluator.ts:9-49`:

```typescript
export const evaluateToolCall = async (
  toolCall: InferUIMessageToolCall<UIMessage>,
  addToolResult: AddToolResultFn
) => {
  const tool = ToolStore.get(toolCall.toolName);

  if (!tool) {
    console.warn("Unknown tool:", toolCall.toolName);
    return;
  }

  try {
    const parsed = tool.inputSchema?.safeParse(toolCall.input);
    if (parsed && !parsed.success) {
      throw parsed.error;
    }
    const output = await tool.execute(parsed?.data);

    await addToolResult({
      tool: tool.name,
      toolCallId: toolCall.toolCallId,
      output,
    });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? formatZodIssues(error)
        : error instanceof Error
        ? error.message
        : String(error);

    console.error(`Tool ${tool.name} failed:`, error);

    await addToolResult({
      state: "output-error",
      tool: tool.name,
      toolCallId: toolCall.toolCallId,
      errorText: message,
    });
  }
};
```

---

## Problems with Current Approach

### 1. Infrastructure Leakage

Tools directly interact with Chrome APIs or send messages:

```typescript
// From src/tools/Tabs.ts:51-57
const close_tabs: Tool<typeof close_tabsType> = {
  name: "close_tabs",
  execute: async ({ tabIds }) => {
    chrome.tabs.query({}, () => {
      chrome.tabs.remove(tabIds);  // Direct Chrome API
    });
    return "Tabs closed with IDs: " + tabIds.join(", ");
  },
};

// From src/tools/Page.ts:71-84
const get_page_content: Tool<typeof get_page_contentInput> = {
  name: "get_page_content",
  execute: async ({ tabId }) => {
    const response = await chrome.runtime.sendMessage({  // Message passing
      action: "get_page_dom_snapshot",
      tabId,
    });
    // ...
  },
};
```

**Problem:** Tools should be pure business logic, not infrastructure.

### 2. Manual Registration

```typescript
const registeredTools: Tool<ZodType | null>[] = [
  get_groups,
  get_tabs,
  close_tabs,
  // ... must manually add each tool
];
```

**Problem:** Easy to forget, no auto-discovery, coupling.

### 3. Incomplete Metadata

Current tools lack:
- Version information
- Categories (tabs, page, scripting, etc.)
- Usage examples
- Permission requirements
- Deprecation warnings

### 4. Evaluator Coupling

From `src/sidepanel/evaluator.ts`:

```typescript
export const evaluateToolCall = async (
  toolCall: InferUIMessageToolCall<UIMessage>,  // Tight coupling to UI types
  addToolResult: AddToolResultFn
) => {
  // ...
};
```

**Problem:** Evaluator is coupled to UI layer types (from `ai` SDK). Should be domain-level.

### 5. Output Format Inconsistency

All tools return `string`:

```typescript
execute: (input: z.infer<ToolInput>) => Promise<string>;
```

But some return JSON strings, some return plain text:

```typescript
// JSON string
return JSON.stringify(await fetchTabGroups());

// Plain text
return "Tabs closed with IDs: " + tabIds.join(", ");
```

**Problem:** Inconsistent, hard to parse, loses type information.

---

## Target Architecture

### Layered Tool Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          UI LAYER                                   │
│  (ChatBotDemo, Tool UI Components)                                  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  AI SDK Integration                                            │ │
│  │  - onToolCall → ToolExecutor.execute()                        │ │
│  │  - Renders tool results                                        │ │
│  └────────────────────────┬──────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                               │
│  (Tool Orchestration)                                               │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  ToolExecutor                                                  │ │
│  │  - Validate input                                              │ │
│  │  - Execute tool                                                │ │
│  │  - Handle errors                                               │ │
│  │  - Log execution                                               │ │
│  └────────────────────────┬──────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                                  │
│  (Tool Implementations)                                             │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  ToolRegistry                                                  │ │
│  │  - Auto-discover tools                                         │ │
│  │  - Index by name/category                                      │ │
│  │  - Version management                                          │ │
│  └────────────────────────┬──────────────────────────────────────┘ │
│                           │                                          │
│                           ▼                                          │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Tool Implementations                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │ │
│  │  │CloseTabsTool │  │GetTabsTool   │  │RunScriptTool │       │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │ │
│  │  - Pure business logic                                         │ │
│  │  - Depends on service interfaces                               │ │
│  └────────────────────────┬──────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                              │
│  (Services)                                                         │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  TabsService, PageService, ScriptingService, etc.             │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tool Interface Design

### Enhanced Tool Interface

```typescript
// src/tools/types.ts

export interface ToolMetadata {
  name: string;
  description: string;
  version: string;
  category: ToolCategory;
  tags?: string[];
  deprecated?: boolean;
  deprecationMessage?: string;
  examples?: ToolExample[];
  permissions?: chrome.Permissions.Permissions[];
}

export enum ToolCategory {
  TABS = "tabs",
  PAGE = "page",
  SCRIPTING = "scripting",
  HISTORY = "history",
  STORAGE = "storage",
  NAVIGATION = "navigation",
  UTILITY = "utility",
}

export interface ToolExample {
  description: string;
  input: any;
  expectedOutput?: any;
}

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: ToolError;
  metadata?: {
    executionTime?: number;
    timestamp?: number;
    [key: string]: any;
  };
}

export interface ToolError {
  code: string;
  message: string;
  details?: any;
}

export interface ITool<TInput = any, TOutput = any> {
  // Metadata
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly category: ToolCategory;
  readonly tags?: string[];

  // Schema
  inputSchema: z.ZodType<TInput>;
  outputSchema?: z.ZodType<TOutput>;

  // Execution
  execute(input: TInput): Promise<ToolResult<TOutput>>;

  // Optional hooks
  onBeforeExecute?(input: TInput): Promise<void> | void;
  onAfterExecute?(result: ToolResult<TOutput>): Promise<void> | void;

  // Metadata access
  getMetadata(): ToolMetadata;
  getExamples(): ToolExample[];
}
```

### Base Tool Class

```typescript
// src/tools/base/BaseTool.ts

export abstract class BaseTool<TInput = any, TOutput = any>
  implements ITool<TInput, TOutput>
{
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly version: string;
  abstract readonly category: ToolCategory;
  readonly tags?: string[];

  abstract inputSchema: z.ZodType<TInput>;
  outputSchema?: z.ZodType<TOutput>;

  /**
   * Execute the tool
   * Subclasses must implement this
   */
  abstract execute(input: TInput): Promise<ToolResult<TOutput>>;

  /**
   * Lifecycle hooks (optional)
   */
  async onBeforeExecute?(input: TInput): Promise<void> {}
  async onAfterExecute?(result: ToolResult<TOutput>): Promise<void> {}

  /**
   * Get tool metadata
   */
  getMetadata(): ToolMetadata {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      category: this.category,
      tags: this.tags,
      examples: this.getExamples(),
    };
  }

  /**
   * Get usage examples (subclasses can override)
   */
  getExamples(): ToolExample[] {
    return [];
  }

  /**
   * Validate input (called automatically by executor)
   */
  validateInput(input: unknown): TInput {
    return this.inputSchema.parse(input);
  }

  /**
   * Create success result
   */
  protected success<T>(data: T, metadata?: any): ToolResult<T> {
    return {
      success: true,
      data,
      metadata,
    };
  }

  /**
   * Create error result
   */
  protected failure(code: string, message: string, details?: any): ToolResult {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
    };
  }
}
```

---

## Tool Implementation Guide

### Example: Close Tabs Tool

```typescript
// src/tools/domain/tabs/CloseTabsTool.ts

import { BaseTool } from "@/tools/base/BaseTool";
import { ToolCategory, type ToolResult, type ToolExample } from "@/tools/types";
import { z } from "zod";
import type { ITabsService } from "@/services/interfaces/ITabsService";

/**
 * CloseTabsTool - Close one or more browser tabs
 *
 * @category Tabs
 * @version 1.0.0
 */
export class CloseTabsTool extends BaseTool<
  { tabIds: number[] },
  { closedCount: number }
> {
  readonly name = "close_tabs";
  readonly description = "Close one or more browser tabs by their IDs";
  readonly version = "1.0.0";
  readonly category = ToolCategory.TABS;
  readonly tags = ["tabs", "management"];

  inputSchema = z.object({
    tabIds: z
      .array(z.number().positive())
      .min(1, "At least one tab ID is required")
      .max(100, "Cannot close more than 100 tabs at once"),
  });

  constructor(private tabsService: ITabsService) {
    super();
  }

  async execute(input: { tabIds: number[] }): Promise<ToolResult<{ closedCount: number }>> {
    const { tabIds } = input;

    try {
      // Validate tabs exist before closing
      const existingTabs = await this.tabsService.query({});
      const existingTabIds = new Set(existingTabs.map((t) => t.id));

      const validTabIds = tabIds.filter((id) => existingTabIds.has(id));
      const invalidTabIds = tabIds.filter((id) => !existingTabIds.has(id));

      if (validTabIds.length === 0) {
        return this.failure(
          "NO_VALID_TABS",
          "None of the specified tabs exist",
          { requestedIds: tabIds, invalidIds: invalidTabIds }
        );
      }

      // Close tabs via service
      await this.tabsService.close(validTabIds);

      return this.success(
        { closedCount: validTabIds.length },
        {
          invalidIds: invalidTabIds.length > 0 ? invalidTabIds : undefined,
        }
      );
    } catch (error) {
      return this.failure(
        "EXECUTION_FAILED",
        error instanceof Error ? error.message : "Failed to close tabs",
        { tabIds, error }
      );
    }
  }

  getExamples(): ToolExample[] {
    return [
      {
        description: "Close a single tab",
        input: { tabIds: [123] },
        expectedOutput: { closedCount: 1 },
      },
      {
        description: "Close multiple tabs",
        input: { tabIds: [123, 456, 789] },
        expectedOutput: { closedCount: 3 },
      },
    ];
  }
}
```

### Example: Get Tabs Tool

```typescript
// src/tools/domain/tabs/GetTabsTool.ts

import { BaseTool } from "@/tools/base/BaseTool";
import { ToolCategory, type ToolResult, type ToolExample } from "@/tools/types";
import { z } from "zod";
import type { ITabsService, TabMetadata } from "@/services/interfaces/ITabsService";

export class GetTabsTool extends BaseTool<
  { filters?: any },
  TabMetadata[]
> {
  readonly name = "get_tabs";
  readonly description = "Get all browser tabs, optionally filtered";
  readonly version = "1.0.0";
  readonly category = ToolCategory.TABS;

  inputSchema = z.object({
    filters: z
      .object({
        active: z.boolean().optional(),
        currentWindow: z.boolean().optional(),
        url: z.union([z.string(), z.array(z.string())]).optional(),
      })
      .optional(),
  });

  constructor(private tabsService: ITabsService) {
    super();
  }

  async execute(input: { filters?: any }): Promise<ToolResult<TabMetadata[]>> {
    try {
      const tabs = await this.tabsService.query(input.filters || {});
      return this.success(tabs);
    } catch (error) {
      return this.failure(
        "EXECUTION_FAILED",
        "Failed to get tabs",
        { error }
      );
    }
  }

  getExamples(): ToolExample[] {
    return [
      {
        description: "Get all tabs",
        input: {},
      },
      {
        description: "Get only active tab",
        input: { filters: { active: true } },
      },
      {
        description: "Get tabs in current window",
        input: { filters: { currentWindow: true } },
      },
    ];
  }
}
```

### Example: Run Script Tool

```typescript
// src/tools/domain/scripting/RunScriptTool.ts

import { BaseTool } from "@/tools/base/BaseTool";
import { ToolCategory, type ToolResult } from "@/tools/types";
import { z } from "zod";
import type { IScriptingService } from "@/services/interfaces/IScriptingService";
import type { ITabsService } from "@/services/interfaces/ITabsService";

export class RunScriptTool extends BaseTool<
  { code: string; tabId?: number },
  { result: any }
> {
  readonly name = "run_script";
  readonly description = "Execute JavaScript code in a browser tab";
  readonly version = "1.0.0";
  readonly category = ToolCategory.SCRIPTING;
  readonly tags = ["scripting", "javascript", "automation"];

  inputSchema = z.object({
    code: z.string().min(1, "Code is required"),
    tabId: z.number().optional(),
  });

  constructor(
    private scriptingService: IScriptingService,
    private tabsService: ITabsService
  ) {
    super();
  }

  async execute(
    input: { code: string; tabId?: number }
  ): Promise<ToolResult<{ result: any }>> {
    const { code, tabId } = input;

    try {
      // Get target tab (use active if not specified)
      const targetTabId = tabId ?? (await this.tabsService.getCurrent()).id;

      // Execute script via service
      const result = await this.scriptingService.executeFunction(
        targetTabId,
        (scriptCode: string) => {
          // eslint-disable-next-line no-eval
          return eval(scriptCode);
        },
        [code]
      );

      return this.success({ result });
    } catch (error) {
      return this.failure(
        "EXECUTION_FAILED",
        "Failed to execute script",
        { code, tabId, error }
      );
    }
  }

  getExamples(): ToolExample[] {
    return [
      {
        description: "Get page title",
        input: { code: "document.title" },
      },
      {
        description: "Count paragraphs",
        input: { code: "document.querySelectorAll('p').length" },
      },
    ];
  }
}
```

---

## Tool Registry & Discovery

### Auto-Discovery Tool Registry

```typescript
// src/tools/ToolRegistry.ts

import type { ITool, ToolCategory, ToolMetadata } from "./types";

export class ToolRegistry {
  private tools = new Map<string, ITool>();
  private toolsByCategory = new Map<ToolCategory, ITool[]>();

  /**
   * Register a tool
   */
  register(tool: ITool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] Tool already registered: ${tool.name}`);
    }

    this.tools.set(tool.name, tool);

    // Index by category
    if (!this.toolsByCategory.has(tool.category)) {
      this.toolsByCategory.set(tool.category, []);
    }
    this.toolsByCategory.get(tool.category)!.push(tool);

    console.log(
      `[ToolRegistry] Registered tool: ${tool.name} (${tool.version}) [${tool.category}]`
    );
  }

  /**
   * Register multiple tools
   */
  registerAll(tools: ITool[]): void {
    tools.forEach((tool) => this.register(tool));
  }

  /**
   * Get tool by name
   */
  get(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  getAll(): ITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category: ToolCategory): ITool[] {
    return this.toolsByCategory.get(category) || [];
  }

  /**
   * Get all tool names
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get all tool metadata
   */
  getAllMetadata(): ToolMetadata[] {
    return this.getAll().map((tool) => tool.getMetadata());
  }

  /**
   * Search tools by tag
   */
  searchByTag(tag: string): ITool[] {
    return this.getAll().filter((tool) =>
      tool.tags?.includes(tag)
    );
  }

  /**
   * Check if tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get registry stats
   */
  getStats() {
    const byCategory: Record<string, number> = {};

    for (const [category, tools] of this.toolsByCategory.entries()) {
      byCategory[category] = tools.length;
    }

    return {
      total: this.tools.size,
      byCategory,
    };
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();
```

### Tool Registration (Auto-Discovery)

```typescript
// src/tools/index.ts

import { toolRegistry } from "./ToolRegistry";
import { ServiceRegistry } from "@/services/ServiceRegistry";

// Import all tool classes
import { GetTabsTool } from "./domain/tabs/GetTabsTool";
import { CloseTabsTool } from "./domain/tabs/CloseTabsTool";
import { GroupTabsTool } from "./domain/tabs/GroupTabsTool";
import { OpenNewTabTool } from "./domain/tabs/OpenNewTabTool";

import { GetPageContentTool } from "./domain/page/GetPageContentTool";
import { GetDomSnapshotTool } from "./domain/page/GetDomSnapshotTool";

import { RunScriptTool } from "./domain/scripting/RunScriptTool";

import { SearchHistoryTool } from "./domain/history/SearchHistoryTool";

/**
 * Initialize all tools
 * Called once at startup in background script
 */
export function initializeTools() {
  // Get services from registry
  const tabs = ServiceRegistry.tabs;
  const tabGroups = ServiceRegistry.tabGroups;
  const page = ServiceRegistry.page;
  const scripting = ServiceRegistry.scripting;
  const history = ServiceRegistry.history;

  // Register all tools with dependency injection
  toolRegistry.registerAll([
    // Tabs tools
    new GetTabsTool(tabs),
    new CloseTabsTool(tabs),
    new GroupTabsTool(tabs, tabGroups),
    new OpenNewTabTool(tabs),

    // Page tools
    new GetPageContentTool(page),
    new GetDomSnapshotTool(page),

    // Scripting tools
    new RunScriptTool(scripting, tabs),

    // History tools
    new SearchHistoryTool(history),
  ]);

  console.log("[Tools] Initialized:", toolRegistry.getStats());
}

// Export registry
export { toolRegistry };
```

---

## Tool Executor

### Centralized Tool Execution

```typescript
// src/tools/ToolExecutor.ts

import { toolRegistry } from "./ToolRegistry";
import type { ITool, ToolResult } from "./types";
import { ZodError } from "zod";

export interface ToolExecutionOptions {
  timeout?: number;
  logExecution?: boolean;
}

export class ToolExecutor {
  /**
   * Execute a tool by name
   */
  static async execute(
    toolName: string,
    input: any,
    options: ToolExecutionOptions = {}
  ): Promise<ToolResult> {
    const { timeout = 30000, logExecution = true } = options;

    // Get tool from registry
    const tool = toolRegistry.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: {
          code: "TOOL_NOT_FOUND",
          message: `Tool not found: ${toolName}`,
          details: { availableTools: toolRegistry.getNames() },
        },
      };
    }

    if (logExecution) {
      console.log(`[ToolExecutor] Executing: ${toolName}`, input);
    }

    const startTime = Date.now();

    try {
      // Validate input
      let validatedInput: any;
      try {
        validatedInput = tool.validateInput(input);
      } catch (error) {
        if (error instanceof ZodError) {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid input",
              details: {
                issues: error.errors,
              },
            },
          };
        }
        throw error;
      }

      // Execute with timeout
      const resultPromise = tool.execute(validatedInput);
      const timeoutPromise = new Promise<ToolResult>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Tool execution timeout after ${timeout}ms`)),
          timeout
        )
      );

      const result = await Promise.race([resultPromise, timeoutPromise]);

      // Add execution metadata
      const executionTime = Date.now() - startTime;
      result.metadata = {
        ...result.metadata,
        executionTime,
        timestamp: Date.now(),
        toolName,
        toolVersion: tool.version,
      };

      if (logExecution) {
        console.log(
          `[ToolExecutor] Completed: ${toolName} (${executionTime}ms)`,
          result
        );
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      if (logExecution) {
        console.error(
          `[ToolExecutor] Failed: ${toolName} (${executionTime}ms)`,
          error
        );
      }

      return {
        success: false,
        error: {
          code: "EXECUTION_ERROR",
          message: error instanceof Error ? error.message : String(error),
          details: { error, executionTime },
        },
      };
    }
  }

  /**
   * Execute multiple tools in parallel
   */
  static async executeAll(
    tools: Array<{ name: string; input: any }>,
    options?: ToolExecutionOptions
  ): Promise<ToolResult[]> {
    return Promise.all(
      tools.map((t) => this.execute(t.name, t.input, options))
    );
  }

  /**
   * Get available tools metadata
   */
  static getAvailableTools() {
    return toolRegistry.getAllMetadata();
  }
}
```

### Integration with AI SDK

Update evaluator to use ToolExecutor:

```typescript
// src/sidepanel/evaluator.ts

import type { UIMessage, InferUIMessageToolCall } from "ai";
import { ToolExecutor } from "@/tools/ToolExecutor";
import type { AddToolResultFn } from "@/tools/utils";

export const evaluateToolCall = async (
  toolCall: InferUIMessageToolCall<UIMessage>,
  addToolResult: AddToolResultFn
) => {
  // Execute tool via centralized executor
  const result = await ToolExecutor.execute(
    toolCall.toolName,
    toolCall.input,
    { logExecution: true }
  );

  if (result.success) {
    // Success case
    await addToolResult({
      tool: toolCall.toolName,
      toolCallId: toolCall.toolCallId,
      output: JSON.stringify(result.data),
    });
  } else {
    // Error case
    await addToolResult({
      state: "output-error",
      tool: toolCall.toolName,
      toolCallId: toolCall.toolCallId,
      errorText: result.error!.message,
    });
  }
};
```

---

## Tool Categories

### Tabs Tools

| Tool Name | Description | Input | Output |
|-----------|-------------|-------|--------|
| `get_tabs` | Get all tabs | filters | TabMetadata[] |
| `close_tabs` | Close tabs | tabIds | closedCount |
| `group_tabs` | Group tabs | groups[] | groupIds[] |
| `open_new_tab` | Open tab | url, options | TabMetadata |
| `duplicate_tab` | Duplicate tab | tabId | TabMetadata |
| `reload_tab` | Reload tab | tabId, bypassCache | void |

### Page Tools

| Tool Name | Description | Input | Output |
|-----------|-------------|-------|--------|
| `get_page_content` | Get page HTML/text | tabId, options | PageContent |
| `get_dom_snapshot` | Get Playwright snapshot | tabId | snapshot string |
| `get_readable_content` | Get readable article | tabId | ReadableArticle |

### Scripting Tools

| Tool Name | Description | Input | Output |
|-----------|-------------|-------|--------|
| `run_script` | Execute JavaScript | code, tabId | result |
| `inject_inspector` | Inject element inspector | tabId | selectedElement |

### History Tools

| Tool Name | Description | Input | Output |
|-----------|-------------|-------|--------|
| `search_history` | Search browser history | query, options | HistoryItem[] |
| `get_visits` | Get visit history for URL | url | VisitItem[] |

---

## Testing Strategy

### Unit Test Tools

```typescript
// src/tools/domain/tabs/__tests__/CloseTabsTool.test.ts

import { describe, it, expect, vi } from "vitest";
import { CloseTabsTool } from "../CloseTabsTool";
import type { ITabsService } from "@/services/interfaces/ITabsService";

describe("CloseTabsTool", () => {
  it("should close valid tabs", async () => {
    const mockTabsService: ITabsService = {
      query: vi.fn().mockResolvedValue([
        { id: 1, title: "Tab 1" },
        { id: 2, title: "Tab 2" },
      ]),
      close: vi.fn().mockResolvedValue(undefined),
    } as any;

    const tool = new CloseTabsTool(mockTabsService);

    const result = await tool.execute({ tabIds: [1, 2] });

    expect(result.success).toBe(true);
    expect(result.data?.closedCount).toBe(2);
    expect(mockTabsService.close).toHaveBeenCalledWith([1, 2]);
  });

  it("should handle non-existent tabs", async () => {
    const mockTabsService: ITabsService = {
      query: vi.fn().mockResolvedValue([{ id: 1 }]),
      close: vi.fn(),
    } as any;

    const tool = new CloseTabsTool(mockTabsService);

    const result = await tool.execute({ tabIds: [999] });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("NO_VALID_TABS");
  });

  it("should validate input", async () => {
    const tool = new CloseTabsTool({} as any);

    await expect(
      tool.execute({ tabIds: [] } as any)
    ).rejects.toThrow();
  });
});
```

### Integration Test ToolExecutor

```typescript
// src/tools/__tests__/ToolExecutor.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToolExecutor } from "../ToolExecutor";
import { toolRegistry } from "../ToolRegistry";
import { CloseTabsTool } from "../domain/tabs/CloseTabsTool";

describe("ToolExecutor", () => {
  beforeEach(() => {
    // Clear registry
    (toolRegistry as any).tools.clear();

    // Register mock tool
    const mockTool = new CloseTabsTool({
      query: vi.fn().mockResolvedValue([]),
      close: vi.fn(),
    } as any);

    toolRegistry.register(mockTool);
  });

  it("should execute tool successfully", async () => {
    const result = await ToolExecutor.execute("close_tabs", {
      tabIds: [1, 2],
    });

    expect(result.success).toBe(true);
    expect(result.metadata?.executionTime).toBeDefined();
  });

  it("should handle tool not found", async () => {
    const result = await ToolExecutor.execute("non_existent_tool", {});

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("TOOL_NOT_FOUND");
  });

  it("should timeout long-running tools", async () => {
    // Register tool that takes too long
    const slowTool = {
      name: "slow_tool",
      version: "1.0.0",
      category: "utility",
      inputSchema: z.object({}),
      async execute() {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return { success: true };
      },
      validateInput: (i: any) => i,
      getMetadata: () => ({} as any),
      getExamples: () => [],
    };

    toolRegistry.register(slowTool as any);

    const result = await ToolExecutor.execute(
      "slow_tool",
      {},
      { timeout: 100 }
    );

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("timeout");
  });
});
```

---

## Migration Path

### Phase 1: Create Tool Infrastructure (Week 1)

**Tasks:**
1. Create new tool interface and base class
2. Implement ToolRegistry
3. Implement ToolExecutor
4. Write tests

**Acceptance Criteria:**
- [ ] Tool interface defined
- [ ] BaseTool class works
- [ ] Registry auto-discovery works
- [ ] ToolExecutor handles success/error

### Phase 2: Migrate One Tool Category (Week 2)

**Tasks:**
1. Migrate all Tabs tools to new system
2. Update evaluator to use ToolExecutor
3. Test end-to-end

**Acceptance Criteria:**
- [ ] All tabs tools migrated
- [ ] Tools use service dependencies
- [ ] Old tabs tools removed
- [ ] Tests passing

### Phase 3: Migrate Remaining Tools (Week 3)

**Tasks:**
1. Migrate Page tools
2. Migrate Scripting tools
3. Migrate History tools

**Acceptance Criteria:**
- [ ] All tools migrated
- [ ] 100% test coverage
- [ ] Documentation updated

### Phase 4: Cleanup (Week 4)

**Tasks:**
1. Remove old tool system
2. Generate tool documentation
3. Add tool usage examples to UI

**Acceptance Criteria:**
- [ ] Old code removed
- [ ] Tool catalog generated
- [ ] UI shows tool examples

---

## Best Practices

### 1. Keep Tools Pure

```typescript
// ✅ Good: Pure business logic
class CloseTabsTool {
  constructor(private tabsService: ITabsService) {}

  async execute(input) {
    await this.tabsService.close(input.tabIds);
    return this.success({ closedCount: input.tabIds.length });
  }
}

// ❌ Bad: Infrastructure concerns
class CloseTabsTool {
  async execute(input) {
    chrome.tabs.remove(input.tabIds);  // Direct Chrome API
    return "Closed tabs";
  }
}
```

### 2. Use Typed Results

```typescript
// ✅ Good: Typed result
interface CloseTabsOutput {
  closedCount: number;
  invalidIds?: number[];
}

class CloseTabsTool extends BaseTool<Input, CloseTabsOutput> {
  // ...
}

// ❌ Bad: String output
async execute() {
  return "Closed 3 tabs";  // Unstructured
}
```

### 3. Add Examples

```typescript
// ✅ Good: Provide examples
getExamples(): ToolExample[] {
  return [
    {
      description: "Close a single tab",
      input: { tabIds: [123] },
      expectedOutput: { closedCount: 1 },
    },
  ];
}

// ❌ Bad: No examples
getExamples() {
  return [];
}
```

### 4. Version Your Tools

```typescript
// ✅ Good: Version tracking
readonly version = "1.0.0";

// If breaking changes:
readonly version = "2.0.0";
readonly deprecated = false;

// ❌ Bad: No versioning
// Tools evolve, breaking LLM expectations
```

---

## Conclusion

The refactored tool system provides:

✅ **Pure Domain Logic** - Tools don't know about infrastructure
✅ **Dependency Injection** - Easy to test and swap implementations
✅ **Auto-Discovery** - No manual registration
✅ **Rich Metadata** - Versioning, categories, examples
✅ **Typed Results** - Structured output, not strings
✅ **Centralized Execution** - Consistent logging, timeouts, error handling

This design scales to hundreds of tools while maintaining clarity and testability.

---

**Next Steps:**
1. Implement BaseTool and ToolRegistry
2. Migrate one tool as proof-of-concept
3. Update evaluator to use ToolExecutor
4. Iterate based on feedback

**Related Documents:**
- [Message Bus Architecture](./MESSAGE_BUS_ARCHITECTURE.md)
- [Service Layer Architecture](./SERVICE_LAYER_ARCHITECTURE.md)
- [Refactoring Master Guide](./REFACTORING_MASTER_GUIDE.md)
