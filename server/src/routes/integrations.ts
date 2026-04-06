import { Hono } from "hono";
import { env } from "../config/env.ts";
import { loadConfig, setApiKey, removeProvider } from "../config/userConfig.ts";
import {
    createOAuthFlow,
    getLatestOAuthFlow,
    getOAuthFlow,
    updateOAuthFlowStatus,
} from "../config/oauthStore.ts";
import { upsertProviderKey } from "../lib/integrations.ts";

interface OpenRouterKeyResponse {
    key?: string;
    error?: string;
}

const integrationsRoutes = new Hono();

// ─── OAuth flow (OpenRouter) ──────────────────────────────────────────────────

integrationsRoutes.get("/openrouter/start", async (c) => {
    const flow = createOAuthFlow("openrouter");
    const callbackUrl = `${env.SERVER_URL}/api/integrations/openrouter/callback?state=${flow.state}`;
    const redirectUrl = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(callbackUrl)}`;

    return c.redirect(redirectUrl, 302);
});

integrationsRoutes.get("/openrouter/callback", async (c) => {
    const state = c.req.query("state");
    const code = c.req.query("code");

    if (!state) {
        return c.text("Invalid flow: missing state", 400);
    }

    if (!code) {
        return c.text("Missing code", 400);
    }

    const flow = getOAuthFlow(state);
    if (!flow || flow.provider !== "openrouter") {
        return c.text("Invalid flow", 400);
    }

    if (flow.status !== "pending") {
        return c.text("Flow already completed", 400);
    }

    if (flow.expiresAt < Date.now()) {
        updateOAuthFlowStatus(flow.state, "error", "Flow expired");
        return c.text("Flow expired, restart", 400);
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/auth/keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            updateOAuthFlowStatus(flow.state, "error", errorText.slice(0, 500));
            return c.text("OpenRouter exchange failed", 400);
        }

        const data = (await response.json()) as OpenRouterKeyResponse;
        if (!data.key) {
            updateOAuthFlowStatus(flow.state, "error", data.error ?? "Missing key");
            return c.text("OpenRouter exchange failed", 400);
        }

        upsertProviderKey("openrouter", data.key);
        updateOAuthFlowStatus(flow.state, "completed", null);

        return c.html(
            "<html><body><p>OpenRouter connected. You can close this tab.</p></body></html>"
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        updateOAuthFlowStatus(flow.state, "error", message);
        return c.text("OpenRouter exchange failed", 400);
    }
});

integrationsRoutes.get("/openrouter/status", async (c) => {
    const config = loadConfig();
    const hasKey = Boolean(config.providers.openrouter?.apiKey);
    const latestFlow = getLatestOAuthFlow("openrouter");

    return c.json({
        connected: hasKey,
        status: latestFlow?.status,
        error: latestFlow?.error ?? undefined,
    });
});

// ─── Generic key management ───────────────────────────────────────────────────

/** GET /api/integrations/status — which providers have keys (no key values exposed) */
integrationsRoutes.get("/status", (c) => {
    const config = loadConfig();
    const status: Record<string, boolean> = {};
    for (const [provider, cfg] of Object.entries(config.providers)) {
        // A provider is considered configured if it has an apiKey.
        // The 'generic' provider is also considered configured with only a baseUrl (no key required).
        status[provider] = Boolean(cfg?.apiKey || (provider === "generic" && cfg?.baseUrl));
    }
    return c.json({ providers: status });
});

/** POST /api/integrations/keys — { provider, apiKey, baseUrl? } → saves to config */
integrationsRoutes.post("/keys", async (c) => {
    const body = await c.req.json<{ provider: string; apiKey: string; baseUrl?: string }>();
    const { provider, apiKey, baseUrl } = body;

    if (!provider || !apiKey) {
        return c.json({ error: "provider and apiKey are required" }, 400);
    }

    setApiKey(provider, apiKey, baseUrl);
    return c.json({ success: true });
});

/** DELETE /api/integrations/keys/:provider — removes provider from config */
integrationsRoutes.delete("/keys/:provider", (c) => {
    const provider = c.req.param("provider");
    removeProvider(provider);
    return c.json({ success: true });
});

export { integrationsRoutes };
