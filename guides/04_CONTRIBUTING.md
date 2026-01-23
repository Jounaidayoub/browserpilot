# Guide 4: Contributing Guidelines

## Overview

**Time:** 2-3 hours  
**Priority:** Important for collaboration  
**Impact:** High for teams, medium for solo projects  
**Learning Goals:** Open source best practices, collaboration workflows, code review

## Why This Matters

> "Good fences make good neighbors." - Robert Frost

Clear contribution guidelines:
- Set expectations for contributors (and yourself)
- Make the contribution process smooth and welcoming
- Maintain code quality and consistency
- Prevent conflicts and misunderstandings
- Create a positive community culture

### What You'll Gain
- **Easier collaboration:** Contributors know what to do
- **Consistent quality:** Standards are clear
- **Less back-and-forth:** Guidelines prevent common issues
- **Better contributions:** People know what makes a good PR
- **Welcoming environment:** New contributors feel comfortable

## Step-by-Step Implementation

### Step 1: Create CONTRIBUTING.md

Create `CONTRIBUTING.md` in your project root:

```markdown
# Contributing to Browser Assistant

First off, thank you for considering contributing to this project! 🎉

This document provides guidelines for contributing. Following these guidelines helps communicate that you respect the time of the developers managing and developing this project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Questions](#questions)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. We pledge to:
- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Chrome/Chromium browser
- Basic understanding of TypeScript and React
- Familiarity with Chrome Extensions (helpful but not required)

### First Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   \`\`\`bash
   git clone https://github.com/YOUR-USERNAME/chat-refactor.git
   cd chat-refactor
   \`\`\`
3. **Add upstream remote:**
   \`\`\`bash
   git remote add upstream https://github.com/Jounaidayoub/chat-refactor.git
   \`\`\`
4. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`
5. **Run the development build:**
   \`\`\`bash
   npm run dev
   \`\`\`
6. **Load the extension in Chrome:**
   - Navigate to \`chrome://extensions/\`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the \`dist/\` directory

### Project Structure

Before contributing, familiarize yourself with:
- [Architecture Overview](docs/ARCHITECTURE.md) - System design
- [Component Catalog](docs/COMPONENTS.md) - UI components
- [API Reference](docs/API_REFERENCE.md) - Available tools

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

\`\`\`bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
\`\`\`

**Branch naming conventions:**
- \`feature/\` - New features
- \`fix/\` - Bug fixes
- \`docs/\` - Documentation changes
- \`refactor/\` - Code refactoring
- \`test/\` - Adding tests
- \`chore/\` - Maintenance tasks

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add tests for new features
- Update documentation if needed
- Keep commits focused and atomic

### 3. Test Your Changes

Before submitting:

\`\`\`bash
# Run linter
npm run lint

# Run tests
npm run test:run

# Check types
npm run type-check

# Run all quality checks
npm run quality
\`\`\`

### 4. Commit Changes

\`\`\`bash
git add .
git commit -m "feat: add tab grouping feature"
\`\`\`

See [Commit Messages](#commit-messages) for conventions.

### 5. Stay Updated

Regularly sync with upstream:

\`\`\`bash
git fetch upstream
git rebase upstream/main
\`\`\`

### 6. Push and Create PR

\`\`\`bash
git push origin feature/your-feature-name
\`\`\`

Then create a Pull Request on GitHub.

## Coding Standards

### TypeScript

- **Use TypeScript:** No \`.js\` files for new code
- **Avoid \`any\`:** Use proper types or \`unknown\`
- **Type exports:** Export types when used by other modules
- **No implicit any:** Enable strict mode progressively

**Example:**
\`\`\`typescript
// ❌ Bad
function processData(data: any) {
  return data.value;
}

// ✅ Good
interface DataType {
  value: string;
}

function processData(data: DataType): string {
  return data.value;
}
\`\`\`

### React

- **Functional components:** Use hooks, not class components
- **TypeScript props:** Always type component props
- **Destructure props:** Make dependencies clear
- **Custom hooks:** Extract reusable logic

**Example:**
\`\`\`typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={\`btn-\${variant}\`} onClick={onClick}>
      {label}
    </button>
  );
}
\`\`\`

### Chrome Extension

- **Permission scope:** Request minimal permissions
- **Error handling:** Always check \`chrome.runtime.lastError\`
- **Async patterns:** Use promises over callbacks
- **Message validation:** Validate all incoming messages

**Example:**
\`\`\`typescript
// ✅ Good
chrome.tabs.query({ active: true }, (tabs) => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    return;
  }
  // Use tabs
});
\`\`\`

### Tools

When creating new tools:

1. **Clear description:** Help AI understand when to use it
2. **Zod schema:** Validate all inputs
3. **Error handling:** Return error strings, don't throw
4. **Useful output:** Return human-readable results
5. **Tests:** Add unit tests

**Template:**
\`\`\`typescript
import { z } from 'zod';
import type { Tool } from './types';

const myToolSchema = z.object({
  param: z.string().describe('What this parameter does'),
});

type MyToolInput = z.infer<typeof myToolSchema>;

export const my_tool: Tool<MyToolInput> = {
  name: 'my_tool',
  description: 'Clear description for AI',
  schema: myToolSchema,
  
  execute: async ({ param }) => {
    try {
      // Implementation
      return 'Success message';
    } catch (error) {
      return \`Error: \${error.message}\`;
    }
  },
};
\`\`\`

### Naming Conventions

- **Files:** kebab-case (\`my-component.tsx\`)
- **Components:** PascalCase (\`MyComponent\`)
- **Functions:** camelCase (\`handleClick\`)
- **Constants:** UPPER_SNAKE_CASE (\`MAX_TABS\`)
- **Types:** PascalCase (\`UserProfile\`)
- **Tools:** snake_case (\`get_tabs\`)

### Code Style

- **Formatting:** Prettier handles this automatically
- **Indentation:** 2 spaces (enforced by Prettier)
- **Quotes:** Double quotes (enforced by Prettier)
- **Semicolons:** Yes (enforced by Prettier)
- **Line length:** 80 characters (suggested, not enforced)

Run formatter before committing:
\`\`\`bash
npm run format
\`\`\`

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, etc.)
- **refactor:** Code refactoring
- **test:** Adding or updating tests
- **chore:** Maintenance tasks

### Examples

\`\`\`
feat(tools): add bookmark management tool

Adds ability to create, search, and organize bookmarks.

Closes #123
\`\`\`

\`\`\`
fix(tabs): handle invalid tab IDs gracefully

Previously, invalid tab IDs would crash the extension.
Now returns a user-friendly error message.

Fixes #456
\`\`\`

\`\`\`
docs(architecture): update component hierarchy diagram

Reflects recent refactoring of AI components.
\`\`\`

### Rules

- **Present tense:** "add feature" not "added feature"
- **Lowercase subject:** "add feature" not "Add feature"
- **No period:** At the end of subject line
- **Imperative mood:** "change" not "changes" or "changed"
- **50 chars or less:** For subject line
- **Body optional:** Explain the "why" not "what"

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass (\`npm run test:run\`)
- [ ] Linter passes (\`npm run lint\`)
- [ ] TypeScript compiles (\`npm run type-check\`)
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### PR Template

When creating a PR, include:

\`\`\`markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe how you tested the changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Screenshots (if applicable)
[Add screenshots of UI changes]

## Related Issues
Closes #123
\`\`\`

### Review Process

1. **Automated checks:** CI runs tests, linting
2. **Code review:** Maintainer reviews code
3. **Feedback:** Address requested changes
4. **Approval:** Once approved, maintainer merges
5. **Merge:** Squash merge to keep history clean

### Review Criteria

Reviewers check for:
- Code quality and readability
- Test coverage
- Documentation
- Security implications
- Performance impact
- Backward compatibility

## Reporting Bugs

### Before Reporting

1. **Check existing issues:** Avoid duplicates
2. **Try latest version:** Bug may be fixed
3. **Minimal reproduction:** Create smallest example that reproduces bug

### Bug Report Template

\`\`\`markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120
- Extension Version: 1.0.0
- OS: Windows 10

## Screenshots
[If applicable]

## Additional Context
Any other relevant information
\`\`\`

## Suggesting Features

### Feature Request Template

\`\`\`markdown
## Feature Description
Clear description of the feature

## Problem It Solves
What problem does this address?

## Proposed Solution
How would you implement this?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Any other relevant information
\`\`\`

### What Makes a Good Feature Request?

- **Clear use case:** Why is this needed?
- **Detailed description:** What should it do?
- **Implementation ideas:** How could it work?
- **Open to feedback:** Willing to iterate on the design

## Testing Guidelines

### What to Test

- **New features:** Add tests for new functionality
- **Bug fixes:** Add test that would have caught the bug
- **Refactoring:** Ensure existing tests still pass
- **Edge cases:** Test boundary conditions

### Testing Best Practices

\`\`\`typescript
// ✅ Good test
describe('close_tabs', () => {
  it('should close specified tabs', async () => {
    // Arrange
    const mockTabs = [{ id: 1 }, { id: 2 }];
    vi.mocked(chrome.tabs.remove).mockResolvedValue();

    // Act
    await close_tabs.execute({ ids: [1, 2] });

    // Assert
    expect(chrome.tabs.remove).toHaveBeenCalledWith([1, 2]);
  });

  it('should handle errors gracefully', async () => {
    // Test error case
  });
});
\`\`\`

See [Testing Strategy Guide](./guides/02_TESTING_STRATEGY.md) for details.

## Documentation Guidelines

### When to Update Docs

- **New feature** → Add to relevant docs
- **Breaking change** → Update migration guide
- **API change** → Update API reference
- **New component** → Add to component catalog

### Documentation Style

- **Clear and concise:** Get to the point
- **Examples:** Show, don't just tell
- **Links:** Reference related docs
- **Up-to-date:** Keep in sync with code

## Getting Help

### Where to Ask

- **GitHub Issues:** Bug reports, feature requests
- **GitHub Discussions:** General questions, ideas
- **Pull Request Comments:** Specific code questions

### How to Ask

- **Be specific:** Provide details
- **Show what you tried:** Share your attempts
- **Include context:** Environment, version, etc.
- **Be respectful:** We're all volunteers

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes (for significant contributions)
- README (for major features)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## Thank You! 🎉

Your contributions make this project better. We appreciate your time and effort!

If you have questions about these guidelines, please open an issue and we'll clarify.
\`\`\`

### Step 2: Create PR Template

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description
<!-- Describe your changes in detail -->

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🔧 Configuration/chore
- [ ] ✅ Test update

## How Has This Been Tested?
<!-- Describe the tests you ran -->

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
<!-- Add screenshots of UI changes -->

## Related Issues
<!-- Link to related issues: Closes #123, Fixes #456 -->
```

### Step 3: Create Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
A clear description of what you expected to happen.

## Actual Behavior
A clear description of what actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- Browser: [e.g. Chrome 120]
- Extension Version: [e.g. 1.0.0]
- OS: [e.g. Windows 10]

## Additional Context
Add any other context about the problem here.
```

Create `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Is your feature request related to a problem?
A clear description of what the problem is. Ex. I'm always frustrated when [...]

## Describe the solution you'd like
A clear and concise description of what you want to happen.

## Describe alternatives you've considered
A clear description of any alternative solutions or features you've considered.

## Additional context
Add any other context or screenshots about the feature request here.

## Would you be willing to implement this feature?
- [ ] Yes
- [ ] No
- [ ] Maybe with guidance
```

### Step 4: Add Code Owners (Optional)

Create `.github/CODEOWNERS`:

```
# Default owner for everything
* @Jounaidayoub

# Documentation
/docs/ @Jounaidayoub
*.md @Jounaidayoub

# Tools system
/src/tools/ @Jounaidayoub

# Configuration files
*.json @Jounaidayoub
*.config.* @Jounaidayoub
```

## Community Building Best Practices

### 1. Be Welcoming

First impressions matter:
- Thank contributors in PRs
- Be patient with newcomers
- Celebrate first contributions
- Provide constructive feedback

### 2. Clear Expectations

Set boundaries:
- What's in scope / out of scope
- Response time expectations
- Decision-making process
- When to close issues/PRs

### 3. Recognition

Acknowledge contributions:
- Mention in release notes
- Add to contributors list
- Social media shoutouts
- Thank you messages

### 4. Communication

Keep everyone informed:
- Regular updates on project status
- Roadmap transparency
- Decision explanations
- Issue triage

## Success Checklist

- [ ] Created CONTRIBUTING.md with comprehensive guidelines
- [ ] Added PR template
- [ ] Added issue templates (bug report, feature request)
- [ ] (Optional) Set up CODEOWNERS
- [ ] Linked CONTRIBUTING.md from README
- [ ] Guidelines cover code style, testing, commits
- [ ] Process for reporting bugs is clear
- [ ] Process for suggesting features is clear

## What's Next?

Now that you have contribution guidelines:
1. **Share them** - Link in README and first issue
2. **Follow them yourself** - Lead by example
3. **Move to [Refactoring Roadmap](./05_REFACTORING_ROADMAP.md)** - Plan technical debt paydown

**Congratulations! You have a welcoming, organized contribution process.** 🎉

Contributors know what to do, and you've set the stage for healthy collaboration.

---

**Pro Tips:**
- Review and update guidelines quarterly
- Ask new contributors for feedback on the process
- Be consistent in applying standards
- Make exceptions when they make sense, but document why
- Update examples when patterns change

[← Back: Architecture Documentation](./03_ARCHITECTURE_DOCUMENTATION.md) | [Next: Refactoring Roadmap →](./05_REFACTORING_ROADMAP.md)
