# BrowserPilot

an agent that lives in your browser sidepanel to handle and automate browsing tasks , it can navigate , summrize,fill forms , work on repeptive/tedious tasks , organizing tabs , just tell it what to do ...

## Quick Start

### 1. Install Extension

**From Release (Recommended)**
1. Download the latest release from [GitHub Releases](https://github.com/your-repo/releases)
2. Extract the ZIP file
3. Open Chrome → `chrome://extensions/`
4. Enable **Developer mode** → **Load unpacked**
5. Select the extracted `dist` folder

**Build from Source**
```bash
pnpm install
pnpm run build
```
Then load `dist/` folder as above.

### 2. Setup Server

```bash
cd server
cp .env.example .env
# Edit .env with your API keys (see config options below)

pnpm install
pnpm run migrate
pnpm run dev
```

Server runs at `http://localhost:8080`

### 3. Open Sidepanel

Press `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac) or click the extension icon → "Open side panel"

---

## Configuration

Create `server/.env`:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 8080) |
| `OPENAI_API_KEY` | OpenAI key |
| `ANTHROPIC_API_KEY` | Anthropic key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI key |
| `DB_FILE_NAME` | SQLite database path |

---

## Features & Examples

See [docs/FEATURES.md](./docs/FEATURES.md) for:
- Available tools (tabs, groups, history, page content)
- Usage examples
- Screenshots
- Architecture deep-dive