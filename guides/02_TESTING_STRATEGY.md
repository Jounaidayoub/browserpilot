# Guide 2: Testing Strategy

## Overview

**Time:** 1-2 days initial setup + ongoing  
**Priority:** ⭐ CRITICAL - This eliminates fear of breaking things  
**Impact:** Game-changing - enables confident refactoring  
**Learning Goals:** Testing fundamentals, Jest/Vitest, test-driven development, Chrome extension testing

## Why This Matters

> "Without tests, every change is a potential disaster waiting to happen."

Right now, you're afraid to make changes because you might break something silently. **Tests are your safety net.** They let you refactor, add features, and fix bugs with confidence.

### What You'll Gain
- **Confidence:** Make changes without fear
- **Fast feedback:** Know immediately if you broke something
- **Documentation:** Tests show how your code should work
- **Better design:** Writing testable code leads to better architecture
- **Sleep well:** No more worrying about silent breakage

## Testing Philosophy for Chrome Extensions

Chrome extensions are unique because they have:
- **Background scripts** (service workers)
- **Content scripts** (injected into pages)
- **Popup UI** (React components)
- **Side panel** (React components)
- **Chrome APIs** (tabs, storage, etc.)

We need a testing strategy that covers all of these.

## Testing Pyramid for Your Extension

```
       /\          E2E Tests (Few)
      /  \         - Full user workflows
     /____\        - Extension + real browser
    /      \       Integration Tests (Some)
   /        \      - Components + Chrome APIs
  /__________\     - Multiple pieces together
 /            \    Unit Tests (Many)
/_____________\    - Pure functions
                   - Business logic
                   - Utilities
```

**Strategy:** Many unit tests, some integration tests, few E2E tests.

## Step-by-Step Implementation

### Step 1: Choose Your Testing Framework

For your React + TypeScript + Chrome Extension stack, I recommend **Vitest**:
- ✅ Fast (uses Vite, which you already have)
- ✅ Jest-compatible API (easy to learn)
- ✅ Great TypeScript support
- ✅ Built-in coverage reports

```bash
npm install --save-dev \
  vitest \
  @vitest/ui \
  jsdom \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @types/chrome
```

**What each package does:**
- `vitest` - Testing framework
- `@vitest/ui` - Visual test runner UI
- `jsdom` - Simulates browser environment
- `@testing-library/react` - Test React components
- `@testing-library/jest-dom` - Extra matchers for DOM testing
- `@testing-library/user-event` - Simulate user interactions

### Step 2: Configure Vitest

Create `vitest.config.ts` in your project root:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Step 3: Create Test Setup File

Create `src/test/setup.ts`:

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock Chrome APIs globally
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getManifest: vi.fn(() => ({
      version: '1.0.0',
      name: 'Test Extension',
    })),
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    onCreated: {
      addListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  sidePanel: {
    open: vi.fn(),
  },
} as any;
```

Create `src/test/mocks/chrome.ts` for more detailed Chrome API mocks:

```typescript
import { vi } from 'vitest';

export const createMockTab = (overrides = {}) => ({
  id: 1,
  url: 'https://example.com',
  title: 'Example',
  active: true,
  pinned: false,
  index: 0,
  windowId: 1,
  ...overrides,
});

export const createMockTabGroup = (overrides = {}) => ({
  id: 1,
  title: 'Group 1',
  color: 'blue',
  collapsed: false,
  ...overrides,
});

export const mockChromeTabsQuery = (tabs: chrome.tabs.Tab[]) => {
  vi.mocked(chrome.tabs.query).mockResolvedValue(tabs);
};

export const mockChromeStorageGet = (data: Record<string, any>) => {
  vi.mocked(chrome.storage.local.get).mockResolvedValue(data);
};
```

### Step 4: Add Test Scripts to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 5: Write Your First Tests

Start with **utility functions** (easiest to test):

**Example: Testing `src/lib/utils.ts`**

Create `src/lib/utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { cn, truncate } from './utils'; // Assuming you have these

describe('utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const long = 'a'.repeat(100);
      expect(truncate(long, 50)).toHaveLength(53); // 50 + '...'
    });

    it('should not truncate short strings', () => {
      expect(truncate('short', 50)).toBe('short');
    });
  });
});
```

**Run your first test:**

```bash
npm test
```

### Step 6: Test Tools/Business Logic

**Example: Testing `src/tools/Tabs.ts`**

Create `src/tools/Tabs.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get_tabs, close_tabs, group_tabs_by_ids } from './Tabs';
import { createMockTab, mockChromeTabsQuery } from '../test/mocks/chrome';

describe('Tab Management Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get_tabs', () => {
    it('should return all tabs', async () => {
      const mockTabs = [
        createMockTab({ id: 1, title: 'Tab 1' }),
        createMockTab({ id: 2, title: 'Tab 2' }),
      ];
      mockChromeTabsQuery(mockTabs);

      const result = await get_tabs.execute({});
      
      expect(result).toContain('Tab 1');
      expect(result).toContain('Tab 2');
    });

    it('should handle no tabs', async () => {
      mockChromeTabsQuery([]);
      
      const result = await get_tabs.execute({});
      
      expect(result).toContain('No tabs found');
    });
  });

  describe('close_tabs', () => {
    it('should close specified tabs', async () => {
      vi.mocked(chrome.tabs.remove).mockResolvedValue();

      await close_tabs.execute({ ids: [1, 2, 3] });

      expect(chrome.tabs.remove).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(chrome.tabs.remove).mockRejectedValue(
        new Error('Tab not found')
      );

      const result = await close_tabs.execute({ ids: [999] });

      expect(result).toContain('Error');
    });
  });
});
```

### Step 7: Test React Components

**Example: Testing a simple component**

Create `src/components/ui/badge.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('should render children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    const { container } = render(
      <Badge variant="destructive">Error</Badge>
    );
    expect(container.firstChild).toHaveClass('bg-destructive');
  });
});
```

**Example: Testing a component with Chrome APIs**

Create `src/components/TabList.test.tsx`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabList } from './TabList';
import { createMockTab, mockChromeTabsQuery } from '../test/mocks/chrome';

describe('TabList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display tabs', async () => {
    const mockTabs = [
      createMockTab({ id: 1, title: 'Google', url: 'https://google.com' }),
      createMockTab({ id: 2, title: 'GitHub', url: 'https://github.com' }),
    ];
    mockChromeTabsQuery(mockTabs);

    render(<TabList />);

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });
  });

  it('should close tab on button click', async () => {
    const user = userEvent.setup();
    const mockTabs = [createMockTab({ id: 1, title: 'Google' })];
    mockChromeTabsQuery(mockTabs);

    render(<TabList />);

    const closeButton = await screen.findByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(chrome.tabs.remove).toHaveBeenCalledWith(1);
  });
});
```

### Step 8: Test Critical User Flows (Integration Tests)

**Example: Testing the chat workflow**

Create `src/sidepanel/__tests__/chat-flow.test.tsx`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatBotDemo from '../ChatBotDemo';

// Mock the AI SDK
vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
  }),
}));

describe('Chat Flow', () => {
  it('should allow user to send a message', async () => {
    const user = userEvent.setup();
    
    render(<ChatBotDemo />);

    const input = screen.getByPlaceholderText(/type a message/i);
    const submitButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Hello, assistant!');
    await user.click(submitButton);

    // Verify the interaction happened
    expect(input).toHaveValue('Hello, assistant!');
  });
});
```

## Testing Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad:**
```typescript
it('should call setState with new value', () => {
  // Testing implementation details
});
```

✅ **Good:**
```typescript
it('should display new value when button is clicked', () => {
  // Testing user-visible behavior
});
```

### 2. Use Descriptive Test Names

❌ **Bad:**
```typescript
it('works', () => { ... });
it('test 1', () => { ... });
```

✅ **Good:**
```typescript
it('should display error message when tab ID is invalid', () => { ... });
it('should group selected tabs when group button is clicked', () => { ... });
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should close tab', async () => {
  // Arrange: Set up test data and mocks
  const mockTab = createMockTab({ id: 1 });
  mockChromeTabsQuery([mockTab]);

  // Act: Perform the action
  await close_tabs.execute({ ids: [1] });

  // Assert: Verify the result
  expect(chrome.tabs.remove).toHaveBeenCalledWith([1]);
});
```

### 4. Keep Tests Independent

Each test should be able to run in isolation:

```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Clean slate for each test
});
```

### 5. Don't Test External Libraries

❌ Don't test React, Chrome APIs, or third-party libraries  
✅ Test YOUR code that uses them

## What to Test (Priority Order)

### Priority 1: Critical Business Logic ⭐
- Tab management functions
- Tool execution logic
- Data transformations
- Error handling

### Priority 2: User-Facing Features ⭐
- Components that users interact with
- Form validation
- Button behaviors
- Data display

### Priority 3: Integration Points
- Chrome API interactions
- Background-content script communication
- Storage operations

### Priority 4: Edge Cases
- Error states
- Empty states
- Loading states
- Large datasets

### Priority 5: UI Components (Lower Priority)
- Basic rendering tests
- Prop variations
- (Many UI components are tested visually, not with unit tests)

## Common Testing Challenges in Chrome Extensions

### Challenge 1: Chrome APIs Don't Exist in Tests

**Solution:** Mock them in `src/test/setup.ts` (we did this already)

### Challenge 2: Message Passing Between Scripts

**Solution:** Create a mock message bus:

```typescript
// src/test/mocks/messageBus.ts
import { vi } from 'vitest';

export const createMockMessageBus = () => {
  const listeners = new Map();

  return {
    sendMessage: vi.fn((message) => {
      const listener = listeners.get(message.action);
      if (listener) {
        return listener(message);
      }
    }),
    addListener: vi.fn((callback) => {
      // Store listeners by action type
    }),
  };
};
```

### Challenge 3: Async Tool Execution

**Solution:** Use `async/await` and `waitFor`:

```typescript
it('should complete tool execution', async () => {
  const result = await tool.execute({ arg: 'value' });
  
  await waitFor(() => {
    expect(result).toBeDefined();
  });
});
```

## Coverage Goals

Don't obsess over 100% coverage, but aim for:
- **Critical business logic:** 80-90% coverage
- **UI components:** 50-70% coverage
- **Overall:** 60-70% coverage

**Check coverage:**
```bash
npm run test:coverage
```

This generates a report in `coverage/index.html` - open it in your browser.

## Running Tests in Different Modes

```bash
# Watch mode (auto-runs on file changes)
npm test

# Run once (for CI)
npm run test:run

# With UI (visual test runner)
npm run test:ui

# With coverage
npm run test:coverage

# Run specific test file
npx vitest src/tools/Tabs.test.ts

# Run tests matching a pattern
npx vitest --grep "close_tabs"
```

## Debugging Tests

### Use `test.only` to Focus on One Test

```typescript
it.only('should focus on this test', () => {
  // Only this test will run
});
```

### Use `console.log` (It Works!)

```typescript
it('should do something', () => {
  console.log('Debug info:', someValue);
  expect(someValue).toBe(expected);
});
```

### Use Vitest UI for Debugging

```bash
npm run test:ui
```

This opens a browser UI where you can:
- See test output visually
- Re-run individual tests
- See console logs
- Inspect errors

## Test-Driven Development (TDD) - Next Level

Once comfortable with testing, try TDD:

1. **Write test first (Red)** - Test fails
2. **Write minimal code (Green)** - Test passes
3. **Refactor (Refactor)** - Improve code

**Example:**

```typescript
// 1. Write test first
it('should format tab title', () => {
  expect(formatTabTitle('  Example Site  ')).toBe('Example Site');
});

// 2. Write code to pass
export function formatTabTitle(title: string): string {
  return title.trim();
}

// 3. Refactor if needed
export function formatTabTitle(title: string): string {
  return title?.trim() ?? 'Untitled';
}
```

## Learning Resources

### Testing Fundamentals
- [Testing JavaScript](https://testingjavascript.com/) - Kent C. Dodds (paid but excellent)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)

### Best Practices
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Write Tests. Not Too Many. Mostly Integration.](https://kentcdodds.com/blog/write-tests)

### Chrome Extension Testing
- [Chrome Extension Testing Guide](https://developer.chrome.com/docs/extensions/mv3/testing/)

## Success Checklist

- [ ] Vitest installed and configured
- [ ] Test setup file created with Chrome API mocks
- [ ] Test scripts added to package.json
- [ ] Written tests for at least 2-3 utility functions
- [ ] Written tests for at least 1-2 tool functions
- [ ] Written tests for at least 1 React component
- [ ] All tests pass (`npm run test:run`)
- [ ] Coverage report generated (`npm run test:coverage`)
- [ ] Understand how to run tests in watch mode
- [ ] Understand how to debug failing tests

## What's Next?

Now that you have tests:
1. **Write tests before refactoring** - They'll catch regressions
2. **Add tests when fixing bugs** - Prevent the bug from coming back
3. **Move to [Architecture Documentation](./03_ARCHITECTURE_DOCUMENTATION.md)** - Help others understand your code

**Congratulations! You're now fearless.** 🎉

You can refactor, add features, and fix bugs with confidence. Your tests will tell you if something breaks.

---

**Pro Tips:**
- Start by testing the parts that scare you most
- Don't aim for 100% coverage - aim for confidence
- Tests are documentation - make them readable
- If a test is hard to write, your code might need refactoring
- Run tests before committing: `npm run test:run`

[← Back: Code Quality](./01_CODE_QUALITY_SETUP.md) | [Next: Architecture Documentation →](./03_ARCHITECTURE_DOCUMENTATION.md)
