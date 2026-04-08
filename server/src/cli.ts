import { Command } from "commander";
import inquirer from "inquirer";
import { getConfigPaths, readConfig, writeConfigAtomic, ensureConfigDir, hasConfigFile } from "./config/file-config";
import { startServer } from "./server";

type ProviderPrompt = {
  path: ["providers", "openai" | "anthropic" | "google" | "openrouter" | "githubCopilot", "apiKey" | "baseUrl"];
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
  console.log(`  GitHub Copilot Base URL: ${config.providers.githubCopilot.baseUrl ?? "(not set)"}`);
  console.log(`  Generic Base URL: ${config.providers.generic.baseUrl ?? "(default)"}`);
}

async function runSetupWizard(): Promise<boolean> {
  ensureConfigDir();
  const config = readConfig();

  console.log("Browser Pilot setup wizard\n");

  let configureAnotherProvider = true;

  while (configureAnotherProvider) {
    const { selectedProvider } = await inquirer.prompt<{ selectedProvider: ProviderPrompt }>([
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

    if (selectedProvider.path[1] === "githubCopilot" && selectedProvider.path[2] === "apiKey") {
      const currentBaseUrl = config.providers.githubCopilot.baseUrl;

      const { baseUrl } = await inquirer.prompt([
        {
          type: "input",
          name: "baseUrl",
          message: `GitHub Copilot Base URL (${currentBaseUrl ?? "not set"}):`,
          default: currentBaseUrl ?? "",
        },
      ]);

      if (typeof baseUrl === "string") {
        config.providers.githubCopilot.baseUrl = baseUrl.trim();
      }
    }

    const isSecretValue = selectedProvider.path[2] === "apiKey";
    const answerName = selectedProvider.path[2];
    const answer = await inquirer.prompt([
      {
        type: isSecretValue ? "password" : "input",
        ...(isSecretValue ? { mask: "*" } : {}),
        name: answerName,
        message: `${selectedProvider.label} (${isSecretValue ? mask(currentValue) : (currentValue ?? "not set")}):`,
        default: currentValue ?? "",
      },
    ]);

    const nextValue = answer[answerName];

    if (typeof nextValue === "string") {
      setNestedValue(config, selectedProvider.path, nextValue.trim());
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

  const { startNow } = await inquirer.prompt([
    {
      type: "confirm",
      name: "startNow",
      message: "Start the server now?",
      default: true,
    },
  ]);

  if (!startNow) {
    console.log("Okay — next time run `browserpilot` to start the server.\n");
  }

  return startNow;
}

const program = new Command();

program
  .name("browserpilot")
  .description("Browser Pilot server CLI")
  .option("-d, --debug", "Enable debug logging")
  .action(async () => {
    const options = program.opts<{ debug?: boolean }>();

    if (options.debug) {
      process.env.BROWSERPILOT_DEBUG = "true";
    }

    const shouldRunFirstSetup = !hasConfigFile();
    if (shouldRunFirstSetup) {
      console.log("No existing BrowserPilot configuration found. Starting first-time setup.\n");
      const startNow = await runSetupWizard();

      if (!startNow) {
        console.log("Great. Next time just run `browserpilot`.");
        return;
      }
    }

    await startServer({ debug: Boolean(options.debug) });
  });

program
  .command("setup")
  .description("Run interactive setup wizard")
  .action(async () => {
    const startNow = await runSetupWizard();
    if (startNow) {
      const options = program.opts<{ debug?: boolean }>();
      await startServer({ debug: Boolean(options.debug) });
    }
  });

const configCommand = program.command("config").description("Config helpers");

configCommand
  .command("list")
  .description("Show current config values (API keys masked)")
  .action(() => {
    printConfigList();
  });

program.parseAsync(process.argv);
