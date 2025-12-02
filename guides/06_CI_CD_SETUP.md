# Guide 6: CI/CD Setup

## Overview

**Time:** 3-4 hours  
**Priority:** High for teams, Medium for solo  
**Impact:** Catches issues before they reach main  
**Learning Goals:** Continuous integration, automated testing, deployment pipelines, GitHub Actions

## Why This Matters

> "If it hurts, do it more often." - Jez Humble

Manual testing is slow, error-prone, and doesn't scale. CI/CD automates quality checks so you can deploy with confidence and focus on building features.

### What You'll Gain
- **Automatic quality checks:** Every PR tested before merge
- **Faster feedback:** Know within minutes if something broke
- **Consistent standards:** Everyone follows same rules
- **Safe deployments:** Build artifacts automatically
- **Documentation:** CI config documents your build process

## CI/CD Pipeline Overview

```
Developer pushes code
        ↓
    GitHub detects push
        ↓
    Trigger CI Pipeline
        ↓
    ┌─────────────────┐
    │  Install Deps   │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  Type Check     │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  Lint           │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  Run Tests      │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  Build          │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  Upload Artifact│ (optional)
    └────────┬────────┘
             │
        All Passed? ✅
```

## Step-by-Step Implementation

### Step 1: Create GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality-checks:
    name: Quality Checks
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Run tests
        run: npm run test:run

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        if: matrix.node-version == '20.x'
        uses: actions/upload-artifact@v4
        with:
          name: extension-build
          path: dist/
          retention-days: 7

  test-coverage:
    name: Test Coverage
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: false
```

**What this does:**
- Runs on every push and PR
- Tests on multiple Node versions
- Runs all quality checks
- Builds the extension
- Uploads build artifacts
- Tracks test coverage

### Step 2: Add PR Requirements

Create `.github/workflows/pr-checks.yml`:

```yaml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-validation:
    name: PR Validation
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Fetch full history for better analysis

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check commit messages
        uses: wagoid/commitlint-github-action@v5

      - name: Check for large files
        run: |
          find . -type f -size +500k -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
            echo "Large file found: $file"
            exit 1
          done

      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.pull_request.base.sha }}
          head: ${{ github.event.pull_request.head.sha }}

      - name: Bundle size check
        run: |
          npm run build
          SIZE=$(du -sh dist/ | cut -f1)
          echo "Bundle size: $SIZE"
          # Add size limit check if needed

  dependency-review:
    name: Dependency Review
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Dependency Review
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: moderate
```

### Step 3: Add Automated Releases

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:run

      - name: Build
        run: npm run build

      - name: Package extension
        run: |
          cd dist
          zip -r ../extension-${{ github.ref_name }}.zip .
          cd ..

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: extension-${{ github.ref_name }}.zip
          generate_release_notes: true
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload to Chrome Web Store (Optional)
        # Add Chrome Web Store deployment if needed
        run: echo "Deploy to Chrome Web Store here"
```

### Step 4: Configure Branch Protection

Go to GitHub repository settings:

1. **Settings → Branches → Add rule**
2. **Branch name pattern:** `main`
3. **Enable:**
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings

4. **Status checks:**
   - Select "Quality Checks"
   - Select "PR Validation"
   - Select "Test Coverage"

### Step 5: Add Status Badges to README

Add to your `README.md`:

```markdown
# Browser Assistant

[![CI](https://github.com/Jounaidayoub/chat-refactor/actions/workflows/ci.yml/badge.svg)](https://github.com/Jounaidayoub/chat-refactor/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/Jounaidayoub/chat-refactor/branch/main/graph/badge.svg)](https://codecov.io/gh/Jounaidayoub/chat-refactor)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Rest of README...]
```

## Additional Workflows

### Auto-Label PRs

Create `.github/workflows/label-pr.yml`:

```yaml
name: Label PR

on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  label:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/labeler@v5
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

Create `.github/labeler.yml`:

```yaml
'dependencies':
  - package.json
  - package-lock.json

'documentation':
  - '**/*.md'
  - 'docs/**/*'

'tests':
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - '**/*.spec.ts'

'ci/cd':
  - '.github/**/*'

'bug':
  - any: ['**/fix/**', '**/bugfix/**']
```

### Stale Issues/PRs

Create `.github/workflows/stale.yml`:

```yaml
name: Close Stale Issues

on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight

permissions:
  issues: write
  pull-requests: write

jobs:
  stale:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/stale@v9
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          stale-issue-message: 'This issue is stale because it has been open for 30 days with no activity.'
          stale-pr-message: 'This PR is stale because it has been open for 30 days with no activity.'
          days-before-stale: 30
          days-before-close: 7
          stale-issue-label: 'stale'
          stale-pr-label: 'stale'
          exempt-issue-labels: 'pinned,security,roadmap'
          exempt-pr-labels: 'pinned,security'
```

### Dependency Updates

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    reviewers:
      - "Jounaidayoub"
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore"
      include: "scope"
```

## Local CI Simulation

Test CI locally before pushing:

### Install Act (GitHub Actions locally)

```bash
# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Windows
choco install act-cli
```

### Run CI locally

```bash
# Run all jobs
act

# Run specific job
act -j quality-checks

# Run on pull_request event
act pull_request
```

### Pre-commit Alternative

If you don't want full CI, use pre-commit hooks:

```bash
npm install --save-dev husky lint-staged

# Add to package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

## Monitoring and Notifications

### Slack Notifications

Add to workflow:

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "CI failed for ${{ github.repository }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Email Notifications

GitHub sends email notifications by default, but you can configure:

1. Go to Settings → Notifications
2. Configure email preferences
3. Set up custom notification rules

## Performance Optimization

### Cache Dependencies

Already included in workflows above with:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

### Conditional Execution

Run expensive jobs only when needed:

```yaml
jobs:
  e2e-tests:
    if: contains(github.event.pull_request.labels.*.name, 'needs-e2e')
    # ... job steps
```

### Parallel Jobs

Run independent jobs in parallel:

```yaml
jobs:
  lint:
    # ... lint job

  test:
    # ... test job
  
  # These run in parallel
```

## Debugging CI Failures

### Enable Debug Logging

Add to workflow file:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

### SSH into Runner (for debugging)

```yaml
- name: Setup tmate session
  if: failure()
  uses: mxschmitt/action-tmate@v3
  timeout-minutes: 15
```

### Check Logs

1. Go to Actions tab
2. Click on failed workflow
3. Click on failed step
4. Read logs

## Best Practices

### 1. Fail Fast

Put quick checks first:

```yaml
steps:
  - Lint (30s)
  - Type check (1min)
  - Tests (3min)
  - Build (5min)
```

### 2. Cache Aggressively

Cache everything that doesn't change often:
- Dependencies
- Build outputs
- Test results

### 3. Keep Workflows DRY

Create reusable workflows:

```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test

on:
  workflow_call:

jobs:
  test:
    # ... test job
```

Use in other workflows:

```yaml
jobs:
  test:
    uses: ./.github/workflows/reusable-test.yml
```

### 4. Secure Secrets

Never hardcode secrets:

```yaml
# ❌ Bad
env:
  API_KEY: "abc123"

# ✅ Good
env:
  API_KEY: ${{ secrets.API_KEY }}
```

Add secrets in: Settings → Secrets and variables → Actions

### 5. Version Your Actions

Pin action versions:

```yaml
# ❌ Bad (uses latest, could break)
uses: actions/checkout@main

# ✅ Good
uses: actions/checkout@v4
```

## Cost Optimization

GitHub Actions is free for public repos, with limits for private repos:

### Free Tier Limits
- 2,000 minutes/month (Linux)
- 500 MB storage

### Reduce Usage
- Run only on PR and main branch
- Skip CI on doc-only changes
- Use self-hosted runners for private repos

Example: Skip CI for docs:

```yaml
on:
  push:
    branches: [main]
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

## Chrome Web Store Deployment

### Manual Deployment

1. Build extension: `npm run build`
2. Zip dist folder
3. Upload to Chrome Web Store Developer Dashboard

### Automated Deployment (Advanced)

Requires Chrome Web Store API setup:

```yaml
- name: Deploy to Chrome Web Store
  uses: trmcnvn/chrome-webstore-upload-action@v2
  with:
    extension-id: ${{ secrets.EXTENSION_ID }}
    client-id: ${{ secrets.CLIENT_ID }}
    client-secret: ${{ secrets.CLIENT_SECRET }}
    refresh-token: ${{ secrets.REFRESH_TOKEN }}
    file-path: extension.zip
```

## Success Checklist

- [ ] CI workflow created and running
- [ ] PR checks configured
- [ ] Branch protection enabled
- [ ] Test coverage tracking set up
- [ ] Release workflow created
- [ ] Status badges added to README
- [ ] Dependabot configured
- [ ] Team understands CI/CD process
- [ ] CI runs in <10 minutes

## What's Next?

Now that you have CI/CD:
1. **Monitor failures** - Fix broken builds immediately
2. **Iterate on pipeline** - Add checks as needed
3. **Educate team** - Ensure everyone understands workflow
4. **Go back and implement guides** - Start with Code Quality!

**Congratulations! You have automated quality checks.** 🎉

Every commit is now tested automatically, giving you confidence that your code works.

---

**Pro Tips:**
- Keep CI fast (<10 min total)
- Make failures obvious and actionable
- Don't over-complicate - start simple
- Review and improve CI quarterly
- Celebrate green builds!

[← Back: Refactoring Roadmap](./05_REFACTORING_ROADMAP.md) | [Back to Main Guide](../PROTOTYPE_TO_PRODUCTION.md)
