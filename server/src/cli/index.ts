#!/usr/bin/env node
import { loadConfig, hasAnyProviderConfigured, getConfigPath } from "../config/userConfig.ts";

const command = process.argv[2];

async function main(): Promise<void> {
    switch (command) {
        case "setup": {
            const { runWizard } = await import("./wizard.ts");
            await runWizard();
            break;
        }

        case "status": {
            const config = loadConfig();
            console.log("\n📊 Browser Assistant — Status");
            console.log("==============================");
            console.log(`  Port: ${config.port}`);
            console.log("  Providers:");

            const entries = Object.entries(config.providers);
            if (entries.length === 0) {
                console.log("    (none configured)");
            } else {
                for (const [id, cfg] of entries) {
                    if (!cfg) continue;
                    const hasKey = Boolean(cfg.apiKey);
                    const hasUrl = Boolean(cfg.baseUrl);
                    const tags: string[] = [];
                    if (hasKey) tags.push("key ✅");
                    if (hasUrl) tags.push(`baseUrl: ${cfg.baseUrl}`);
                    console.log(`    ${id}: ${tags.join(", ")}`);
                }
            }
            console.log(`\n  Config file: ${getConfigPath()}\n`);
            break;
        }

        default: {
            const isFirstRun = !hasAnyProviderConfigured();
            if (isFirstRun) {
                console.log("\n👋 Welcome to Browser Assistant!");
                console.log("   No providers are configured yet. Let's set one up.\n");
                const { runWizard } = await import("./wizard.ts");
                await runWizard();
            } else {
                const { startServer } = await import("../server.ts");
                await startServer();
            }
            break;
        }
    }
}

main().catch((err) => {
    console.error("Fatal error:", err instanceof Error ? err.message : err);
    process.exit(1);
});
