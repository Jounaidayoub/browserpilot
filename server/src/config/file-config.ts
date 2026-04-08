import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface AppConfig {
  server: {
    port: number;
    url: string;
  };
  providers: {
    openai: ProviderConfig;
    anthropic: ProviderConfig;
    google: ProviderConfig;
    openrouter: ProviderConfig;
    githubCopilot: ProviderConfig;
    generic: ProviderConfig;
  };
}

export type OAuthFlowStatus = "pending" | "completed" | "error";

export interface StoredOAuthFlow {
  state: string;
  provider: "default" | "openrouter";
  status: OAuthFlowStatus;
  error: string | null;
  createdAt: number;
  expiresAt: number;
}

export interface OAuthStore {
  flows: StoredOAuthFlow[];
}

const APP_DIR_NAME = "browser-pilot";

const DEFAULT_CONFIG: AppConfig = {
  server: {
    port: 8080,
    url: "http://localhost:8080",
  },
  providers: {
    openai: {},
    anthropic: {},
    google: {},
    openrouter: {},
    githubCopilot: {},
    generic: {
      baseUrl: "http://localhost:4141/v1",
    },
  },
};

const DEFAULT_OAUTH_STORE: OAuthStore = {
  flows: [],
};

export function getConfigDir(): string {
  const platform = process.platform;

  if (platform === "win32" && process.env.APPDATA) {
    return join(process.env.APPDATA, APP_DIR_NAME);
  }

  if (platform === "darwin") {
    return join(homedir(), "Library", "Application Support", APP_DIR_NAME);
  }

  const xdgConfig = process.env.XDG_CONFIG_HOME;
  if (xdgConfig) {
    return join(xdgConfig, APP_DIR_NAME);
  }

  return join(homedir(), ".config", APP_DIR_NAME);
}

export function getConfigPaths() {
  const configDir = getConfigDir();

  return {
    configDir,
    configFile: join(configDir, "config.json"),
    oauthFile: join(configDir, "oauth.json"),
  };
}

export function ensureConfigDir(): void {
  mkdirSync(getConfigPaths().configDir, { recursive: true });
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    const fileContent = readFileSync(filePath, "utf-8");
    return { ...fallback, ...JSON.parse(fileContent) };
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(filePath: string, value: unknown): void {
  ensureConfigDir();
  const dir = dirname(filePath);
  const tempFilePath = join(dir, `${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);

  try {
    writeFileSync(tempFilePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
    renameSync(tempFilePath, filePath);
  } finally {
    rmSync(tempFilePath, { force: true });
  }
}

export function readConfig(): AppConfig {
  const { configFile } = getConfigPaths();
  const partial = readJsonFile<Partial<AppConfig>>(configFile, {});

  return {
    server: {
      port: partial.server?.port ?? DEFAULT_CONFIG.server.port,
      url: partial.server?.url ?? DEFAULT_CONFIG.server.url,
    },
    providers: {
      openai: {
        ...DEFAULT_CONFIG.providers.openai,
        ...partial.providers?.openai,
      },
      anthropic: {
        ...DEFAULT_CONFIG.providers.anthropic,
        ...partial.providers?.anthropic,
      },
      google: {
        ...DEFAULT_CONFIG.providers.google,
        ...partial.providers?.google,
      },
      openrouter: {
        ...DEFAULT_CONFIG.providers.openrouter,
        ...partial.providers?.openrouter,
      },
      githubCopilot: {
        ...DEFAULT_CONFIG.providers.githubCopilot,
        ...partial.providers?.githubCopilot,
      },
      generic: {
        ...DEFAULT_CONFIG.providers.generic,
        ...partial.providers?.generic,
      },
    },
  };
}

export function writeConfigAtomic(config: AppConfig): void {
  const { configFile } = getConfigPaths();
  writeJsonAtomic(configFile, config);
}

export function readOAuthStore(): OAuthStore {
  const { oauthFile } = getConfigPaths();
  const partial = readJsonFile<Partial<OAuthStore>>(oauthFile, {});

  return {
    flows: Array.isArray(partial.flows) ? partial.flows : [],
  };
}

export function writeOAuthStoreAtomic(store: OAuthStore): void {
  const { oauthFile } = getConfigPaths();
  writeJsonAtomic(oauthFile, store);
}
