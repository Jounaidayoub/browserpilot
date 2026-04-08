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
pnpm install
npx browser-pilot setup
```

The setup wizard writes your configuration and provider keys to platform-specific config files.

Start server:

```bash
npx browser-pilot
```

Server runs at `http://localhost:8080` by default.

### 3. Open Sidepanel

Press `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac) or click the extension icon → "Open side panel"

---

## Configuration

Browser Pilot stores plain-text JSON config in your home config directory:

- **Linux**: `${XDG_CONFIG_HOME:-~/.config}/browser-pilot/config.json`
- **macOS**: `~/Library/Application Support/browser-pilot/config.json`
- **Windows**: `%APPDATA%\\browser-pilot\\config.json`

OAuth flow records are stored in `oauth.json` in the same directory.

Useful commands:

```bash
npx browser-pilot setup
npx browser-pilot config:list
npx browser-pilot config:path
```

---

## Features & Examples

See [docs/FEATURES.md](./docs/FEATURES.md) for:
- Available tools (tabs, groups, history, page content)
- Usage examples
- Screenshots
- Architecture deep-dive
