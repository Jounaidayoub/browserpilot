# Architecture & Refactoring Documentation

This directory contains comprehensive documentation for the Browser Assistant Chrome Extension refactoring initiative.

## 📚 Documentation Index

### Master Guide
- **[Refactoring Master Guide](./REFACTORING_MASTER_GUIDE.md)** - Start here! Comprehensive overview of the entire refactoring project, including current state analysis, target architecture, and phase-by-phase implementation plan.

### Component-Specific Guides

1. **[Message Bus Architecture](./MESSAGE_BUS_ARCHITECTURE.md)**
   - Type-safe communication layer
   - Request/response patterns
   - Event broadcasting
   - Implementation guide with code examples
   - **Priority:** Critical (Foundation)
   - **Dependencies:** None

2. **[Service Layer Architecture](./SERVICE_LAYER_ARCHITECTURE.md)**
   - Chrome API abstraction
   - Service interfaces and implementations
   - Dependency injection patterns
   - Testing strategies
   - **Priority:** Critical (Foundation)
   - **Dependencies:** Message Bus

3. **[Tool System Guide](./TOOL_SYSTEM_GUIDE.md)**
   - Domain layer design
   - Tool interface and base classes
   - Tool registry and auto-discovery
   - Tool executor and lifecycle
   - **Priority:** High (Core Feature)
   - **Dependencies:** Message Bus, Service Layer

## 🎯 Quick Start

### For Developers New to the Project

1. Read the **[Refactoring Master Guide](./REFACTORING_MASTER_GUIDE.md)** to understand:
   - Why we're refactoring
   - Current architecture problems
   - Target architecture vision
   - Implementation timeline

2. Dive into specific components:
   - **Working on messaging?** → [Message Bus Architecture](./MESSAGE_BUS_ARCHITECTURE.md)
   - **Working on Chrome APIs?** → [Service Layer Architecture](./SERVICE_LAYER_ARCHITECTURE.md)
   - **Adding new tools?** → [Tool System Guide](./TOOL_SYSTEM_GUIDE.md)

### For Lead Engineers

Review all documents to understand:
- Overall architecture vision
- Technical debt inventory
- Migration strategy
- Risk mitigation approaches

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  (React Components, UI Logic)                                   │
│  - Side Panel                                                   │
│  - Popup                                                        │
│  - Content Scripts                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│  (Orchestration, Workflows)                                     │
│  - Message Bus (Type-safe communication)                        │
│  - Tool Executor (Orchestrates tool execution)                  │
│  - Event Handlers                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                               │
│  (Business Logic)                                               │
│  - Tool Registry                                                │
│  - Tool Implementations (Pure logic)                            │
│  - Validation Rules                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                           │
│  (External Integrations)                                        │
│  - Chrome API Services                                          │
│  - Storage Adapters                                             │
│  - Playwright Integration                                       │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Implementation Phases

| Phase | Duration | Focus | Documents |
|-------|----------|-------|-----------|
| **Phase 1** | Week 1 | Message Bus Foundation | [Message Bus Architecture](./MESSAGE_BUS_ARCHITECTURE.md) |
| **Phase 2** | Week 2 | Service Layer | [Service Layer Architecture](./SERVICE_LAYER_ARCHITECTURE.md) |
| **Phase 3** | Week 3 | Tool System Refactoring | [Tool System Guide](./TOOL_SYSTEM_GUIDE.md) |
| **Phase 4** | Week 4 | UI Layer Refactoring | Master Guide |
| **Phase 5** | Week 5 | Error Handling & Logging | Master Guide |
| **Phase 6** | Week 6 | Testing Infrastructure | All Guides |
| **Phase 7** | Week 7 | Documentation & Migration | All Guides |

## 🔑 Key Principles

### 1. Separation of Concerns
Each layer has a single, clear responsibility:
- **Presentation** → Render UI
- **Application** → Orchestrate workflows
- **Domain** → Business logic
- **Infrastructure** → External systems

### 2. Dependency Inversion
High-level modules depend on abstractions, not implementations:
```typescript
// ✅ Good
class CloseTabsTool {
  constructor(private tabsService: ITabsService) {}
}

// ❌ Bad
class CloseTabsTool {
  execute() {
    chrome.tabs.remove([...]); // Direct dependency
  }
}
```

### 3. Type Safety First
- No `any` types in public APIs
- Discriminated unions for messages
- Zod for runtime validation
- Strict TypeScript mode

### 4. Explicit Over Implicit
Make data flow visible:
```typescript
// ✅ Explicit
const response = await MessageBus.send<GetTabsRequest, GetTabsResponse>({
  type: "GET_TABS_REQUEST",
  filters: { active: true }
});

// ❌ Implicit
chrome.runtime.sendMessage({ action: "get-tabs" });
```

## 🧪 Testing Strategy

Each layer has specific testing requirements:

| Layer | Test Type | Tools | Coverage Goal |
|-------|-----------|-------|---------------|
| Services | Unit | Vitest + Chrome API mocks | 100% |
| Tools | Unit | Vitest + Service mocks | 100% |
| Message Bus | Unit + Integration | Vitest + Playwright | 90% |
| UI Components | Unit | Vitest + React Testing Library | 80% |
| E2E | Integration | Playwright | Critical paths |

## 📊 Progress Tracking

Use the migration checklists in each document to track progress:

### Message Bus
- [ ] Message types defined
- [ ] MessageBus client implemented
- [ ] MessageRouter implemented
- [ ] All existing messages migrated
- [ ] Type safety verified

### Services
- [ ] Service interfaces defined
- [ ] All services implemented
- [ ] ServiceRegistry working
- [ ] All handlers use services
- [ ] Tests passing

### Tools
- [ ] Tool interface updated
- [ ] ToolRegistry with auto-discovery
- [ ] All tools migrated
- [ ] Tools use dependency injection
- [ ] Tests passing

## 🚨 Common Pitfalls

### 1. Mixing Concerns
❌ **Don't** put Chrome API calls in tools
✅ **Do** use service abstractions

### 2. Type-Unsafe Messages
❌ **Don't** use `any` for messages
✅ **Do** define discriminated union types

### 3. Forgetting Return Value
❌ **Don't** forget `return true` in Chrome message handlers
✅ **Do** use MessageRouter (handles this automatically)

### 4. Service Worker State
❌ **Don't** rely on in-memory state in background
✅ **Do** use chrome.storage for persistence

## 🔗 Related Resources

### Chrome Extension Documentation
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/migrating/to-service-workers/)
- [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

### Architecture Patterns
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Injection](https://martinfowler.com/articles/injection.html)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)

### Tools & Libraries
- [Zod](https://zod.dev/) - TypeScript schema validation
- [Playwright](https://playwright.dev/) - Browser automation
- [Vitest](https://vitest.dev/) - Unit testing

## 💬 Questions & Feedback

For questions or feedback on the refactoring:

1. **Architecture Questions** → Review the Master Guide
2. **Implementation Details** → Check component-specific guides
3. **Stuck?** → Open an issue with the team

## 📝 Document Maintenance

These documents are living documents. Update them when:

- Architecture decisions change
- New patterns emerge
- Better approaches are discovered
- Migration milestones are reached

**Last Updated:** 2025-11-18
**Version:** 1.0
**Status:** Design Phase Complete - Ready for Implementation
