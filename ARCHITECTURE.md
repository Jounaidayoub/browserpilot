# Architecture Documentation

## Browser Assistant Chrome Extension - Technical Architecture

**Version:** 1.0.0  
**Last Updated:** 2025-11-16

---

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Extension Lifecycle](#extension-lifecycle)
7. [Security Architecture](#security-architecture)
8. [Communication Patterns](#communication-patterns)
9. [State Management](#state-management)
10. [Tool System Architecture](#tool-system-architecture)

---

## System Overview

### Purpose
The Browser Assistant is a Chrome extension that provides AI-powered assistance for web browsing. It integrates an AI chat interface with browser automation capabilities through Playwright, allowing users to interact with web pages using natural language.

### Key Features
- **AI Chat Interface**: Conversational UI in side panel
- **Browser Automation**: Control tabs, navigate pages, extract content
- **Element Inspector**: Visual element selection for interaction
- **Multi-Model Support**: Compatible with different AI models (GPT-4, DeepSeek R1)
- **Tool System**: Extensible architecture for adding new capabilities

### User Personas
1. **Power Users**: Automate repetitive browsing tasks
2. **Researchers**: Extract and analyze web content
3. **Developers**: Debug and inspect web pages
4. **General Users**: Get assistance with complex web interactions

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Chrome Browser                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User Interface Layer                                                │
│  ┌────────────┐  ┌─────────────────────┐  ┌──────────────────┐    │
│  │   Popup    │  │    Side Panel       │  │  Content Script  │    │
│  │            │  │  ┌───────────────┐  │  │  - Inspector     │    │
│  │  - Settings│  │  │  Chat UI      │  │  │  - Page Monitor  │    │
│  │  - Status  │  │  │  - Messages   │  │  │  - Event Relay   │    │
│  │            │  │  │  - Input      │  │  │                  │    │
│  └────┬───────┘  │  │  - Tools      │  │  └────────┬─────────┘    │
│       │          │  └───────┬───────┘  │           │               │
│       │          └──────────┼──────────┘           │               │
│       │                     │                       │               │
│       └─────────────────────┴───────────────────────┘               │
│                             │                                        │
│  ─────────────────────────────────────────────────────────────────  │
│                             │                                        │
│  Business Logic Layer                                                │
│                      ┌──────▼──────┐                                │
│                      │   Message   │                                │
│                      │   Router    │                                │
│                      └──────┬──────┘                                │
│                             │                                        │
│         ┌───────────────────┼───────────────────┐                   │
│         │                   │                   │                   │
│    ┌────▼─────┐      ┌──────▼──────┐    ┌──────▼──────┐           │
│    │   Tool   │      │  Playwright │    │   Chrome    │           │
│    │ Executor │      │     CRX     │    │     API     │           │
│    │          │      │  Integration│    │   Wrapper   │           │
│    └────┬─────┘      └──────┬──────┘    └──────┬──────┘           │
│         │                   │                   │                   │
│         └───────────────────┴───────────────────┘                   │
│                             │                                        │
│  Infrastructure Layer                                                │
│                      ┌──────▼──────┐                                │
│                      │ Background  │                                │
│                      │   Service   │                                │
│                      │   Worker    │                                │
│                      └─────────────┘                                │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  External Services                                                    │
│  ┌─────────────┐                     ┌──────────────┐               │
│  │   AI API    │                     │  Web Pages   │               │
│  │  (OpenAI,   │                     │  (Target     │               │
│  │  DeepSeek)  │                     │   Content)   │               │
│  └─────────────┘                     └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Popup Component (`src/popup/`)

**Purpose**: Quick access interface, currently displays template content

**Current State**: Minimal functionality, shows logo and template message

**Planned Enhancements**:
- Extension status dashboard
- Quick settings
- Recent actions history

**Files**:
- `App.tsx`: Main popup component
- `index.html`: Popup entry point
- `main.tsx`: React mount point

---

### 2. Side Panel Component (`src/sidepanel/`)

**Purpose**: Main user interface for AI chat interaction

**Key Components**:
- **ChatBotDemo.tsx**: Primary chat interface (needs refactoring)
  - Message display and history
  - Input handling
  - Model selection
  - Tool visualization
  - Web search toggle

- **Inspector.ts**: Element selection utility
  - Visual overlay for element selection
  - Event handling for mouse interactions
  - Message relay to side panel

- **evaluator.ts**: Tool execution coordinator
  - Dispatches tool calls to appropriate handlers
  - Validates input/output
  - Error handling

**State**:
- Chat messages and history
- Current model selection
- UI preferences (theme, etc.)
- Tool execution status

**Dependencies**:
- AI SDK (@ai-sdk/react) for chat functionality
- Radix UI components for interface
- Tailwind CSS for styling

---

### 3. Content Scripts (`src/content/`)

**Purpose**: Inject functionality into web pages

**Responsibilities**:
- Listen for keyboard shortcuts
- Relay messages between page and extension
- Inject inspector overlay when requested
- Monitor page state

**Current Implementation**:
```typescript
// Keyboard shortcut handler
Ctrl+Shift+S → Toggle side panel

// Message relay
Page → Content Script → Background → Side Panel
```

**Security Considerations**:
- Runs in isolated world (separate from page JavaScript)
- Limited access to page DOM
- Must validate all messages from page

---

### 4. Background Service Worker (`src/background.ts`)

**Purpose**: Central coordinator and persistent service

**Responsibilities**:
- Initialize Playwright CRX
- Route messages between components
- Manage Chrome API interactions
- Handle extension lifecycle events
- Maintain state across extension components

**Key Functions**:
```typescript
// Initialization
- Start Playwright CRX application
- Register command handlers
- Set up side panel behavior

// Message Handling
- Route messages to appropriate handlers
- Coordinate tool execution
- Manage page access

// Lifecycle Management
- onStartup: Initialize services
- onInstalled: Configure defaults
- onCommand: Handle keyboard shortcuts
```

**Current Issues**:
- Large commented code blocks
- Minimal error recovery
- No fallback if Playwright fails
- Mixed concerns (routing + Playwright management)

---

### 5. Tool System (`src/tools/`)

**Purpose**: Extensible system for AI agent capabilities

**Architecture**:
```typescript
interface Tool<TInput> {
  name: string;              // Unique identifier
  description: string;       // For AI model understanding
  inputSchema: ZodSchema;    // Input validation
  execute: (input) => Promise<string>;  // Execution logic
}
```

**Available Tools**:

| Tool Name | Purpose | Chrome API Used |
|-----------|---------|-----------------|
| `get_tabs` | List all browser tabs | `chrome.tabs.query` |
| `get_groups` | List tab groups | `chrome.tabGroups.query` |
| `close_tabs` | Close specified tabs | `chrome.tabs.remove` |
| `group_tabs_by_ids` | Create tab groups | `chrome.tabs.group` |
| `open_new_tab` | Open URL in new tab | Playwright |
| `run_script` | Execute JavaScript | `chrome.scripting.executeScript` |
| `get_tab_content` | Extract readable content | Readability API |
| `get_page_content` | Get page DOM | Playwright |
| `get_page_dom_snapshot` | Get AI-optimized snapshot | Playwright |

**Tool Execution Flow**:
```
1. AI generates tool call with parameters
2. evaluator.ts validates input against schema
3. Tool.execute() runs the logic
4. Result stringified and returned to AI
5. AI incorporates result into response
```

**Design Strengths**:
- ✅ Type-safe with Zod validation
- ✅ Easy to add new tools
- ✅ Centralized registry (ToolStore)
- ✅ Clear separation of concerns

**Design Weaknesses**:
- ❌ All outputs are strings (no rich types)
- ❌ No tool versioning
- ❌ No permission system
- ❌ No rate limiting
- ❌ No tool composition

---

### 6. Agent System (`src/agent.ts`)

**Purpose**: DOM snapshot and content extraction

**Note**: Misnamed - should be renamed to `dom-snapshot.ts`

**Key Function**: `captureDomSnapshot()`
- Captures page DOM structure
- Multiple modes: raw, clean, structure
- Selector-based capture support
- Configurable output limits

**Modes**:
1. **Raw**: Complete HTML with all attributes
2. **Clean**: Remove scripts, styles, data attributes
3. **Structure**: Element tree without content

**Options**:
```typescript
{
  selector: string;      // Target specific elements
  clean: boolean;        // Remove non-visual elements
  structure: boolean;    // Show structure only
  limit: number;         // Max characters to return
}
```

**Performance Considerations**:
- Large DOM captures can take seconds
- Blocking operation on main thread
- No progress feedback
- Memory intensive for large pages

---

## Data Flow

### 1. User Sends Chat Message

```
User types message
      ↓
PromptInput component (ChatBotDemo.tsx)
      ↓
sendMessage() from useChat hook
      ↓
HTTP POST to AI API (localhost:8080)
      ↓
AI model processes with tools available
      ↓
Response streamed back
      ↓
Messages state updated
      ↓
UI re-renders with new messages
```

### 2. AI Executes Tool

```
AI decides to use tool (e.g., get_tabs)
      ↓
onToolCall() callback triggered
      ↓
evaluateToolCall() in evaluator.ts
      ↓
Lookup tool in ToolStore
      ↓
Validate input with Zod schema
      ↓
Execute tool.execute() function
      ↓
Tool calls chrome.tabs.query()
      ↓
Result stringified
      ↓
addToolResult() sends back to AI
      ↓
AI continues processing with result
```

### 3. Element Inspector Workflow

```
User clicks "Inspect" button
      ↓
injectInspector() sends message
      ↓
Background script receives message
      ↓
Inject Inspector.ts into page
      ↓
User hovers over elements
      ↓
Overlay highlights elements
      ↓
User clicks element
      ↓
window.postMessage() to content script
      ↓
Content script forwards to background
      ↓
Background sends to side panel
      ↓
Side panel displays element info
```

### 4. Background Message Routing

```
Component sends chrome.runtime.sendMessage()
      ↓
Background service worker receives
      ↓
Loop through messageHandlers array
      ↓
Each handler checks message.action
      ↓
Matching handler processes message
      ↓
Handler executes async operation
      ↓
sendResponse() called with result
      ↓
Original sender receives response
```

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.0 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 7.0.5 | Build tool |
| Tailwind CSS | 4.1.14 | Styling |

### Chrome Extension

| Technology | Purpose |
|------------|---------|
| Manifest V3 | Extension configuration |
| CRXJS | Vite plugin for extensions |
| Chrome APIs | Browser integration |

### AI Integration

| Technology | Purpose |
|------------|---------|
| AI SDK | Chat interface & streaming |
| @ai-sdk/react | React hooks for AI |

### Browser Automation

| Technology | Purpose |
|------------|---------|
| Playwright | Browser automation |
| playwright-crx | Chrome extension adapter |

### UI Components

| Technology | Purpose |
|------------|---------|
| Radix UI | Accessible components |
| Lucide React | Icons |
| Motion | Animations |

### Utilities

| Technology | Purpose |
|------------|---------|
| Zod | Runtime validation |
| Nanoid | ID generation |
| Readability | Content extraction |
| Streamdown | Markdown streaming |

---

## Extension Lifecycle

### Installation

```
1. User installs extension
      ↓
2. chrome.runtime.onInstalled fires
      ↓
3. Set side panel behavior
      ↓
4. Initialize default settings
      ↓
5. Register content scripts
      ↓
6. Extension ready
```

### Startup

```
1. Browser launches
      ↓
2. chrome.runtime.onStartup fires
      ↓
3. Background service worker starts
      ↓
4. Initialize Playwright CRX
      ↓
5. Register message handlers
      ↓
6. Register keyboard commands
      ↓
7. Ready for user interaction
```

### User Interaction

```
User clicks extension icon
      ↓
Side panel opens
      ↓
ChatBotDemo component mounts
      ↓
useChat() initializes connection
      ↓
User interface ready
      ↓
User can start chatting
```

### Page Navigation

```
User navigates to new page
      ↓
Content script injected
      ↓
policy.js sets Trusted Types
      ↓
main.tsx registers listeners
      ↓
Page monitoring active
```

---

## Security Architecture

### Manifest Permissions

**Current Permissions** (with justification):

| Permission | Justification | Risk Level |
|------------|---------------|------------|
| `sidePanel` | Main UI interface | Low |
| `tabs` | Manage and query tabs | Medium |
| `tabGroups` | Organize tabs | Low |
| `history` | Search browsing history | Medium |
| `activeTab` | Access current tab | Low |
| `scripting` | Execute scripts in pages | High |
| `debugger` | Page inspection (?) | Very High |
| `storage` | Store settings | Low |
| `contentSettings` | Unknown usage | Medium |

**Security Concerns**:
- ⚠️ `debugger` permission is very powerful, may be unnecessary
- ⚠️ `scripting` allows code injection - must be careful
- ⚠️ Host permissions for all URLs is broad

### Content Security

**Trusted Types Policy** (`src/policy.js`):
- **Current**: Bypass all sanitization (INSECURE!)
- **Should**: Sanitize HTML, validate script URLs
- **Impact**: XSS vulnerability if malicious content injected

**Isolation**:
- Content scripts run in isolated world
- Cannot access page JavaScript directly
- Must use postMessage for communication

### Data Privacy

**Data Handled**:
- Page content and DOM
- Browsing history
- Tab information
- User chat messages

**Storage**:
- Local storage for settings
- No user data sent to external servers (except AI API)
- Chat history stored in memory only

**AI API Communication**:
- HTTP requests to localhost:8080 (development)
- Page content included in requests
- Should use HTTPS in production
- Should allow user to choose endpoint

---

## Communication Patterns

### Message Passing

Chrome extensions use message passing for inter-component communication:

```typescript
// Sender (any component)
chrome.runtime.sendMessage({
  action: 'get-page-content',
  tabId: 123
}, (response) => {
  console.log(response);
});

// Receiver (background script)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'get-page-content') {
    // Handle message
    sendResponse({ success: true, content: '...' });
    return true;  // Keep channel open for async
  }
});
```

### Current Message Types

| Action | From | To | Purpose |
|--------|------|-----|---------|
| `open-new-tab` | Side Panel | Background | Open URL with Playwright |
| `get-page-content` | Tools | Background | Get page HTML |
| `get_page_dom_snapshot` | Tools | Background | Get AI snapshot |
| `open-sidepanel` | Content | Background | Show side panel |
| `close-sidepanel` | Content | Background | Hide side panel |
| `ELEMENT_INSPECTOR_SELECTED` | Page | Content | Element clicked |
| `ELEMENT_INSPECTOR_RESULT` | Content | Background | Forward selection |

### Problems with Current Implementation

1. **No Type Safety**: Messages are `any` type
2. **No Validation**: Inputs not checked before use
3. **No Error Handling**: Failures silently ignored
4. **No Timeout**: Messages can hang forever
5. **No Rate Limiting**: Can be spammed

---

## State Management

### Current Approach

**No Centralized State Management**

Each component manages its own state:
- Side panel: `useState` for UI state
- Background: In-memory variables
- Content: Local variables

### Problems

1. **State Sync**: No way to sync state across components
2. **Persistence**: State lost on extension reload
3. **Debugging**: Can't inspect global state
4. **Race Conditions**: Multiple components may conflict

### Recommended Approach

**Option 1: Zustand** (Lightweight)
```typescript
// store/chat-store.ts
import create from 'zustand';

export const useChatStore = create((set) => ({
  messages: [],
  model: 'gpt-4o',
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg]
  })),
  setModel: (model) => set({ model }),
}));
```

**Option 2: Chrome Storage + Events**
```typescript
// Persist to chrome.storage
await chrome.storage.local.set({ messages });

// Listen for changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.messages) {
    updateUI(changes.messages.newValue);
  }
});
```

---

## Tool System Architecture

### Design Philosophy

**Extensibility**: Easy to add new tools without modifying core

**Type Safety**: Compile-time and runtime validation

**Isolation**: Each tool is independent

**Discoverability**: AI model can see all available tools

### Tool Registration

```typescript
// tools/index.ts
const registeredTools: Tool[] = [
  get_tabs,
  get_groups,
  close_tabs,
  // ... more tools
];

const ToolStore = new Map(
  registeredTools.map(tool => [tool.name, tool])
);
```

### Creating a New Tool

```typescript
// tools/NewFeature.ts
import z from 'zod';
import type { Tool } from './types';

const myToolInput = z.object({
  parameter: z.string(),
});

export const myTool: Tool<typeof myToolInput> = {
  name: 'my_tool',
  description: 'What this tool does for the AI to understand',
  inputSchema: myToolInput,
  execute: async ({ parameter }) => {
    // Implementation
    const result = await doSomething(parameter);
    return JSON.stringify(result);
  },
};

// Add to tools/index.ts
import { myTool } from './NewFeature';
const registeredTools = [..., myTool];
```

### Tool Categories (Proposed)

1. **Tab Management**: Control browser tabs
2. **Page Interaction**: Read and manipulate page content
3. **Navigation**: Control browsing
4. **Data Extraction**: Get structured data from pages
5. **Automation**: Perform multi-step tasks

---

## Future Architecture Considerations

### Scalability

**Current Limitations**:
- Single background worker (no parallelism)
- In-memory only (no persistence)
- No request queuing
- No tool orchestration

**Improvements Needed**:
- Task queue for long operations
- Persistent storage for history
- Worker pool for parallel execution
- Tool composition framework

### Performance

**Current Bottlenecks**:
- Large DOM snapshots block main thread
- No caching of repeated operations
- Synchronous tool execution
- No lazy loading of components

**Optimizations**:
- Web Workers for heavy processing
- Cache frequently accessed data
- Async tool execution with progress
- Code splitting and lazy loading

### Reliability

**Current Issues**:
- No error recovery
- Silent failures
- No retry logic
- No health checks

**Improvements**:
- Graceful degradation
- Automatic retries with backoff
- Error reporting to user
- Service health monitoring

---

## Conclusion

The current architecture provides a solid foundation but needs significant refinement:

**Strengths**:
- Clear separation between UI, logic, and infrastructure
- Extensible tool system
- Modern tech stack
- Innovative Playwright integration

**Needs Improvement**:
- Security hardening
- State management
- Error handling
- Type safety
- Performance optimization
- Documentation

This architecture document should be updated as the system evolves.

---

*Last updated: 2025-11-16*
