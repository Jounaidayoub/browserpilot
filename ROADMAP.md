# Project Improvement Roadmap

## Browser Assistant Extension - Implementation Plan

**Created:** 2025-11-16  
**Status:** Draft  
**Timeline:** 12 weeks

---

## Overview

This roadmap provides a practical, step-by-step plan to address the issues identified in the code review and transform this project from a prototype to a production-ready Chrome extension.

---

## Quick Wins (Week 1)

These tasks can be completed in 1-2 days and will immediately improve code quality.

### Day 1: Dependency & Security

- [ ] **Update Dependencies**
  ```bash
  npm audit fix
  npm update vite
  npm update tar
  ```

- [ ] **Fix Package.json**
  - [ ] Rename: `"browser-assitant"` → `"browser-assistant"`
  - [ ] Add test scripts
  - [ ] Add lint scripts

- [ ] **Clean Up Files**
  - [ ] Delete `src/diff.js`
  - [ ] Delete `src/1.yaml`
  - [ ] Delete `src/2.yaml`
  - [ ] Delete `src/components/HelloWorld.tsx`

### Day 2: Code Cleanup

- [ ] **Fix All Typos**
  - [ ] Search for "assitant" → "assistant"
  - [ ] Search for "instanting" → "instantiating"
  - [ ] Search for "Withcontent" → "withContent"
  - [ ] Search for "handelling" → "handling"
  - [ ] Search for "responsivle" → "responsible"
  - [ ] Search for "comming" → "coming"
  - [ ] Search for "excutee" → "execute"

- [ ] **Remove Debugging Code**
  - [ ] Remove all `console.log` statements (except errors)
  - [ ] Remove commented code blocks in `background.ts`
  - [ ] Remove commented code in `ChatBotDemo.tsx`
  - [ ] Remove commented code in `content/main.tsx`

- [ ] **Fix Manifest Issues**
  - [ ] Remove empty string from permissions array
  - [ ] Remove `chrome://*/*` from host_permissions
  - [ ] Add comments documenting each permission

### Day 3: Basic Tooling

- [ ] **Set Up Linting**
  ```bash
  npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
  npm install -D eslint-plugin-react eslint-plugin-react-hooks
  ```
  
  - [ ] Create `.eslintrc.json`
  - [ ] Add lint script to package.json
  - [ ] Run and fix lint errors

- [ ] **Set Up Prettier**
  ```bash
  npm install -D prettier eslint-config-prettier
  ```
  
  - [ ] Create `.prettierrc`
  - [ ] Format all files
  - [ ] Add format script

- [ ] **Add Git Hooks**
  ```bash
  npm install -D husky lint-staged
  ```
  
  - [ ] Configure pre-commit hook
  - [ ] Configure commit message linting

**Week 1 Deliverables:**
- ✅ Zero npm vulnerabilities
- ✅ All files formatted consistently
- ✅ No typos in code or comments
- ✅ Linting passing
- ✅ Clean git history

---

## Phase 1: Foundation (Weeks 2-3)

### Week 2: Testing Infrastructure

**Goal:** Set up testing framework and write initial tests

#### Day 1-2: Test Setup

- [ ] **Install Testing Dependencies**
  ```bash
  npm install -D vitest @testing-library/react @testing-library/user-event
  npm install -D @testing-library/jest-dom jsdom
  npm install -D sinon-chrome
  ```

- [ ] **Configure Vitest**
  - [ ] Create `vitest.config.ts`
  - [ ] Set up test utilities
  - [ ] Configure coverage reporting

- [ ] **Create Test Structure**
  ```
  src/
    tools/
      __tests__/
        Tabs.test.ts
        Page.test.ts
    background/
      __tests__/
        messageHandlers.test.ts
  ```

#### Day 3-5: Write Core Tests

- [ ] **Tool Tests**
  - [ ] `get_tabs` tool test
  - [ ] `get_groups` tool test
  - [ ] `close_tabs` tool test
  - [ ] `group_tabs_by_ids` tool test

- [ ] **Message Handler Tests**
  - [ ] `handleOpenNewTab` test
  - [ ] `handleGetPageContent` test
  - [ ] `handleGetDomSnapshot` test

- [ ] **Utility Tests**
  - [ ] `truncate` function test
  - [ ] `parseSnapshotOptions` test
  - [ ] `formatZodIssues` test

**Week 2 Deliverables:**
- ✅ Vitest configured and running
- ✅ At least 20 tests written
- ✅ CI/CD runs tests automatically
- ✅ Code coverage report generated

### Week 3: Type Safety & Documentation

#### Day 1-2: Improve Type Safety

- [ ] **Remove `any` Types**
  - [ ] Fix `Inspector.ts` - remove all `any` types
  - [ ] Fix `messageHandlers.ts` - type all messages
  - [ ] Fix any remaining `any` types

- [ ] **Define Message Types**
  ```typescript
  // types/messages.ts
  export type BackgroundMessage = 
    | OpenNewTabMessage
    | GetPageContentMessage
    | GetDomSnapshotMessage;
  
  export interface OpenNewTabMessage {
    action: 'open-new-tab';
    url: string;
    withContent?: boolean;
  }
  // ... more types
  ```

- [ ] **Enable Strict Mode**
  - [ ] Update `tsconfig.json` with `strict: true`
  - [ ] Fix all resulting errors
  - [ ] Add `noUncheckedIndexedAccess: true`

#### Day 3-5: Add Documentation

- [ ] **JSDoc Comments**
  - [ ] Document all exported functions
  - [ ] Document all tool functions
  - [ ] Document message handlers

- [ ] **README Updates**
  - [ ] Add actual project description
  - [ ] Add features list
  - [ ] Add screenshots
  - [ ] Add development instructions
  - [ ] Add architecture diagram

- [ ] **Additional Docs**
  - [ ] Create `CONTRIBUTING.md`
  - [ ] Create `DEVELOPMENT.md`
  - [ ] Create `API.md` for tool system
  - [ ] Add LICENSE file

**Week 3 Deliverables:**
- ✅ TypeScript strict mode enabled
- ✅ Zero `any` types in codebase
- ✅ All public APIs documented
- ✅ Updated README
- ✅ Contributing guide

---

## Phase 2: Refactoring (Weeks 4-6)

### Week 4: Background Service Refactor

**Goal:** Clean up background script architecture

#### Day 1-2: Split Background Script

- [ ] **Create Service Classes**
  ```typescript
  // background/crx-manager.ts
  export class CrxManager {
    async initialize(): Promise<CrxApplication> { }
    async attach(tabId: number): Promise<Page> { }
  }
  
  // background/message-router.ts
  export class MessageRouter {
    registerHandler(handler: MessageHandler): void { }
    route(message: unknown): Promise<Response> { }
  }
  
  // background/command-manager.ts
  export class CommandManager {
    registerCommands(): void { }
    handleCommand(command: string): void { }
  }
  ```

- [ ] **Merge `bg.ts` and `background.ts`**
  - [ ] Combine into single `background/index.ts`
  - [ ] Remove redundant file

#### Day 3-4: Improve Message Handling

- [ ] **Type-Safe Message Router**
  - [ ] Create message validation
  - [ ] Add timeout handling
  - [ ] Add error recovery
  - [ ] Add logging

- [ ] **Rate Limiting**
  - [ ] Implement basic rate limiter
  - [ ] Apply to message handlers
  - [ ] Add user feedback for rate limits

#### Day 5: Testing

- [ ] Write tests for new background services
- [ ] Test message routing
- [ ] Test error handling

**Week 4 Deliverables:**
- ✅ Background script modularized
- ✅ Type-safe message passing
- ✅ Error handling in place
- ✅ Tests for background services

### Week 5: Component Refactoring

**Goal:** Break down large components, improve structure

#### Day 1-3: Refactor ChatBotDemo

- [ ] **Rename File**
  - [ ] `ChatBotDemo.tsx` → `ChatInterface.tsx`

- [ ] **Extract Components**
  ```typescript
  // sidepanel/components/ChatHeader.tsx
  // - Model selection
  // - Settings button
  // - Theme toggle
  
  // sidepanel/components/ChatMessages.tsx
  // - Message list
  // - Scroll management
  // - Tool result display
  
  // sidepanel/components/ChatInput.tsx
  // - Prompt input
  // - Attachments
  // - Submit button
  
  // sidepanel/components/ChatToolbar.tsx
  // - Actions
  // - Inspector toggle
  // - Web search toggle
  ```

- [ ] **Extract Business Logic**
  ```typescript
  // sidepanel/services/chat-service.ts
  export class ChatService {
    sendMessage(text: string, files: File[]): Promise<void> { }
    regenerate(): Promise<void> { }
    stop(): void { }
  }
  
  // sidepanel/hooks/useChat.ts
  // Wrap AI SDK hooks with application logic
  ```

#### Day 4-5: Refactor Agent/Snapshot

- [ ] **Rename File**
  - [ ] `agent.ts` → `services/dom-snapshot.ts`

- [ ] **Extract Functions**
  ```typescript
  // services/dom-snapshot/options.ts
  export class SnapshotOptions {
    static parse(input: string): ParsedOptions { }
  }
  
  // services/dom-snapshot/cleaners.ts
  export function cleanElement(element: Element): string { }
  export function getElementStructure(element: Element): string { }
  
  // services/dom-snapshot/capture.ts
  export async function captureSnapshot(
    page: Page,
    options: SnapshotOptions
  ): Promise<string> { }
  ```

- [ ] **Add Tests**
  - [ ] Test option parsing
  - [ ] Test element cleaning
  - [ ] Test snapshot capture

**Week 5 Deliverables:**
- ✅ ChatBotDemo split into 5+ components
- ✅ Each component under 100 lines
- ✅ Business logic separated from UI
- ✅ DOM snapshot code modularized
- ✅ Tests for all new modules

### Week 6: Tool System Enhancement

**Goal:** Improve tool system architecture

#### Day 1-2: Generic Output Types

- [ ] **Update Tool Interface**
  ```typescript
  export interface Tool<TInput, TOutput> {
    name: string;
    description: string;
    inputSchema: z.ZodType<TInput>;
    outputSchema: z.ZodType<TOutput>;
    execute: (input: TInput) => Promise<TOutput>;
  }
  ```

- [ ] **Migrate Existing Tools**
  - [ ] Update each tool to new interface
  - [ ] Define output schemas
  - [ ] Remove JSON.stringify calls

#### Day 3-4: Tool Enhancements

- [ ] **Add Tool Categories**
  ```typescript
  export enum ToolCategory {
    TAB_MANAGEMENT = 'tab-management',
    PAGE_INTERACTION = 'page-interaction',
    NAVIGATION = 'navigation',
    DATA_EXTRACTION = 'data-extraction',
  }
  ```

- [ ] **Add Tool Metadata**
  ```typescript
  interface ToolMetadata {
    version: string;
    author: string;
    category: ToolCategory;
    permissions: string[];
  }
  ```

- [ ] **Implement Tool Middleware**
  - [ ] Logging middleware
  - [ ] Rate limiting middleware
  - [ ] Error handling middleware

#### Day 5: Documentation & Tests

- [ ] Document tool creation process
- [ ] Write tool system tests
- [ ] Create example custom tool

**Week 6 Deliverables:**
- ✅ Generic output types
- ✅ Tool categorization
- ✅ Tool middleware system
- ✅ Complete tool documentation
- ✅ Tool creation examples

---

## Phase 3: Security & Performance (Weeks 7-8)

### Week 7: Security Hardening

#### Day 1-2: Fix Trusted Types

- [ ] **Install DOMPurify**
  ```bash
  npm install dompurify
  npm install -D @types/dompurify
  ```

- [ ] **Rewrite Policy**
  ```javascript
  // policy.js
  import DOMPurify from 'dompurify';
  
  trustedTypes.createPolicy('default', {
    createHTML: (string) => DOMPurify.sanitize(string),
    createScriptURL: (string) => {
      // Validate and whitelist
    },
    createScript: (string) => {
      // Validate and whitelist
    },
  });
  ```

- [ ] **Test Policy**
  - [ ] Test with malicious input
  - [ ] Verify XSS prevention

#### Day 3-4: Permissions Audit

- [ ] **Review Each Permission**
  - [ ] Document necessity of each
  - [ ] Remove unused permissions
  - [ ] Consider optional permissions

- [ ] **Minimize Host Permissions**
  - [ ] Use `activeTab` where possible
  - [ ] Request additional permissions at runtime
  - [ ] Update documentation

#### Day 5: Security Testing

- [ ] **Manual Security Review**
  - [ ] Test XSS vectors
  - [ ] Test permission boundaries
  - [ ] Test message injection

- [ ] **Automated Security Scanning**
  - [ ] Run npm audit
  - [ ] Use Snyk or similar tool
  - [ ] Document findings

**Week 7 Deliverables:**
- ✅ Trusted Types properly configured
- ✅ Minimal permissions used
- ✅ Security audit completed
- ✅ No known vulnerabilities

### Week 8: Performance Optimization

#### Day 1-2: Bundle Optimization

- [ ] **Analyze Bundle**
  ```bash
  npm install -D rollup-plugin-visualizer
  ```
  
  - [ ] Generate bundle visualization
  - [ ] Identify large dependencies
  - [ ] Plan code splitting

- [ ] **Implement Code Splitting**
  - [ ] Lazy load AI components
  - [ ] Lazy load UI libraries
  - [ ] Dynamic imports for tools

#### Day 3-4: DOM Snapshot Optimization

- [ ] **Add Web Worker**
  ```typescript
  // workers/dom-processor.worker.ts
  // Move heavy processing off main thread
  ```

- [ ] **Implement Streaming**
  - [ ] Stream large DOM captures
  - [ ] Add progress callbacks
  - [ ] Implement cancellation

- [ ] **Add Caching**
  - [ ] Cache recent snapshots
  - [ ] Implement cache invalidation
  - [ ] Add cache size limits

#### Day 5: Performance Testing

- [ ] **Measure Performance**
  - [ ] Capture baseline metrics
  - [ ] Measure after optimizations
  - [ ] Document improvements

- [ ] **Performance Budget**
  - [ ] Set bundle size limits
  - [ ] Set performance targets
  - [ ] Add performance CI checks

**Week 8 Deliverables:**
- ✅ 30% reduction in bundle size
- ✅ DOM snapshots use web workers
- ✅ Performance metrics tracked
- ✅ Performance budget enforced

---

## Phase 4: Polish & Production (Weeks 9-12)

### Week 9: State Management

#### Day 1-3: Implement State Management

- [ ] **Choose Solution**
  - [ ] Evaluate: Zustand vs Chrome Storage vs Both
  - [ ] Document decision

- [ ] **Implement Chat State**
  ```typescript
  // store/chat-store.ts
  export const useChatStore = create((set) => ({
    messages: [],
    model: 'gpt-4o',
    settings: {},
    // ... actions
  }));
  ```

- [ ] **Implement Settings State**
  - [ ] Persist to chrome.storage
  - [ ] Sync across components
  - [ ] Add migration system

#### Day 4-5: Migrate Components

- [ ] Update components to use new state
- [ ] Remove local useState where appropriate
- [ ] Test state synchronization

**Week 9 Deliverables:**
- ✅ Centralized state management
- ✅ Persistent settings
- ✅ State synchronized across components

### Week 10: Error Handling & UX

#### Day 1-2: Error Handling

- [ ] **React Error Boundaries**
  ```typescript
  // components/ErrorBoundary.tsx
  export class ErrorBoundary extends React.Component {
    componentDidCatch(error, errorInfo) {
      // Log to service
      // Show fallback UI
    }
  }
  ```

- [ ] **User-Friendly Errors**
  - [ ] Create error message catalog
  - [ ] Add error recovery suggestions
  - [ ] Implement retry mechanisms

#### Day 3-5: UX Improvements

- [ ] **Loading States**
  - [ ] Add skeleton screens
  - [ ] Add progress indicators
  - [ ] Add optimistic updates

- [ ] **Keyboard Navigation**
  - [ ] Audit all interactive elements
  - [ ] Add keyboard shortcuts
  - [ ] Add shortcuts help overlay

- [ ] **Accessibility**
  - [ ] Add ARIA labels
  - [ ] Test with screen readers
  - [ ] Ensure keyboard-only navigation

**Week 10 Deliverables:**
- ✅ Comprehensive error handling
- ✅ Better loading states
- ✅ Full keyboard navigation
- ✅ WCAG 2.1 AA compliance

### Week 11: Integration & E2E Tests

#### Day 1-3: Integration Tests

- [ ] **Test Message Flow**
  - [ ] UI → Background → Tool → UI
  - [ ] Error propagation
  - [ ] State synchronization

- [ ] **Test Tool Integration**
  - [ ] Tool execution pipeline
  - [ ] Input validation
  - [ ] Output handling

#### Day 4-5: E2E Tests

- [ ] **Install Playwright**
  ```bash
  npm install -D @playwright/test
  ```

- [ ] **Write E2E Tests**
  - [ ] Extension installation
  - [ ] Side panel interaction
  - [ ] Tool execution
  - [ ] Inspector workflow

**Week 11 Deliverables:**
- ✅ Integration tests passing
- ✅ E2E test suite
- ✅ 80% code coverage
- ✅ CI/CD runs all tests

### Week 12: Documentation & Release Prep

#### Day 1-2: User Documentation

- [ ] **User Guide**
  - [ ] Features overview
  - [ ] Screenshots and videos
  - [ ] Common use cases
  - [ ] Troubleshooting

- [ ] **Privacy Policy**
  - [ ] Data collection disclosure
  - [ ] AI API usage explanation
  - [ ] Third-party services

#### Day 3-4: Developer Documentation

- [ ] **Complete Architecture Doc**
- [ ] **API Reference**
- [ ] **Tool Creation Guide**
- [ ] **Extension Guide**

#### Day 5: Release Preparation

- [ ] **Version 1.0.0 Checklist**
  - [ ] All tests passing
  - [ ] No security vulnerabilities
  - [ ] Documentation complete
  - [ ] Performance targets met
  - [ ] Accessibility verified

- [ ] **Chrome Web Store Assets**
  - [ ] Screenshots (1280x800 or 640x400)
  - [ ] Promotional images
  - [ ] Detailed description
  - [ ] Privacy policy link

**Week 12 Deliverables:**
- ✅ Complete documentation
- ✅ Release v1.0.0
- ✅ Chrome Web Store submission
- ✅ Public repository

---

## Ongoing Maintenance

### Weekly Tasks

- [ ] Review and respond to issues
- [ ] Update dependencies
- [ ] Monitor error logs
- [ ] Review performance metrics

### Monthly Tasks

- [ ] Security audit
- [ ] Dependency audit
- [ ] Performance review
- [ ] User feedback review

### Quarterly Tasks

- [ ] Major version planning
- [ ] Architecture review
- [ ] Competitor analysis
- [ ] User survey

---

## Success Metrics

### Code Quality
- ✅ Test coverage > 80%
- ✅ Zero TypeScript `any` types
- ✅ All ESLint rules passing
- ✅ Zero security vulnerabilities

### Performance
- ✅ Bundle size < 5MB
- ✅ Time to interactive < 2s
- ✅ DOM snapshot < 500ms for average page

### User Experience
- ✅ WCAG 2.1 AA compliant
- ✅ Full keyboard navigation
- ✅ < 2% error rate

### Documentation
- ✅ All APIs documented
- ✅ User guide complete
- ✅ Developer guide complete
- ✅ Architecture documented

---

## Risk Management

### High Risk Items

1. **Playwright Integration**
   - Risk: May be unstable or have compatibility issues
   - Mitigation: Implement fallback mode without Playwright

2. **Chrome API Changes**
   - Risk: Manifest V3 still evolving
   - Mitigation: Stay updated with Chrome releases, have migration plan

3. **AI API Dependency**
   - Risk: External service may be unavailable
   - Mitigation: Support multiple providers, graceful degradation

### Medium Risk Items

1. **Performance on Large Pages**
   - Risk: DOM snapshots may timeout
   - Mitigation: Implement streaming, add size limits

2. **Permission Concerns**
   - Risk: Users may reject broad permissions
   - Mitigation: Minimize permissions, use optional permissions

---

## Notes

- This roadmap is a guide, not a contract
- Priorities may shift based on user feedback
- Some weeks may take longer than estimated
- Security and testing should never be skipped

---

*Created: 2025-11-16*  
*Last Updated: 2025-11-16*
