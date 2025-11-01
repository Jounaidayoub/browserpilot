import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: "public/logo.png",
  },
  action: {
    default_icon: {
      48: "public/logo.png",
    },
    default_popup: "src/popup/index.html",
  },
  background: {
    service_worker: "src/bg.ts",
    type: "module",
  },
  permissions: ["sidePanel", "contentSettings","tabs","tabGroups","history","activeTab","scripting","debugger"],
  host_permissions: ["https://*/*", "http://*/*","chrome://*/*","chrome-extension://*/*"],
  content_scripts: [
    {
      js: ["src/content/main.tsx"],
      matches: ["https://*/*"],
      
    },
    {
      js: ["src/policy.js"],
      run_at: "document_start",
      matches: ["https://*/*"],
      
    }

  ],
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },
  web_accessible_resources: [
    {
      resources: ["injector/runner.js"],
      matches: ["<all_urls>"],
    },
  ],
});
