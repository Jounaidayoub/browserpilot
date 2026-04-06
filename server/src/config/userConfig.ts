import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { randomUUID } from "node:crypto";

export interface ProviderConfig {
    apiKey?: string;
    baseUrl?: string;
}

export interface UserConfig {
    port: number;
    providers: {
        openai?: ProviderConfig;
        anthropic?: ProviderConfig;
        google?: ProviderConfig;
        openrouter?: ProviderConfig;
        "github-copilot"?: ProviderConfig;
        generic?: ProviderConfig;
        [key: string]: ProviderConfig | undefined;
    };
    mcp?: Record<string, unknown>;
}

export type ProviderId = keyof UserConfig["providers"];

const DEFAULT_CONFIG: UserConfig = {
    port: 8080,
    providers: {},
};

export function getConfigDir(): string {
    return join(homedir(), ".config", "browser-assistant");
}

export function getConfigPath(): string {
    return join(getConfigDir(), "config.json");
}

let _cachedConfig: UserConfig | null = null;

export function loadConfig(): UserConfig {
    if (_cachedConfig) return _cachedConfig;

    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
        _cachedConfig = { ...DEFAULT_CONFIG, providers: {} };
        return _cachedConfig;
    }

    try {
        const raw = readFileSync(configPath, "utf-8");
        _cachedConfig = { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as UserConfig;
        return _cachedConfig;
    } catch {
        _cachedConfig = { ...DEFAULT_CONFIG, providers: {} };
        return _cachedConfig;
    }
}

export function saveConfig(config: UserConfig): void {
    const dir = getConfigDir();
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    const configPath = getConfigPath();
    const tmp = join(tmpdir(), `browser-assistant-config-${randomUUID()}.json`);
    writeFileSync(tmp, JSON.stringify(config, null, 2), "utf-8");
    renameSync(tmp, configPath);

    // Invalidate cache
    _cachedConfig = config;
}

export function getApiKey(provider: ProviderId): string | undefined {
    return loadConfig().providers[provider]?.apiKey;
}

export function setApiKey(provider: ProviderId, apiKey: string, baseUrl?: string): void {
    const config = loadConfig();
    config.providers[provider] = {
        ...config.providers[provider],
        apiKey,
        ...(baseUrl ? { baseUrl } : {}),
    };
    saveConfig(config);
}

export function removeProvider(provider: ProviderId): void {
    const config = loadConfig();
    delete config.providers[provider];
    saveConfig(config);
}

export function hasAnyProviderConfigured(): boolean {
    const config = loadConfig();
    return Object.values(config.providers).some((p) => p?.apiKey || p?.baseUrl);
}

/** Reset the in-memory cache (useful for testing or after external config changes) */
export function _resetConfigCache(): void {
    _cachedConfig = null;
}
