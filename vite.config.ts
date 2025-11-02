import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import zip from "vite-plugin-zip-pack";
import manifest from "./manifest.config.js";
import { name, version } from "./package.json";
import tailwindcss from "@tailwindcss/vite";


export default defineConfig({
  resolve: {
    alias: {
      "@": `${path.resolve(__dirname, "src")}`,
      "playwright_lib": `${path.resolve(__dirname, "./node_modules/playwright/lib")}`,
    },
  },
  plugins: [
    react(),
    crx({ manifest }),
    zip({ outDir: "release", outFileName: `crx-${name}-${version}.zip` }),
    tailwindcss(),
    
  ],
  optimizeDeps: {
    exclude: ["playwright-crx"],
  },
  build: {
    // commonjsOptions: { include: ["pixelmatch"] },
    minify: false,
    sourcemap: true,
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
