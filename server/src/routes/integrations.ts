import { Hono } from "hono";
import type { AppContext } from "../middleware/index.ts";
import { env } from "../config/env.ts";
import {
    createOAuthFlow,
    getLatestOAuthFlowForUser,
    getOAuthFlow,
    getUserProviderKey,
    updateOAuthFlowStatus,
    upsertUserProviderKey,
} from "../lib/integrations.ts";

interface OpenRouterKeyResponse {
    key?: string;
    error?: string;
}

const integrationsRoutes = new Hono<AppContext>();

integrationsRoutes.get("/openrouter/start", async (c) => {
    const user = c.get("user");
    const flow = createOAuthFlow(user.id, "openrouter");
    const callbackUrl = `${env.BETTER_AUTH_URL}/api/integrations/openrouter/callback?state=${flow.state}`;
    const redirectUrl = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(callbackUrl)}`;

    return c.redirect(redirectUrl, 302);
});

integrationsRoutes.get("/openrouter/callback", async (c) => {
    const user = c.get("user");
    const state = c.req.query("state");
    const code = c.req.query("code");

    if (!state) {
        return c.text("Invalid flow: missing state", 400);
    }

    if (!code) {
        return c.text("Missing code", 400);
    }

    const flow = getOAuthFlow(state);
    if (!flow || flow.userId !== user.id || flow.provider !== "openrouter") {
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
            headers: {
                "Content-Type": "application/json",
            },
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

        upsertUserProviderKey(user.id, "openrouter", data.key);
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
    const user = c.get("user");
    const keyRow = getUserProviderKey(user.id, "openrouter");
    const latestFlow = getLatestOAuthFlowForUser(user.id, "openrouter");

    return c.json({
        connected: Boolean(keyRow),
        status: latestFlow?.status,
        error: latestFlow?.error ?? undefined,
    });
});

export { integrationsRoutes };
