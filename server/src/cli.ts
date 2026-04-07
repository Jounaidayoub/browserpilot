#!/usr/bin/env node
import { Command } from "commander";
import inquirer from "inquirer";
import { getConfigPaths, readConfig, writeConfigAtomic, ensureConfigDir } from "./config/file-config";
import { startServer } from "./server";

type ProviderPrompt = {
  path: ["providers", "openai" | "anthropic" | "google" | "openrouter" | "githubCopilot", "apiKey"];
  label: string;
};

const KEY_PROMPTS: ProviderPrompt[] = [
  { path: ["providers", "openai", "apiKey"], label: "OpenAI API key" },
  { path: ["providers", "anthropic", "apiKey"], label: "Anthropic API key" },
  { path: ["providers", "google", "apiKey"], label: "Google API key" },
  { path: ["providers", "openrouter", "apiKey"], label: "OpenRouter API key" },
  { path: ["providers", "githubCopilot", "apiKey"], label: "GitHub Copilot API key" },
];

const PROVIDER_CHOICES = KEY_PROMPTS.map((promptConfig) => ({
  name: promptConfig.label.replace(" API key", ""),
  value: promptConfig,
}));

function mask(value: string | undefined): string {
  if (!value) return "(not set)";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function setNestedValue(config: ReturnType<typeof readConfig>, path: ProviderPrompt["path"], value: string): void {
  config[path[0]][path[1]][path[2]] = value;
}

function printConfigList(): void {
  const config = readConfig();
  const paths = getConfigPaths();

  console.log("Config file:", paths.configFile);
  console.log("OAuth file:", paths.oauthFile);
  console.log("\nServer:");
  console.log(`  Port: ${config.server.port}`);
  console.log(`  URL: ${config.server.url}`);
  console.log("\nProvider keys:");
  console.log(`  OpenAI: ${mask(config.providers.openai.apiKey)}`);
  console.log(`  Anthropic: ${mask(config.providers.anthropic.apiKey)}`);
  console.log(`  Google: ${mask(config.providers.google.apiKey)}`);
  console.log(`  OpenRouter: ${mask(config.providers.openrouter.apiKey)}`);
  console.log(`  GitHub Copilot: ${mask(config.providers.githubCopilot.apiKey)}`);
  console.log(`  Generic Base URL: ${config.providers.generic.baseUrl ?? "(default)"}`);
}

async function runSetupWizard(): Promise<void> {
  ensureConfigDir();
  const config = readConfig();

  console.log("Browser Pilot setup wizard\n");

  let configureAnotherProvider = true;

  while (configureAnotherProvider) {
    const { selectedProvider }: { selectedProvider: ProviderPrompt } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedProvider",
        message: "Which provider do you want to configure?",
        choices: [
          ...PROVIDER_CHOICES,
          {
            name: "Done configuring provider keys",
            value: null,
          },
        ],
      },
    ]);

    if (!selectedProvider) {
      break;
    }

    const currentValue = config[selectedProvider.path[0]][selectedProvider.path[1]][selectedProvider.path[2]];

    const { apiKey } = await inquirer.prompt([
      {
        type: "password",
        mask: "*",
        name: "apiKey",
        message: `${selectedProvider.label} (${mask(currentValue)}):`,
        default: currentValue ?? "",
      },
    ]);

    if (typeof apiKey === "string") {
      setNestedValue(config, selectedProvider.path, apiKey.trim());
    }

    const { shouldContinue } = await inquirer.prompt([
      {
        type: "confirm",
        name: "shouldContinue",
        message: "Configure another provider?",
        default: false,
      },
    ]);

    configureAnotherProvider = shouldContinue;
  }

  const { changeServerSettings } = await inquirer.prompt([
    {
      type: "confirm",
      name: "changeServerSettings",
      message: "Change server settings (port, URL, generic base URL)?",
      default: false,
    },
  ]);

  if (changeServerSettings) {
    const serverAnswers = await inquirer.prompt([
      {
        type: "number",
        name: "port",
        message: "Server port",
        default: config.server.port,
      },
      {
        type: "input",
        name: "url",
        message: "Server URL (used for OAuth callback)",
        default: config.server.url,
      },
      {
        type: "input",
        name: "genericBaseUrl",
        message: "Generic model base URL",
        default: config.providers.generic.baseUrl ?? "http://localhost:4141/v1",
      },
    ]);

    config.server.port = Number(serverAnswers.port) || 8080;
    config.server.url = serverAnswers.url;
    config.providers.generic.baseUrl = serverAnswers.genericBaseUrl;
  }

  writeConfigAtomic(config);

  console.log("\nSetup complete.");
  console.log(`Config saved to: ${getConfigPaths().configFile}`);
  console.log("Run `browser-pilot` to start the server.\n");
}

const program = new Command();

program
  .name("browser-pilot")
  .description("Browser Pilot server CLI")
  .action(async () => {
    await startServer();
  });

program
  .command("setup")
  .description("Run interactive setup wizard")
  .action(async () => {
    await runSetupWizard();
  });

const configCommand = program.command("config").description("Config helpers");

configCommand
  .command("list")
  .description("Show current config values (API keys masked)")
  .action(() => {
    printConfigList();
  });

program.parseAsync(process.argv);
