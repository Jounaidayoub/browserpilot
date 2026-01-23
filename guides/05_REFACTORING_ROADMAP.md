# Guide 5: Refactoring Roadmap

## Overview

**Time:** Ongoing (weeks to months)  
**Priority:** Important for long-term health  
**Impact:** Long-term code maintainability  
**Learning Goals:** Refactoring techniques, technical debt management, incremental improvement

## Why This Matters

> "The only way to go fast is to go well." - Uncle Bob Martin

You've built safety nets (tests, linting, docs). Now you can refactor confidently without fear of breaking things. This guide helps you identify, prioritize, and systematically eliminate technical debt.

### What You'll Gain
- **Cleaner codebase:** Easier to understand and modify
- **Faster development:** Less time fighting with code
- **Fewer bugs:** Better structure = fewer errors
- **Easier onboarding:** New developers productive faster
- **Sustainable growth:** Foundation for future features

## Refactoring Philosophy

### The Rules

1. **Tests first:** Never refactor without test coverage
2. **Small steps:** Make tiny, incremental changes
3. **One thing at a time:** Don't refactor + add features
4. **Commit often:** Each step should be reviewable
5. **Measure twice, cut once:** Understand code before changing it

### What Refactoring Is NOT

- ❌ Rewriting everything from scratch
- ❌ Adding new features
- ❌ Fixing bugs (that's bug fixing)
- ❌ Changing behavior
- ❌ Random cleanup

### What Refactoring IS

- ✅ Improving internal structure
- ✅ Making code more readable
- ✅ Reducing complexity
- ✅ Eliminating duplication
- ✅ Preparing for features

## Current Technical Debt Assessment

Based on your codebase analysis:

### Critical Issues (Do First)

#### 1. Large Components
**Problem:** `ChatBotDemo.tsx` is 500+ lines  
**Impact:** Hard to understand, test, and modify  
**Priority:** High

**Symptoms:**
- Component does too many things
- Hard to find specific logic
- Testing requires complex setup
- Changes affect unrelated features

**Solution:**
- Extract tool execution logic → `useToolExecution` hook
- Extract message handling → `useMessages` hook
- Extract attachment logic → `useAttachments` hook
- Split UI into smaller components

#### 2. Missing Error Boundaries
**Problem:** React errors crash entire UI  
**Impact:** Poor user experience  
**Priority:** High

**Solution:**
- Add error boundaries at key levels
- Graceful fallback UI
- Error reporting

#### 3. Inconsistent Error Handling
**Problem:** Some functions throw, some return error strings  
**Impact:** Unpredictable error behavior  
**Priority:** Medium-High

**Solution:**
- Standardize on one approach (preferably returning Result type)
- Document error handling strategy
- Update all tools to follow pattern

### Medium Priority Issues

#### 4. Tight Coupling
**Problem:** Components know too much about each other  
**Impact:** Changes ripple across codebase  
**Priority:** Medium

**Solution:**
- Define clear interfaces
- Use dependency injection
- Introduce abstraction layers

#### 5. Limited TypeScript Strictness
**Problem:** `any` types, non-strict mode  
**Impact:** Runtime errors that could be caught  
**Priority:** Medium

**Solution:**
- Enable strict mode incrementally
- Replace `any` with proper types
- Add missing type definitions

#### 6. No State Persistence
**Problem:** Chat history lost on reload  
**Impact:** Poor user experience  
**Priority:** Medium

**Solution:**
- Implement chat history persistence
- Use chrome.storage.local
- Add history management

### Lower Priority Issues

#### 7. Code Duplication
**Problem:** Similar patterns repeated  
**Impact:** Maintenance burden  
**Priority:** Low-Medium

**Solution:**
- Extract common utilities
- Create reusable hooks
- Generalize components

#### 8. Performance Optimization
**Problem:** Unnecessary re-renders, large bundles  
**Impact:** Slow performance  
**Priority:** Low (unless users complain)

**Solution:**
- Add React.memo where needed
- Lazy load components
- Optimize bundle size

## Refactoring Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Make refactoring safe and measurable

#### Week 1: Test Coverage
- [ ] Add tests for critical paths (80% coverage on tools)
- [ ] Add tests for main chat flow
- [ ] Set up coverage tracking

#### Week 2: Error Boundaries & Logging
- [ ] Add error boundaries
- [ ] Implement error logging
- [ ] Create error handling strategy document

### Phase 2: Component Refactoring (Weeks 3-5)

**Goal:** Break down large components

#### Week 3: Extract Hooks from ChatBotDemo
- [ ] Create `useToolExecution` hook
- [ ] Create `useMessages` hook
- [ ] Create `useAttachments` hook
- [ ] Update tests

#### Week 4: Split ChatBotDemo UI
- [ ] Extract `ChatHeader` component
- [ ] Extract `ChatMessages` component
- [ ] Extract `ChatInput` component
- [ ] Extract `ToolExecutionPanel` component

#### Week 5: Refactor Tool Components
- [ ] Simplify Tool component structure
- [ ] Create reusable tool UI patterns
- [ ] Improve tool loading states

### Phase 3: Architecture Improvements (Weeks 6-8)

**Goal:** Improve overall structure

#### Week 6: State Management
- [ ] Implement chat history persistence
- [ ] Add proper loading states
- [ ] Handle offline scenarios

#### Week 7: TypeScript Strictness
- [ ] Enable strict mode
- [ ] Fix type errors incrementally
- [ ] Remove all `any` types

#### Week 8: Code Organization
- [ ] Group related files into feature folders
- [ ] Create barrel exports
- [ ] Improve import paths

### Phase 4: Performance & Polish (Weeks 9-10)

**Goal:** Optimize and refine

#### Week 9: Performance
- [ ] Add React.memo to expensive components
- [ ] Implement virtualization for long lists
- [ ] Lazy load heavy components

#### Week 10: Documentation & Cleanup
- [ ] Update architecture docs
- [ ] Remove dead code
- [ ] Clean up console logs

## Detailed Refactoring Guides

### Refactoring 1: Extract Custom Hook

**Before:**
```typescript
function ChatBotDemo() {
  const [tools, setTools] = useState([]);
  const [executing, setExecuting] = useState(false);

  const executeTool = async (tool, args) => {
    setExecuting(true);
    try {
      const result = await tool.execute(args);
      setTools([...tools, { tool, result }]);
    } catch (error) {
      console.error(error);
    } finally {
      setExecuting(false);
    }
  };

  // ... 400 more lines
}
```

**After:**
```typescript
// src/hooks/useToolExecution.ts
export function useToolExecution() {
  const [tools, setTools] = useState([]);
  const [executing, setExecuting] = useState(false);

  const executeTool = useCallback(async (tool, args) => {
    setExecuting(true);
    try {
      const result = await tool.execute(args);
      setTools(prev => [...prev, { tool, result }]);
    } catch (error) {
      console.error('Tool execution failed:', error);
      throw error;
    } finally {
      setExecuting(false);
    }
  }, []);

  const clearTools = useCallback(() => {
    setTools([]);
  }, []);

  return { tools, executing, executeTool, clearTools };
}

// src/sidepanel/ChatBotDemo.tsx
function ChatBotDemo() {
  const { tools, executing, executeTool } = useToolExecution();
  
  // ... much simpler component
}
```

**Benefits:**
- Logic separated from UI
- Reusable in other components
- Easier to test
- Clearer component purpose

### Refactoring 2: Add Error Boundary

**Create:** `src/components/ErrorBoundary.tsx`

```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage:**
```typescript
function App() {
  return (
    <ErrorBoundary>
      <ChatBotDemo />
    </ErrorBoundary>
  );
}
```

### Refactoring 3: Standardize Error Handling

**Create:** `src/lib/result.ts`

```typescript
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export function Ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

export function Err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { success: true; value: T } {
  return result.success;
}

export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}
```

**Refactor tools:**
```typescript
// Before
export const get_tabs = {
  execute: async () => {
    try {
      const tabs = await chrome.tabs.query({});
      return formatTabs(tabs);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  },
};

// After
export const get_tabs = {
  execute: async (): Promise<Result<Tab[]>> => {
    try {
      const tabs = await chrome.tabs.query({});
      return Ok(tabs);
    } catch (error) {
      return Err(error);
    }
  },
};
```

### Refactoring 4: Component Extraction

**Before:** Large ChatBotDemo component

**After:** Split into feature components

```typescript
// src/sidepanel/components/ChatHeader.tsx
export function ChatHeader({ onClear }: { onClear: () => void }) {
  return (
    <header className="chat-header">
      <h1>AI Assistant</h1>
      <Button onClick={onClear}>Clear</Button>
    </header>
  );
}

// src/sidepanel/components/ChatMessages.tsx
export function ChatMessages({ messages }: { messages: Message[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="messages">
      {messages.map(msg => (
        <Message key={msg.id} {...msg} />
      ))}
      <div ref={scrollRef} />
    </div>
  );
}

// src/sidepanel/ChatBotDemo.tsx - Now much simpler
export function ChatBotDemo() {
  const { messages, input, handleSubmit } = useChat();
  const { tools, executeTool } = useToolExecution();

  return (
    <div className="chat">
      <ChatHeader onClear={() => clearMessages()} />
      <ChatMessages messages={messages} />
      <ChatInput value={input} onSubmit={handleSubmit} />
    </div>
  );
}
```

### Refactoring 5: Feature-Based Folder Structure

**Before:**
```
src/
  components/
    - Everything mixed together
  hooks/
    - All hooks
```

**After:**
```
src/
  features/
    chat/
      - ChatBotDemo.tsx
      - ChatHeader.tsx
      - ChatMessages.tsx
      - ChatInput.tsx
      - useChatState.ts
      - useToolExecution.ts
      - types.ts
      - index.ts
    tools/
      - ToolRegistry.ts
      - ToolExecutor.ts
      - types.ts
      - index.ts
```

## Refactoring Checklist

Before refactoring:
- [ ] Understand current code completely
- [ ] Have test coverage for the area
- [ ] Have clear goal for refactoring
- [ ] Can describe improvement in one sentence

During refactoring:
- [ ] Make small, incremental changes
- [ ] Run tests after each change
- [ ] Commit working state frequently
- [ ] Don't mix refactoring with features

After refactoring:
- [ ] All tests pass
- [ ] No behavior changes (unless intentional)
- [ ] Code is more readable
- [ ] Documentation updated
- [ ] Create PR with clear description

## Measuring Success

Track these metrics:

### Code Quality Metrics
- **Test coverage:** Target 70%+
- **Type coverage:** Target 95%+ (no `any`)
- **Linting warnings:** Target 0
- **File length:** Target <300 lines per file
- **Function length:** Target <50 lines per function

### Performance Metrics
- **Bundle size:** Track over time
- **Load time:** Measure improvement
- **Re-render frequency:** Monitor with React DevTools

### Developer Experience
- **Time to understand feature:** Should decrease
- **Time to make changes:** Should decrease
- **Bug introduction rate:** Should decrease
- **Onboarding time:** Should decrease

## Tools for Refactoring

### VS Code Extensions
- **Better Comments** - Highlight TODOs
- **CodeMetrics** - Complexity visualization
- **SonarLint** - Code quality analysis
- **Import Cost** - Bundle size awareness

### Analysis Tools
```bash
# Analyze bundle size
npm run build
npx vite-bundle-visualizer

# Find duplicate code
npx jscpd src/

# Measure complexity
npx complexity-report src/
```

## Common Refactoring Patterns

### Extract Method
**When:** Function is too long or does multiple things  
**How:** Extract logical chunks into named functions

### Extract Variable
**When:** Complex expressions repeated or hard to understand  
**How:** Assign to well-named variable

### Rename
**When:** Name doesn't clearly communicate purpose  
**How:** Rename with IDE support (preserves references)

### Extract Component
**When:** Component is too large  
**How:** Extract logical UI sections into new components

### Extract Hook
**When:** Logic can be reused  
**How:** Move stateful logic into custom hook

### Introduce Parameter
**When:** Component/function too specific  
**How:** Add parameter to make more general

### Replace Conditional with Polymorphism
**When:** Large if/else or switch statements  
**How:** Use strategy pattern or lookup tables

## Learning Resources

### Books
- "Refactoring" by Martin Fowler
- "Clean Code" by Robert C. Martin
- "Working Effectively with Legacy Code" by Michael Feathers

### Online
- [Refactoring Guru](https://refactoring.guru/)
- [React Patterns](https://reactpatterns.com/)
- [Kent C. Dodds Blog](https://kentcdodds.com/blog)

### Videos
- [React Hooks Refactoring](https://www.youtube.com/watch?v=dpw9EHDh2bM)
- [Component Refactoring Patterns](https://www.youtube.com/watch?v=3XaXKiXtNjw)

## Success Checklist

- [ ] Identified critical technical debt
- [ ] Created prioritized refactoring roadmap
- [ ] Have test coverage before refactoring
- [ ] Understand refactoring patterns
- [ ] Set up metrics to measure improvement
- [ ] Committed to incremental approach
- [ ] Updated docs as you refactor

## What's Next?

Now that you have a refactoring plan:
1. **Start small** - Pick one easy refactoring
2. **Measure impact** - Track improvements
3. **Move to [CI/CD Setup](./06_CI_CD_SETUP.md)** - Automate your quality checks

**Congratulations! You have a plan to systematically improve your code.** 🎉

Refactoring is ongoing, but now you have the tools and strategy to do it safely and effectively.

---

**Pro Tips:**
- Refactor in small, focused PRs
- Don't refactor and add features in same PR
- Use "boy scout rule": leave code better than you found it
- Schedule regular refactoring time (20% of sprint)
- Celebrate refactoring wins with the team

[← Back: Contributing Guidelines](./04_CONTRIBUTING.md) | [Next: CI/CD Setup →](./06_CI_CD_SETUP.md)
