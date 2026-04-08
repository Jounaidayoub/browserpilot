import { mkdir, cp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const repoRoot = resolve(__dirname, "..", "..");
const extensionToolsDir = resolve(repoRoot, "src", "tools");

const sourceFiles = [
  [resolve(extensionToolsDir, "types.ts"), "types.ts"],
  [resolve(extensionToolsDir, "definitions", "index.ts"), "definitions/index.ts"],
  [resolve(extensionToolsDir, "definitions", "tabs.def.ts"), "definitions/tabs.def.ts"],
  [resolve(extensionToolsDir, "definitions", "page.def.ts"), "definitions/page.def.ts"],
  [resolve(extensionToolsDir, "definitions", "history.def.ts"), "definitions/history.def.ts"],
  [resolve(extensionToolsDir, "definitions", "time.def.ts"), "definitions/time.def.ts"],
];

const targetRoot = resolve(__dirname, "..", "src", "generated", "tool-definitions");

async function main() {
  await rm(targetRoot, { recursive: true, force: true });

  for (const [source, relativeTarget] of sourceFiles) {
    const target = resolve(targetRoot, relativeTarget);
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target);
  }

  console.log("Generated server tool definitions at", targetRoot);
}

main().catch((error) => {
  console.error("Failed to generate tool definitions:", error);
  process.exit(1);
});
