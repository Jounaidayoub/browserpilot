export type { OAuthFlowStatus, OAuthFlow } from "../config/oauthStore.ts";
export {
    createOAuthFlow,
    getOAuthFlow,
    updateOAuthFlowStatus,
    getLatestOAuthFlow,
} from "../config/oauthStore.ts";

export type { ProviderId } from "../config/userConfig.ts";
export { getApiKey, setApiKey, removeProvider } from "../config/userConfig.ts";

import { getApiKey, setApiKey } from "../config/userConfig.ts";

/**
 * Upsert a provider API key in the config file.
 * Thin wrapper over setApiKey for backwards-compatibility with the route layer.
 */
export function upsertProviderKey(provider: string, apiKey: string): void {
    setApiKey(provider, apiKey);
}

/**
 * Get a provider API key from the config file.
 * Returns a minimal shape compatible with the existing route layer.
 */
export function getProviderKey(
    provider: string
): { apiKey: string } | null {
    const key = getApiKey(provider);
    return key ? { apiKey: key } : null;
}
