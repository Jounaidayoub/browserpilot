# Guide 3: Architecture Documentation

## Overview

**Time:** 4-6 hours  
**Priority:** ⭐ IMPORTANT - Makes codebase explorable  
**Impact:** High - enables collaboration and onboarding  
**Learning Goals:** Software architecture, documentation practices, system design

## Why This Matters

> "Code is read far more often than it is written."

Right now, understanding your codebase requires reading every file and tracing every connection. That's the definition of a "hairball." **Good documentation creates a mental model** that makes the codebase navigable.

### What You'll Gain
- **Faster onboarding:** New contributors (including future you) get productive quickly
- **Better decisions:** Clear architecture guides feature additions
- **Less duplication:** Developers know what exists before building
- **Confidence:** Understanding the system reduces fear of breaking things
- **Collaboration:** Others can contribute without constant hand-holding

## Documentation Philosophy

**Good documentation is:**
- ✅ **High-level first** - Start with the big picture
- ✅ **Visual when possible** - Diagrams > walls of text
- ✅ **Example-driven** - Show, don't just tell
- ✅ **Maintained** - Out-of-date docs are worse than no docs
- ✅ **Layered** - Different depths for different audiences

**Bad documentation is:**
- ❌ Explaining WHAT the code does (code does that)
- ❌ Walls of text with no structure
- ❌ Too detailed (becomes maintenance burden)
- ❌ Hidden in random files

## Documentation Structure We'll Create

```
docs/
├── ARCHITECTURE.md          # System overview (start here)
├── COMPONENTS.md            # Component catalog
├── API_REFERENCE.md         # Tool API reference
├── CHROME_EXTENSION_GUIDE.md # Extension-specific patterns
├── DATA_FLOW.md            # How data moves through the system
└── diagrams/
    ├── high-level.svg      # Overall architecture
    ├── message-flow.svg    # Message passing
    └── component-tree.svg  # React component hierarchy
```

## Step-by-Step Implementation

### Step 1: Create Documentation Directory

```bash
mkdir -p docs/diagrams
```

### Step 2: Create ARCHITECTURE.md (System Overview)

Create `docs/ARCHITECTURE.md`:

```markdown
# Architecture Overview

## Purpose

This Chrome extension is an AI-powered browser assistant that helps users manage tabs, analyze web pages, and interact with content through natural language.

## High-Level Architecture

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                     Chrome Browser                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │  Popup   │    │   Side   │    │     Content      │  │
│  │   UI     │    │  Panel   │    │     Script       │  │
│  │ (React)  │    │ (React)  │    │   (Injected)     │  │
│  └────┬─────┘    └────┬─────┘    └────────┬─────────┘  │
│       │               │                     │            │
│       └───────────────┼─────────────────────┘            │
│                       │                                  │
│                  ┌────▼────┐                            │
│                  │ Background│                           │
│                  │  Service  │                           │
│                  │  Worker   │                           │
│                  └────┬─────┘                            │
│                       │                                  │
│              ┌────────┼────────┐                        │
│              ▼        ▼        ▼                         │
│          Chrome    Playwright  Storage                   │
│           APIs      Bridge     APIs                      │
└─────────────────────────────────────────────────────────┘
\`\`\`

## Core Components

### 1. **Side Panel** (`src/sidepanel/`)
- **Purpose:** Main chat interface for AI interactions
- **Tech:** React, AI SDK, Custom UI components
- **Entry:** `src/sidepanel/main.tsx`
- **Key Features:**
  - AI chat with streaming responses
  - Tool execution visualization
  - Theme management

### 2. **Background Service Worker** (`src/bg.ts`, `src/background/`)
- **Purpose:** Central coordinator, handles Chrome APIs
- **Tech:** TypeScript, Playwright-CRX
- **Key Responsibilities:**
  - Message routing between components
  - Tab and window management
  - Page content extraction
  - Tool execution

### 3. **Content Scripts** (`src/content/`)
- **Purpose:** Runs in web pages, enables page interaction
- **Tech:** React (injected), TypeScript
- **Key Features:**
  - Page inspection
  - DOM manipulation
  - Context extraction

### 4. **Popup** (`src/popup/`)
- **Purpose:** Quick actions from extension icon
- **Tech:** React, TypeScript
- **Current:** Minimal UI, mostly opens side panel

### 5. **Tools System** (`src/tools/`)
- **Purpose:** Modular actions the AI can execute
- **Tech:** TypeScript, Zod schemas
- **Available Tools:**
  - Tab management (get, close, group)
  - Page content extraction
  - Script execution
  - History search

## Data Flow

### User Message Flow

\`\`\`
User types message in Side Panel
    ↓
AI SDK processes input
    ↓
AI decides to use a tool
    ↓
Tool execution in evaluator.ts
    ↓
    ├─→ Direct Chrome API calls (tabs, storage)
    │
    └─→ Message to Background Worker
            ↓
        Background executes with Playwright
            ↓
        Returns result to Side Panel
            ↓
        AI generates response with result
            ↓
        User sees response
\`\`\`

## Key Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **CRXJS** - Chrome extension bundler
- **AI SDK** - AI chat interface
- **Playwright-CRX** - Browser automation for extensions
- **Radix UI** - Accessible UI components
- **Tailwind CSS** - Styling

## Extension Manifest (MV3)

- **Permissions:**
  - `sidePanel` - Side panel UI
  - `tabs` - Tab management
  - `tabGroups` - Group tabs
  - `history` - Browser history
  - `activeTab` - Current tab access
  - `scripting` - Code injection
  - `storage` - Data persistence
  - `debugger` - Page inspection

- **Host Permissions:**
  - `https://*/*` - All HTTPS pages
  - `http://*/*` - All HTTP pages

## Design Patterns

### 1. **Tool Pattern**
Each tool is a self-contained module with:
- Schema (Zod) for type validation
- Description for AI understanding
- Execute function with error handling

\`\`\`typescript
interface Tool<T> {
  name: string;
  description: string;
  schema: ZodType<T>;
  execute: (args: T) => Promise<string>;
}
\`\`\`

### 2. **Message Passing Pattern**
Components communicate via Chrome's messaging API:
- Side panel sends messages
- Background worker receives and processes
- Response sent back asynchronously

### 3. **React Context Pattern**
UI state managed with React Context:
- Theme context (light/dark)
- Chat context (messages, tools)

## Current Limitations & Technical Debt

1. **No Error Boundaries** - React crashes can break UI
2. **Limited Test Coverage** - Manual testing only
3. **Tight Coupling** - Some components know too much about each other
4. **Large Components** - ChatBotDemo.tsx is 500+ lines
5. **Inconsistent Error Handling** - Some functions throw, some return error strings
6. **No State Persistence** - Chat history lost on reload
7. **Limited Type Safety** - Some `any` types remain

## Performance Considerations

- **Streaming Responses** - AI responses stream to reduce perceived latency
- **Lazy Loading** - Components loaded on-demand
- **Debounced Updates** - Prevent excessive re-renders
- **Background Processing** - Heavy work in service worker

## Security Considerations

- **Content Security Policy** - Injected policy.js to allow AI SDK
- **Permission Scope** - Minimal permissions for features
- **No Secrets in Code** - API keys should be user-provided
- **Sanitization** - User input sanitized before display

## Future Architecture Goals

1. **State Management** - Consider Zustand or Jotai for complex state
2. **Component Library** - Extract reusable components
3. **Plugin System** - Make tools dynamically loadable
4. **Offline Support** - Cache and sync capabilities
5. **Multi-Agent System** - Specialized AI agents for different tasks

## Getting Started

1. **Read this document** - Understand the big picture
2. **Explore src/tools/** - See how tools are built
3. **Read src/sidepanel/ChatBotDemo.tsx** - Main chat logic
4. **Check src/background/messageHandlers.ts** - Message routing
5. **Run the extension** - See it in action

## Questions?

If something isn't clear, it's a documentation bug. Please ask and we'll improve this guide.
\`\`\`

### Step 3: Create COMPONENTS.md (Component Catalog)

Create `docs/COMPONENTS.md`:

```markdown
# Component Catalog

## UI Components (`src/components/ui/`)

These are base UI components, mostly from Radix UI + Tailwind CSS.

### Badge
**Purpose:** Display tags, status indicators  
**Props:** `variant`, `className`  
**Example:**
\`\`\`tsx
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Beta</Badge>
\`\`\`

### Button
**Purpose:** Interactive buttons  
**Props:** `variant`, `size`, `onClick`  
**Example:**
\`\`\`tsx
<Button variant="default" size="sm" onClick={handleClick}>
  Click me
</Button>
\`\`\`

[Document other UI components...]

## AI Components (`src/components/ai-elements/`)

These are specialized components for AI interactions.

### Message
**Purpose:** Display a single chat message  
**Location:** `src/components/ai-elements/message.tsx`  
**Props:**
- `role`: 'user' | 'assistant' | 'system'
- `content`: Message text
- `timestamp`: Optional display time

**Example:**
\`\`\`tsx
<Message role="user" content="Hello, assistant!" />
<Message role="assistant" content="Hi! How can I help?" />
\`\`\`

### Tool
**Purpose:** Display tool execution and results  
**Location:** `src/components/ai-elements/tool.tsx`  
**Children Components:**
- `ToolHeader` - Tool name and status
- `ToolInput` - Arguments passed to tool
- `ToolOutput` - Execution result
- `ToolContent` - Container for all parts

**Example:**
\`\`\`tsx
<Tool>
  <ToolHeader name="get_tabs" status="running" />
  <ToolInput args={{ filter: "active" }} />
  <ToolOutput result="Found 5 tabs..." />
</Tool>
\`\`\`

### Conversation
**Purpose:** Container for chat messages with auto-scroll  
**Location:** `src/components/ai-elements/conversation.tsx`  
**Features:**
- Auto-scroll to bottom
- Scroll-to-bottom button
- Message list virtualization (future)

### PromptInput
**Purpose:** Multi-featured chat input  
**Location:** `src/components/ai-elements/prompt-input.tsx`  
**Features:**
- Text input with auto-resize
- Model selection dropdown
- Attachment support
- Tool toggles
- Submit button

**Example:**
\`\`\`tsx
<PromptInput>
  <PromptInputToolbar>
    <PromptInputModelSelect>...</PromptInputModelSelect>
    <PromptInputTools>...</PromptInputTools>
  </PromptInputToolbar>
  <PromptInputBody>
    <PromptInputTextarea placeholder="Type a message..." />
    <PromptInputSubmit />
  </PromptInputBody>
</PromptInput>
\`\`\`

## Page Components

### ChatBotDemo (`src/sidepanel/ChatBotDemo.tsx`)
**Purpose:** Main chat interface  
**Responsibilities:**
- Manages chat state with AI SDK
- Handles tool execution
- Renders messages and tools
- Manages attachments

**State:**
- `messages` - Chat history
- `input` - Current input
- `isLoading` - AI processing state
- `selectedTools` - Active tool set

**Key Functions:**
- `handleSubmit` - Send message
- `handleToolExecute` - Run tool
- `handleAttachment` - Add context

### App (`src/sidepanel/App.tsx`)
**Purpose:** Root component for side panel  
**Responsibilities:**
- Theme provider setup
- Theme toggle
- Mounts ChatBotDemo

## Shared Components

### ThemeProvider (`src/components/theme-provider.tsx`)
**Purpose:** Manage light/dark theme  
**Uses:** React Context  
**Storage:** localStorage

### ThemeToggle (`src/components/Toggle-theme.tsx`)
**Purpose:** Button to switch themes  
**Depends on:** ThemeProvider

## Component Organization Principles

1. **Single Responsibility** - Each component does one thing well
2. **Composability** - Small components combine to make features
3. **Props over State** - Prefer controlled components
4. **Accessibility** - All interactive elements keyboard accessible
5. **Typing** - Full TypeScript types for props

## Creating New Components

### Template for UI Components

\`\`\`tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  className?: string;
  // other props
}

export const MyComponent = forwardRef<
  HTMLDivElement,
  MyComponentProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('base-styles', className)}
      {...props}
    />
  );
});

MyComponent.displayName = 'MyComponent';
\`\`\`

### Template for AI Components

\`\`\`tsx
import { ReactNode } from 'react';

interface MyAIComponentProps {
  data: SomeType;
  onAction?: () => void;
  children?: ReactNode;
}

export function MyAIComponent({ 
  data, 
  onAction, 
  children 
}: MyAIComponentProps) {
  return (
    <div className="my-ai-component">
      {/* component content */}
      {children}
    </div>
  );
}
\`\`\`

## Common Patterns

### Conditional Rendering
\`\`\`tsx
{isLoading && <Loader />}
{error && <ErrorMessage>{error}</ErrorMessage>}
{data && <DataDisplay data={data} />}
\`\`\`

### Compound Components
\`\`\`tsx
<Parent>
  <Parent.Header />
  <Parent.Body />
  <Parent.Footer />
</Parent>
\`\`\`

### Render Props
\`\`\`tsx
<DataProvider>
  {({ data, isLoading }) => (
    isLoading ? <Loader /> : <Display data={data} />
  )}
</DataProvider>
\`\`\`

## Testing Components

See [Testing Strategy](../guides/02_TESTING_STRATEGY.md) for details on testing these components.
\`\`\`

### Step 4: Create API_REFERENCE.md (Tool Documentation)

Create `docs/API_REFERENCE.md`:

```markdown
# Tool API Reference

## Overview

Tools are the actions the AI can execute. Each tool:
- Has a unique name
- Describes what it does (for AI understanding)
- Defines input schema with Zod
- Implements execution logic
- Returns string results

## Tool Interface

\`\`\`typescript
interface Tool<T> {
  name: string;                    // Unique identifier
  description: string;              // What the tool does
  schema: ZodType<T> | null;       // Input validation
  execute: (args: T) => Promise<string>; // Implementation
}
\`\`\`

## Available Tools

### Tab Management

#### get_tabs
**Description:** Get list of all open tabs  
**Input:** None or filter options  
**Returns:** Formatted list of tabs with IDs, titles, URLs

**Example:**
\`\`\`typescript
await get_tabs.execute({});
// Returns: "Tab 1: Google (https://google.com) [ID: 123]\\n..."
\`\`\`

**Use Cases:**
- Show user their open tabs
- Find specific tab by title/URL
- Check tab count

#### close_tabs
**Description:** Close tabs by ID  
**Input:** `{ ids: number[] }`  
**Returns:** Success/failure message

**Example:**
\`\`\`typescript
await close_tabs.execute({ ids: [123, 456] });
// Returns: "Successfully closed 2 tabs"
\`\`\`

**Error Handling:**
- Invalid IDs are skipped
- Returns partial success if some fail

#### group_tabs_by_ids
**Description:** Group tabs together  
**Input:** `{ ids: number[], title?: string, color?: string }`  
**Returns:** Success message with group ID

**Example:**
\`\`\`typescript
await group_tabs_by_ids.execute({
  ids: [1, 2, 3],
  title: "Research",
  color: "blue"
});
\`\`\`

#### open_new_tab
**Description:** Open a new tab  
**Input:** `{ url: string, active?: boolean }`  
**Returns:** New tab information

### Page Content

#### get_page_content
**Description:** Get full HTML content of a page  
**Input:** `{ tabId: number }`  
**Returns:** Page HTML as string

**Use Cases:**
- Analyze page structure
- Extract specific content
- Debug page issues

#### get_page_dom_snapshot
**Description:** Get AI-friendly page snapshot  
**Input:** `{ tabId: number }`  
**Returns:** Semantic markdown representation

**Features:**
- Removes scripts, styles
- Keeps semantic structure
- Optimized for AI understanding

**Example:**
\`\`\`typescript
await get_page_dom_snapshot.execute({ tabId: 123 });
// Returns structured markdown of page content
\`\`\`

#### get_tab_content
**Description:** Enhanced version with options  
**Input:** `{ tabId: number, selector?: string, clean?: boolean }`  
**Returns:** Content based on options

**Options:**
- `selector` - Extract specific elements
- `clean` - Remove noise (scripts, ads, etc.)
- `structure` - Just tag hierarchy

### Script Execution

#### run_script
**Description:** Execute JavaScript in page context  
**Input:** `{ tabId: number, code: string }`  
**Returns:** Script execution result

**Security:** Use with caution, sanitize input

**Example:**
\`\`\`typescript
await run_script.execute({
  tabId: 123,
  code: "document.title"
});
// Returns: "Page Title"
\`\`\`

### History (Commented Out Currently)

#### search_history
**Description:** Search browser history  
**Input:** `{ query: string, maxResults?: number }`  
**Returns:** Matching history entries

## Creating New Tools

### Step 1: Define Tool File

Create `src/tools/MyNewTool.ts`:

\`\`\`typescript
import { z } from 'zod';
import type { Tool } from './types';

// Define input schema
const myNewToolSchema = z.object({
  param1: z.string().describe('Description of param1'),
  param2: z.number().optional().describe('Optional parameter'),
});

type MyNewToolInput = z.infer<typeof myNewToolSchema>;

// Implement tool
export const my_new_tool: Tool<MyNewToolInput> = {
  name: 'my_new_tool',
  description: 'Clear description of what this tool does for the AI',
  schema: myNewToolSchema,
  
  execute: async ({ param1, param2 }) => {
    try {
      // Implementation here
      const result = await doSomething(param1, param2);
      return \`Success: \${result}\`;
    } catch (error) {
      return \`Error: \${error.message}\`;
    }
  },
};
\`\`\`

### Step 2: Register Tool

Add to `src/tools/index.ts`:

\`\`\`typescript
import { my_new_tool } from './MyNewTool';

const registeredTools: Tool<ZodType | null>[] = [
  // existing tools...
  my_new_tool,
];
\`\`\`

### Step 3: Test Tool

Create `src/tools/MyNewTool.test.ts` (see Testing guide)

## Tool Best Practices

### 1. Clear Descriptions
The AI uses descriptions to decide when to use tools. Be specific:

❌ Bad: "Manages tabs"  
✅ Good: "Closes one or more browser tabs by their numeric IDs"

### 2. Validate Input
Always use Zod schemas:
\`\`\`typescript
const schema = z.object({
  url: z.string().url(), // Validates URL format
  timeout: z.number().min(0).max(30000), // Sensible limits
});
\`\`\`

### 3. Handle Errors Gracefully
\`\`\`typescript
try {
  const result = await chrome.tabs.get(tabId);
  return \`Success: \${result}\`;
} catch (error) {
  return \`Error: \${error.message}\`;
}
\`\`\`

### 4. Return Useful Information
\`\`\`typescript
// ❌ Not helpful
return "Done";

// ✅ Helpful
return \`Closed 3 tabs: "Google", "GitHub", "Stack Overflow"\`;
\`\`\`

### 5. Keep Tools Focused
One tool = one action. Don't create mega-tools that do everything.

### 6. Document Edge Cases
\`\`\`typescript
/**
 * Note: This tool only works on active tabs.
 * For background tabs, use get_page_content instead.
 */
\`\`\`

## Tool Execution Flow

\`\`\`
AI decides to use tool
    ↓
Validates input against schema
    ↓
Calls tool.execute(validatedArgs)
    ↓
Tool returns string result
    ↓
AI incorporates result in response
\`\`\`

## Debugging Tools

### Enable Tool Logging

Add to your tool:
\`\`\`typescript
execute: async (args) => {
  console.log('Tool executed with:', args);
  const result = await implementation(args);
  console.log('Tool result:', result);
  return result;
}
\`\`\`

### Test Tools Directly

\`\`\`typescript
// In browser console or test
import { get_tabs } from './src/tools/Tabs';
const result = await get_tabs.execute({});
console.log(result);
\`\`\`

## Future Tool Ideas

- **Bookmark management** - Create, search, organize bookmarks
- **Screenshot capture** - Take and analyze screenshots
- **Form filling** - Auto-fill forms based on context
- **Page monitoring** - Watch for changes
- **Download management** - Manage downloads
- **Cookie management** - View, edit cookies
- **Network analysis** - Inspect requests/responses
\`\`\`

### Step 5: Create Chrome Extension Patterns Guide

Create `docs/CHROME_EXTENSION_GUIDE.md`:

```markdown
# Chrome Extension Development Guide

## Manifest V3 Specifics

This extension uses Manifest V3, which has important differences from V2:

### Service Workers Instead of Background Pages
- **V2:** Background pages (persistent or event-based)
- **V3:** Service workers (always event-based)
- **Impact:** Can't use `window`, `document`, or `localStorage`

**Solution:**
\`\`\`typescript
// ❌ Doesn't work in service worker
localStorage.setItem('key', 'value');

// ✅ Use chrome.storage instead
chrome.storage.local.set({ key: 'value' });
\`\`\`

### Content Security Policy
By default, CSP blocks inline scripts and unsafe-eval.

**Our Solution:** Inject CSP policy via content script
\`\`\`javascript
// src/policy.js
const policy = {
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
};
// Applied at document_start
\`\`\`

## Message Passing Patterns

### Pattern 1: One-Time Messages

**Sending:**
\`\`\`typescript
chrome.runtime.sendMessage(
  { action: 'get-tabs', filter: 'active' },
  (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    }
    console.log('Response:', response);
  }
);
\`\`\`

**Receiving:**
\`\`\`typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'get-tabs') {
    getTabs().then(tabs => {
      sendResponse({ success: true, tabs });
    });
    return true; // Keeps channel open for async response
  }
});
\`\`\`

### Pattern 2: Long-Lived Connections

For streaming data or continuous communication:

\`\`\`typescript
// Connect
const port = chrome.runtime.connect({ name: 'ai-stream' });

// Send messages
port.postMessage({ type: 'start', prompt: 'Hello' });

// Receive messages
port.onMessage.addListener((msg) => {
  console.log('Received:', msg);
});

// Disconnect
port.disconnect();
\`\`\`

## Content Script Communication

### Inject Scripts into Pages

\`\`\`typescript
chrome.scripting.executeScript({
  target: { tabId: tabId },
  func: () => {
    // This runs in page context
    return document.title;
  },
}).then(results => {
  console.log('Title:', results[0].result);
});
\`\`\`

### Insert CSS

\`\`\`typescript
chrome.scripting.insertCSS({
  target: { tabId: tabId },
  css: '.highlight { background: yellow; }',
});
\`\`\`

## Storage Patterns

### Local Storage (Per-Device)

\`\`\`typescript
// Save
await chrome.storage.local.set({ key: 'value' });

// Load
const result = await chrome.storage.local.get('key');
console.log(result.key); // 'value'

// Load with default
const result = await chrome.storage.local.get({ key: 'default' });
\`\`\`

### Sync Storage (Across Devices)

\`\`\`typescript
// Syncs across user's Chrome instances
await chrome.storage.sync.set({ theme: 'dark' });
const { theme } = await chrome.storage.sync.get('theme');
\`\`\`

### Listen for Changes

\`\`\`typescript
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.theme) {
    console.log('Theme changed:', changes.theme.newValue);
  }
});
\`\`\`

## Tab Management

### Query Tabs

\`\`\`typescript
// Get active tab in current window
const [tab] = await chrome.tabs.query({ 
  active: true, 
  currentWindow: true 
});

// Get all tabs
const allTabs = await chrome.tabs.query({});

// Filter tabs
const googTabs = await chrome.tabs.query({ 
  url: '*://google.com/*' 
});
\`\`\`

### Create/Update Tabs

\`\`\`typescript
// Create tab
const newTab = await chrome.tabs.create({
  url: 'https://example.com',
  active: false, // Don't switch to it
});

// Update tab
await chrome.tabs.update(tabId, {
  url: 'https://new-url.com',
});

// Move tab
await chrome.tabs.move(tabId, { index: 0 });
\`\`\`

### Listen for Tab Events

\`\`\`typescript
// Tab created
chrome.tabs.onCreated.addListener((tab) => {
  console.log('New tab:', tab.id);
});

// Tab updated (URL changed, loaded, etc.)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab loaded:', tab.url);
  }
});

// Tab removed
chrome.tabs.onRemoved.addListener((tabId) => {
  console.log('Tab closed:', tabId);
});
\`\`\`

## Side Panel API

### Open Side Panel

\`\`\`typescript
// Open for specific tab
chrome.sidePanel.open({ tabId: tabId });

// Open for current window
chrome.sidePanel.open({ windowId: windowId });
\`\`\`

### Set Side Panel Content

\`\`\`typescript
chrome.sidePanel.setOptions({
  tabId: tabId,
  path: 'sidepanel.html',
  enabled: true,
});
\`\`\`

## Permissions

### Check Permissions

\`\`\`typescript
const hasPermission = await chrome.permissions.contains({
  permissions: ['tabs'],
});
\`\`\`

### Request Permissions (Optional Permissions)

\`\`\`typescript
const granted = await chrome.permissions.request({
  permissions: ['downloads'],
});
\`\`\`

## Debugging

### Service Worker

1. Go to `chrome://extensions`
2. Enable Developer Mode
3. Click "Service Worker" link under your extension
4. Use DevTools console

### Content Scripts

1. Right-click on page → Inspect
2. In Console, select your content script from dropdown
3. `console.log` from content script appears here

### Popup/Side Panel

1. Right-click extension icon → Inspect Popup
2. Or, for side panel, open it and inspect

### Check Errors

\`\`\`typescript
if (chrome.runtime.lastError) {
  console.error('Chrome API error:', chrome.runtime.lastError.message);
}
\`\`\`

## Common Pitfalls

### 1. Async Message Handlers

❌ **Wrong:**
\`\`\`typescript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  fetchData().then(data => {
    sendResponse({ data }); // Won't work!
  });
});
\`\`\`

✅ **Right:**
\`\`\`typescript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  fetchData().then(data => {
    sendResponse({ data });
  });
  return true; // Keep channel open!
});
\`\`\`

### 2. Cross-Origin Requests

Content scripts inherit page's CSP, but background can make requests to any host (with permissions).

**Solution:** Make requests from background, send results to content script.

### 3. Service Worker Lifecycle

Service workers can shut down anytime. Don't rely on in-memory state.

**Solution:** Use chrome.storage for persistence.

## Best Practices

1. **Minimal Permissions:** Only request what you need
2. **Error Handling:** Always check `chrome.runtime.lastError`
3. **Type Safety:** Use `@types/chrome` for TypeScript
4. **Message Validation:** Validate all messages
5. **Cleanup:** Remove listeners when components unmount
6. **Testing:** Mock Chrome APIs in tests

## Resources

- [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome APIs Reference](https://developer.chrome.com/docs/extensions/reference/)
\`\`\`

## Step 6: Add Visual Diagrams (Optional but Recommended)

You can create diagrams using:
- **Excalidraw** (https://excalidraw.com/) - Hand-drawn style
- **draw.io** (https://app.diagrams.net/) - Professional diagrams
- **Mermaid** (in markdown) - Text-based diagrams

**Example Mermaid diagram in docs:**

````markdown
\`\`\`mermaid
graph TD
    A[User Input] --> B[Side Panel]
    B --> C{Needs Tool?}
    C -->|Yes| D[Tool Execution]
    C -->|No| E[AI Response]
    D --> F[Background Worker]
    F --> G[Chrome API]
    G --> F
    F --> D
    D --> E
    E --> H[Display to User]
\`\`\`
````

## Maintaining Documentation

### When to Update Docs

- **New feature** → Update ARCHITECTURE.md and relevant guides
- **New component** → Add to COMPONENTS.md
- **New tool** → Add to API_REFERENCE.md
- **Breaking change** → Update all affected docs
- **Refactoring** → Keep docs in sync

### Documentation Review Checklist

When reviewing PRs:
- [ ] Does this change affect architecture?
- [ ] Are new components documented?
- [ ] Are new tools added to API reference?
- [ ] Are examples still accurate?
- [ ] Are diagrams up to date?

### Keep It DRY (Don't Repeat Yourself)

Don't duplicate information. Link between docs:

```markdown
For testing this component, see [Testing Strategy](../guides/02_TESTING_STRATEGY.md#testing-components).
```

## Success Checklist

- [ ] Created `docs/` directory
- [ ] Written ARCHITECTURE.md with high-level overview
- [ ] Documented all components in COMPONENTS.md
- [ ] Documented all tools in API_REFERENCE.md
- [ ] Created Chrome extension patterns guide
- [ ] (Optional) Added visual diagrams
- [ ] Linked documentation in main README
- [ ] Team members can navigate codebase using docs

## What's Next?

Now that your architecture is documented:
1. **Share with others** - Get feedback on clarity
2. **Keep it updated** - Make doc updates part of your workflow
3. **Move to [Contributing Guidelines](./04_CONTRIBUTING.md)** - Set expectations for contributors

**Congratulations! Your codebase is no longer a hairball.** 🎉

Anyone can now understand your system without reading every line of code.

---

**Pro Tips:**
- Update docs in the same PR as code changes
- Use diagrams for complex flows - a picture is worth 1000 words
- Write for someone who's never seen your code before
- Review docs every few months for accuracy
- Ask new contributors what was confusing - then document it

[← Back: Testing Strategy](./02_TESTING_STRATEGY.md) | [Next: Contributing Guidelines →](./04_CONTRIBUTING.md)
