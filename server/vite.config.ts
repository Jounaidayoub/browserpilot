import { builtinModules } from "node:module";
import { defineConfig } from "vite";

const nodeBuiltins = new Set([
  ...builtinModules,
  ...builtinModules.map((mod) => `node:${mod}`),
]);

const external = (id: string): boolean => {
  if (nodeBuiltins.has(id)) {
    return true;
  }

  // Keep npm deps external; bundle only local server code + generated definitions.
  if (!id.startsWith(".") && !id.startsWith("/") && !id.startsWith("..")) {
    return true;
  }

  return false;
};

export default defineConfig({
  build: {
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    target: "node20",
    lib: {
      entry: {
        index: "src/index.ts",
        cli: "src/cli.ts",
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external,
    },
  },
});
