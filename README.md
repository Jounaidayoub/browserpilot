


# BrowserPilot

an agent that lives in your browser sidepanel to handle and automate browsing tasks , it can navigate , summrize,fill forms , work on repeptive/tedious tasks , organizing tabs , just tell it what to do ...

## Demo

https://github.com/user-attachments/assets/e21b1dab-fd75-4255-9514-34a1a1123df0
<!-- <video src="./docs/browserpilot.mp4" controls width="100%"></video> -->

## Quick Start

### 1. Install Extension

**From Release (Recommended)**
1. Download the latest release from [GitHub Releases](https://github.com/Jounaidayoub/browserpilot/releases/)
2. Extract the ZIP file
3. Open Chrome → `chrome://extensions/`
4. Enable **Developer mode** → **Load unpacked**
5. Select the extracted `dist` folder

### 2. Setup Server (Global install first)

```bash
npm install -g @ayoubj/browserpilot
browserpilot setup
```

The setup wizard writes your configuration and provider keys to platform-specific config files.

Start the server (normal mode):

```bash
browserpilot
```

Optional debug mode (verbose logs):

```bash
browserpilot --debug
```

Or run directly with npx (no global install):

```bash
npx @ayoubj/browserpilot setup
npx @ayoubj/browserpilot
```

Server runs at `http://localhost:8080` by default and prints a clean running message unless debug is enabled.

### 3. Development (Clone + Build)

Clone/install/build is only needed if you want to develop BrowserPilot locally.

```bash
pnpm install
pnpm run build
```

Then load `dist/` in Chrome as described above.

### 4. Open Sidepanel

Press `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac) or click the extension icon → "Open side panel"

---

## Configuration

Browser Pilot stores plain-text JSON config in your home config directory:

- **Linux**: `${XDG_CONFIG_HOME:-~/.config}/browserpilot/config.json`
- **macOS**: `~/Library/Application Support/browserpilot/config.json`
- **Windows**: `%APPDATA%\\browserpilot\\config.json`

OAuth flow records are stored in `oauth.json` in the same directory.

Useful commands:

```bash
browserpilot setup
browserpilot config list
browserpilot
# fallback:
npx @ayoubj/browserpilot
```

---

## Features & Examples

See [docs/FEATURES.md](./docs/FEATURES.md) for:
- Available tools (tabs, groups, history, page content)
- Usage examples
- Screenshots
- Architecture deep-dive
