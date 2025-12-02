# Browser Assistant - AI-Powered Browser Extension

An intelligent Chrome extension that helps you manage tabs, analyze web pages, and interact with content through natural language powered by AI.

## ✨ Features

- 🤖 **AI Chat Interface** - Natural language interactions with your browser
- 📑 **Smart Tab Management** - Group, organize, and manage tabs intelligently
- 🔍 **Page Analysis** - Extract and analyze web page content
- 🛠️ **Extensible Tools** - Modular action system for AI capabilities
- 🎨 **Modern UI** - Clean, accessible interface with dark/light themes
- ⚡ **Fast & Efficient** - Built with React 19, TypeScript, and Vite

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Chrome/Chromium browser

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/Jounaidayoub/chat-refactor.git
cd chat-refactor
```

2. **Install dependencies:**

```bash
npm install
```

3. **Start development server:**

```bash
npm run dev
```

4. **Load extension in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory

### Building for Production

```bash
npm run build
```

The built extension will be in the `dist` directory.

## 📖 Documentation

### For New Contributors

**🎯 Start here if you want to contribute or improve the codebase:**

**[📚 Prototype to Production Guide](./PROTOTYPE_TO_PRODUCTION.md)** - Your complete roadmap for transitioning from prototype to production-quality software.

This comprehensive guide includes:

1. **[Code Quality Setup](./guides/01_CODE_QUALITY_SETUP.md)** - ESLint, Prettier, TypeScript strict mode
2. **[Testing Strategy](./guides/02_TESTING_STRATEGY.md)** - Unit, integration, and E2E testing
3. **[Architecture Documentation](./guides/03_ARCHITECTURE_DOCUMENTATION.md)** - System design and patterns
4. **[Contributing Guidelines](./guides/04_CONTRIBUTING.md)** - How to contribute effectively
5. **[Refactoring Roadmap](./guides/05_REFACTORING_ROADMAP.md)** - Technical debt management
6. **[CI/CD Setup](./guides/06_CI_CD_SETUP.md)** - Automated testing and deployment

### Technical Documentation

- **Architecture Overview** - See `docs/ARCHITECTURE.md` (create following Guide 3)
- **Component Catalog** - See `docs/COMPONENTS.md` (create following Guide 3)
- **API Reference** - See `docs/API_REFERENCE.md` (create following Guide 3)

## 🏗️ Project Structure

```
chat-refactor/
├── src/
│   ├── sidepanel/          # Main chat interface
│   ├── popup/              # Extension popup UI
│   ├── content/            # Content scripts
│   ├── background/         # Service worker
│   ├── tools/              # AI tool implementations
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utility functions
├── guides/                 # Learning guides for contributors
├── docs/                   # Technical documentation (TBD)
└── manifest.config.ts      # Extension manifest
```

## 🤝 Contributing

We welcome contributions! This project is actively being transitioned from prototype to production-quality software, making it a great learning opportunity.

**Before contributing, please:**

1. Read the **[Contributing Guidelines](./guides/04_CONTRIBUTING.md)**
2. Check out the **[Prototype to Production Guide](./PROTOTYPE_TO_PRODUCTION.md)**
3. Look for issues labeled `good first issue` or `help wanted`

### Development Workflow

```bash
# Run development build
npm run dev

# Run linter (once set up)
npm run lint

# Run tests (once set up)
npm run test

# Type check
npm run type-check

# Build for production
npm run build
```

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript
- **Build Tool:** Vite
- **Extension Framework:** CRXJS
- **AI Integration:** AI SDK
- **Browser Automation:** Playwright-CRX
- **UI Components:** Radix UI
- **Styling:** Tailwind CSS
- **State Management:** React Hooks

## 📋 Roadmap

### Current Phase: Foundation (Make it Right)

- [ ] Set up code quality tools (ESLint, Prettier)
- [ ] Implement comprehensive testing
- [ ] Document architecture
- [ ] Establish CI/CD pipeline
- [ ] Refactor large components
- [ ] Add error boundaries

### Future Phases

- **Make it Fast:** Performance optimization, lazy loading, bundle size reduction
- **Expand Features:** More tools, better UI, enhanced AI capabilities
- **Polish:** User onboarding, documentation, Chrome Web Store release

See the **[Refactoring Roadmap](./guides/05_REFACTORING_ROADMAP.md)** for detailed plans.

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature idea? Please:

1. Check existing [Issues](https://github.com/Jounaidayoub/chat-refactor/issues)
2. Create a new issue using the appropriate template
3. Provide as much detail as possible

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/), [Vite](https://vitejs.dev/), and [CRXJS](https://crxjs.dev/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

## 📬 Contact

- **Author:** Jounaid Ayoub
- **GitHub:** [@Jounaidayoub](https://github.com/Jounaidayoub)
- **Repository:** [chat-refactor](https://github.com/Jounaidayoub/chat-refactor)

---

**⭐ Star this repo if you find it useful!**

**📚 New to production-quality software development?** Start with the [Prototype to Production Guide](./PROTOTYPE_TO_PRODUCTION.md) - it's designed to teach you as you improve this codebase!
