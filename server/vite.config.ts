import { defineConfig } from "vite";
import nodeExternals from "rollup-plugin-node-externals";

export default defineConfig({
  plugins: [nodeExternals()],
  build: {
    emptyOutDir: true,
    target: "node20",
    lib: {
      entry: './src/cli.ts',
      formats: ['es'],
      fileName: () => "cli.js",
    },
    rollupOptions: {
      output: {
        banner: "#!/usr/bin/env node",
      }
    }
  },
});
