# Guide 1: Code Quality Setup

## Overview

**Time:** 2-3 hours  
**Priority:** ⭐ START HERE - This is your foundation  
**Impact:** Immediate - catches errors, enforces consistency  
**Learning Goals:** Modern code quality tools, linting, formatting, TypeScript configuration

## Why This Matters

Right now, you're coding without a safety net. Code quality tools are like spell-check for your code - they catch issues before they become bugs. They also make your code consistent, which makes it easier for you (and others) to read and maintain.

### What You'll Gain
- **Catch errors early:** Before they reach production
- **Consistent code style:** No more debating tabs vs spaces
- **Auto-formatting:** Stop thinking about formatting, let tools handle it
- **Better TypeScript:** Catch more bugs at compile time
- **Editor integration:** Get real-time feedback as you code

## Tools We'll Set Up

1. **ESLint** - Catches potential bugs and enforces best practices
2. **Prettier** - Automatically formats your code consistently
3. **TypeScript Strict Mode** - Catches more type errors
4. **Husky (optional)** - Runs checks before commits

## Step-by-Step Implementation

### Step 1: Install ESLint and Prettier

```bash
npm install --save-dev \
  eslint \
  @eslint/js \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  prettier \
  eslint-config-prettier \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-react-refresh
```

**What each package does:**
- `eslint` - The main linting engine
- `@typescript-eslint/*` - Makes ESLint understand TypeScript
- `prettier` - Code formatter
- `eslint-config-prettier` - Turns off ESLint rules that conflict with Prettier
- `eslint-plugin-react*` - React-specific linting rules

### Step 2: Configure ESLint

Create `.eslintrc.cjs` in your project root:

```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    webextensions: true, // For Chrome extension APIs
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier', // Must be last to override other configs
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-refresh',
  ],
  settings: {
    react: {
      version: 'detect', // Auto-detect React version
    },
  },
  rules: {
    // Start with warnings, not errors - less overwhelming
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'react-refresh/only-export-components': 'warn',
    
    // Common sense rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'warn',
    'no-var': 'error',
    
    // React-specific
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Using TypeScript instead
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    '.eslintrc.cjs',
    'vite.config.ts',
  ],
};
```

**Key points:**
- We start with warnings instead of errors - less overwhelming
- We allow `_` prefix for unused variables (common pattern)
- We turn off React rules that TypeScript makes redundant
- We ignore build folders and config files

### Step 3: Configure Prettier

Create `.prettierrc` in your project root:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Create `.prettierignore`:

```
node_modules
dist
build
coverage
.git
package-lock.json
pnpm-lock.yaml
*.min.js
```

**Prettier is opinionated - these settings are reasonable defaults. You can adjust to your preference.**

### Step 4: Add NPM Scripts

Update your `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx --max-warnings 50",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "quality": "npm run type-check && npm run lint && npm run format:check"
  }
}
```

**What each script does:**
- `lint` - Check for issues (allowing 50 warnings initially)
- `lint:fix` - Auto-fix what can be fixed
- `format` - Format all code with Prettier
- `format:check` - Check if code is formatted
- `type-check` - Check TypeScript types without building
- `quality` - Run all checks together

### Step 5: Enable TypeScript Strict Mode (Gradually)

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting - Enable gradually */
    "strict": false, // Start false, enable after fixing existing issues
    "noUnusedLocals": false, // Enable later
    "noUnusedParameters": false, // Enable later
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": false, // Enable after fixing 'any' types
    
    /* Helpful for Chrome extensions */
    "types": ["chrome", "node"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Strategy:** Start with strict mode OFF, fix issues incrementally, then enable it.

### Step 6: Set Up VS Code Integration (Recommended)

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss"
  ]
}
```

**This gives you real-time feedback as you code!**

### Step 7: Run Your First Quality Check

```bash
# Format all existing code
npm run format

# Check for linting issues
npm run lint

# Check TypeScript types
npm run type-check

# Run all checks
npm run quality
```

**Expected result:** You'll likely see warnings and errors. Don't panic! This is normal for existing codebases.

## Fixing Common Issues

### Issue 1: Too Many Warnings

**Solution:** Start by fixing auto-fixable ones:
```bash
npm run lint:fix
npm run format
```

Then tackle remaining issues one by one. It's okay to temporarily increase `--max-warnings` in the lint script.

### Issue 2: TypeScript Errors

**Solution:** Fix them incrementally:
1. Start with the easiest files (utilities, types)
2. Add `// @ts-expect-error` or `// @ts-ignore` with TODOs for complex ones
3. Come back to these after setting up tests

### Issue 3: Too Opinionated Rules

**Solution:** Adjust rules in `.eslintrc.cjs`:
```javascript
rules: {
  'rule-you-disagree-with': 'off', // or 'warn' instead of 'error'
}
```

## Optional: Pre-commit Hooks with Husky

**Do this after you've cleaned up most issues:**

```bash
npm install --save-dev husky lint-staged

# Initialize husky
npx husky init
```

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

**This automatically formats and lints changed files before commits.**

## Learning Resources

### Understanding the Tools
- **ESLint:** https://eslint.org/docs/latest/user-guide/getting-started
- **Prettier:** https://prettier.io/docs/en/why-prettier.html
- **TypeScript:** https://www.typescriptlang.org/docs/handbook/intro.html

### Best Practices
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)

### Deep Dives
- Why strict mode in TypeScript: https://www.typescriptlang.org/tsconfig#strict
- ESLint rules explained: https://eslint.org/docs/latest/rules/

## Common Questions

### Q: Why so many warnings in my existing code?
**A:** Your code isn't bad - you just didn't have these checks before. Think of it as discovering issues that were always there but hidden.

### Q: Should I fix all warnings before continuing?
**A:** No! Fix critical errors, leave warnings for incremental improvement. Use `--max-warnings` to not block your progress.

### Q: Can I use different tools (e.g., Biome instead of ESLint)?
**A:** Yes! The principles are the same. These tools are recommendations, not requirements.

### Q: How strict should I be with rules?
**A:** Start lenient (warnings), tighten gradually. The goal is to help, not frustrate.

## Success Checklist

- [ ] ESLint installed and configured
- [ ] Prettier installed and configured
- [ ] NPM scripts added for linting and formatting
- [ ] VS Code integration set up (if using VS Code)
- [ ] Ran `npm run format` on existing code
- [ ] Ran `npm run lint` and saw results (even if warnings)
- [ ] Ran `npm run type-check` and saw results
- [ ] Understand how to use `npm run lint:fix` when making changes
- [ ] (Optional) Husky pre-commit hooks set up

## What's Next?

Now that you have code quality tools:
1. **Live with it for a few days** - Make some changes, see how it helps
2. **Gradually fix warnings** - Do a few each day
3. **Move to [Testing Strategy](./02_TESTING_STRATEGY.md)** - The next critical step

**Congratulations! You now have your first safety net.** 🎉

Your code will be more consistent, and you'll catch more bugs before they happen. Next, we'll add tests so you can confidently refactor without breaking things.

---

**Pro Tips:**
- Run `npm run quality` before committing
- Don't be afraid to adjust rules - they work for you, not the other way around
- Focus on new code quality first, fix old code incrementally
- Use `// eslint-disable-next-line rule-name` sparingly and with comments explaining why

[← Back to Main Guide](../PROTOTYPE_TO_PRODUCTION.md) | [Next: Testing Strategy →](./02_TESTING_STRATEGY.md)
