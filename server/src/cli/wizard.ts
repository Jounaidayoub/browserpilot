import * as readline from "node:readline/promises";
import { loadConfig, saveConfig, getConfigPath, type ProviderId } from "../config/userConfig.ts";

const PROVIDERS: Array<{ id: ProviderId; label: string; pattern?: RegExp }> = [
    { id: "openai", label: "OpenAI", pattern: /^sk-[A-Za-z0-9_-]{20,}$/ },
    { id: "anthropic", label: "Anthropic", pattern: /^sk-ant-[A-Za-z0-9_-]{10,}$/ },
    { id: "google", label: "Google (Gemini)", pattern: /^AIza[A-Za-z0-9_-]{10,}$/ },
    { id: "openrouter", label: "OpenRouter", pattern: /^sk-or-[A-Za-z0-9_-]{10,}$/ },
    { id: "github-copilot", label: "GitHub Copilot" },
    { id: "generic", label: "Generic OpenAI-compatible" },
];

function maskKey(key: string): string {
    if (key.length <= 10) return "***";
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

function printConfig(): void {
    const config = loadConfig();
    console.log("\n📋 Current configuration:");
    console.log(`  Port: ${config.port}`);
    console.log("  Providers:");

    const entries = Object.entries(config.providers);
    if (entries.length === 0) {
        console.log("    (none configured)");
    } else {
        for (const [id, cfg] of entries) {
            if (!cfg) continue;
            const parts: string[] = [];
            if (cfg.apiKey) parts.push(`key: ${maskKey(cfg.apiKey)}`);
            if (cfg.baseUrl) parts.push(`baseUrl: ${cfg.baseUrl}`);
            console.log(`    ${id}: ${parts.join(", ")}`);
        }
    }
    console.log(`\n  Config file: ${getConfigPath()}\n`);
}

export async function runWizard(): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    console.log("\n🤖 Browser Assistant — Setup Wizard");
    console.log("=====================================");
    printConfig();

    let running = true;
    while (running) {
        console.log("What would you like to do?");
        console.log("  [1] Add / update an API key");
        console.log("  [2] Set server port");
        console.log("  [3] View current configuration");
        console.log("  [4] Start the server now");
        console.log("  [5] Exit");

        const choice = (await rl.question("\nYour choice: ")).trim();

        switch (choice) {
            case "1": {
                console.log("\nSelect a provider:");
                PROVIDERS.forEach((p, i) => console.log(`  [${i + 1}] ${p.label}`));
                const idx = parseInt((await rl.question("Provider number: ")).trim(), 10) - 1;
                const provider = PROVIDERS[idx];
                if (!provider) {
                    console.log("Invalid selection.\n");
                    break;
                }

                let apiKey = (await rl.question(`  Enter API key for ${provider.label}: `)).trim();
                if (!apiKey) {
                    console.log("No key entered, skipping.\n");
                    break;
                }

                if (provider.pattern && !provider.pattern.test(apiKey)) {
                    console.log(`  ⚠️  Key format doesn't look right for ${provider.label}, but saving anyway.`);
                }

                let baseUrl: string | undefined;
                if (provider.id === "github-copilot" || provider.id === "generic") {
                    baseUrl = (await rl.question(`  Enter base URL (leave blank for default): `)).trim() || undefined;
                }

                const config = loadConfig();
                config.providers[provider.id] = {
                    ...config.providers[provider.id],
                    apiKey,
                    ...(baseUrl ? { baseUrl } : {}),
                };
                saveConfig(config);
                console.log(`  ✅ ${provider.label} key saved.\n`);
                break;
            }

            case "2": {
                const raw = (await rl.question("  Enter new port (1–65535): ")).trim();
                const port = parseInt(raw, 10);
                if (isNaN(port) || port < 1 || port > 65535) {
                    console.log("  Invalid port.\n");
                    break;
                }
                const config = loadConfig();
                config.port = port;
                saveConfig(config);
                console.log(`  ✅ Port set to ${port}.\n`);
                break;
            }

            case "3":
                printConfig();
                break;

            case "4":
                console.log("\nStarting server...\n");
                rl.close();
                const { startServer } = await import("../server.ts");
                await startServer();
                return;

            case "5":
            default:
                running = false;
                break;
        }
    }

    rl.close();
    console.log("Bye!\n");
}
