import { randomUUID } from "node:crypto";
import { readConfig, readOAuthStore, type OAuthFlowStatus as StoredFlowStatus, type StoredOAuthFlow, writeConfigAtomic, writeOAuthStoreAtomic } from "../config/file-config";

export type ProviderId = "default" | "openrouter";
export type OAuthFlowStatus = StoredFlowStatus;

export interface OAuthFlow {
  state: string;
  provider: ProviderId;
  status: OAuthFlowStatus;
  error: string | null;
  createdAt: number;
  expiresAt: number;
}

export interface InsertOAuthFlow extends OAuthFlow {}

export interface ProviderKey {
  id: string;
  provider: ProviderId;
  apiKey: string;
  createdAt: number;
  updatedAt: number;
}

export interface InsertProviderKey extends ProviderKey {}

const FLOW_TTL_MS = 10 * 60 * 1000;

export function dbNow(): number {
  return Date.now();
}

export async function createOAuthFlow(provider: ProviderId): Promise<OAuthFlow> {
  const now = dbNow();
  const flow: OAuthFlow = {
    state: randomUUID(),
    provider,
    status: "pending",
    error: null,
    createdAt: now,
    expiresAt: now + FLOW_TTL_MS,
  };

  const store = readOAuthStore();
  store.flows.push(flow as StoredOAuthFlow);
  writeOAuthStoreAtomic(store);

  return flow;
}

export async function getOAuthFlow(state: string): Promise<OAuthFlow | null> {
  const store = readOAuthStore();
  return store.flows.find((flow) => flow.state === state) ?? null;
}

export async function updateOAuthFlowStatus(
  state: string,
  status: OAuthFlowStatus,
  error: string | null
): Promise<void> {
  const store = readOAuthStore();
  const flow = store.flows.find((item) => item.state === state);

  if (!flow) {
    return;
  }

  flow.status = status;
  flow.error = error;
  writeOAuthStoreAtomic(store);
}

export async function upsertProviderKey(provider: ProviderId, apiKey: string): Promise<void> {
  const config = readConfig();

  if (provider === "openrouter") {
    config.providers.openrouter.apiKey = apiKey;
  }

  writeConfigAtomic(config);
}

export async function getProviderKey(provider: ProviderId): Promise<ProviderKey | null> {
  const config = readConfig();

  let apiKey: string | undefined;

  if (provider === "openrouter") {
    apiKey = config.providers.openrouter.apiKey;
  }

  if (!apiKey) {
    return null;
  }

  const now = dbNow();
  return {
    id: provider,
    provider,
    apiKey,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getLatestOAuthFlow(provider: ProviderId): Promise<OAuthFlow | null> {
  const store = readOAuthStore();
  const flows = store.flows
    .filter((flow) => flow.provider === provider)
    .sort((a, b) => b.createdAt - a.createdAt);

  return flows[0] ?? null;
}
