import { join } from "node:path";
import { readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { getConfigDir } from "./userConfig.ts";

export type OAuthFlowStatus = "pending" | "completed" | "error";

export interface OAuthFlow {
    state: string;
    provider: string;
    status: OAuthFlowStatus;
    error: string | null;
    createdAt: number;
    expiresAt: number;
}

interface OAuthStore {
    flows: Record<string, OAuthFlow>;
}

const FLOW_TTL_MS = 10 * 60 * 1000;

function getOAuthStorePath(): string {
    return join(getConfigDir(), "oauth.json");
}

function loadOAuthStore(): OAuthStore {
    const path = getOAuthStorePath();
    if (!existsSync(path)) {
        return { flows: {} };
    }
    try {
        const raw = readFileSync(path, "utf-8");
        return JSON.parse(raw) as OAuthStore;
    } catch {
        return { flows: {} };
    }
}

function saveOAuthStore(store: OAuthStore): void {
    const dir = getConfigDir();
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    const path = getOAuthStorePath();
    const tmp = join(tmpdir(), `browser-assistant-oauth-${randomUUID()}.json`);
    writeFileSync(tmp, JSON.stringify(store, null, 2), "utf-8");
    renameSync(tmp, path);
}

export function createOAuthFlow(provider: string): OAuthFlow {
    const now = Date.now();
    const flow: OAuthFlow = {
        state: randomUUID(),
        provider,
        status: "pending",
        error: null,
        createdAt: now,
        expiresAt: now + FLOW_TTL_MS,
    };

    const store = loadOAuthStore();
    store.flows[flow.state] = flow;
    saveOAuthStore(store);

    return flow;
}

export function getOAuthFlow(state: string): OAuthFlow | null {
    const store = loadOAuthStore();
    return store.flows[state] ?? null;
}

export function updateOAuthFlowStatus(
    state: string,
    status: OAuthFlowStatus,
    error: string | null
): void {
    const store = loadOAuthStore();
    const flow = store.flows[state];
    if (!flow) return;
    store.flows[state] = { ...flow, status, error };
    saveOAuthStore(store);
}

export function getLatestOAuthFlow(provider: string): OAuthFlow | null {
    const store = loadOAuthStore();
    const flows = Object.values(store.flows)
        .filter((f) => f.provider === provider)
        .sort((a, b) => b.createdAt - a.createdAt);
    return flows[0] ?? null;
}
