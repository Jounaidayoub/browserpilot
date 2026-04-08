import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    16: "public/icon16.png",
    32: "public/icon32.png",
    48: "public/icon48.png",
    128: "public/icon128.png",
  },
  action: {
    default_icon: {
      16: "public/icon16.png",
      32: "public/icon32.png",
      48: "public/icon48.png",
      128: "public/icon128.png",
    },
    default_popup: "src/popup/index.html",
  },
  background: {
    service_worker: "src/bg.ts",
    type: "module",
  },
  commands: {
    "open-tab-next-to-current": {
      "suggested_key": {
        "windows": "Alt+T",
        "linux": "Alt+T",
      },
      "description": "Open a new tab next to the current tab."
    },
    "open-side-panel": {
      "suggested_key": {
        "default": "Ctrl+Shift+K",
        "mac": "Command+Shift+K"
      },
      "description": "Open the side panel."
    }
  },
  permissions: ["sidePanel", "contentSettings", "tabs", "tabGroups", "history", "activeTab", "scripting", "debugger", "storage", ""],
  host_permissions: ["https://*/*", "http://*/*", "chrome://*/*", "chrome-extension://*/*"],
  content_scripts: [
    {
      js: ["src/content/main.tsx"],
      matches: ["https://*/*"],
    },
  ],
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },

  web_accessible_resources: [],
});
