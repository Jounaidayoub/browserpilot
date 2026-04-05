import { Hono } from "hono";
import { env } from "../config/env.ts";
import {
    createOAuthFlow,
    getLatestOAuthFlow,
    getOAuthFlow,
    getProviderKey,
    updateOAuthFlowStatus,
    upsertProviderKey,
    dbNow,
} from "../lib/integrations.ts";

interface OpenRouterKeyResponse {
    key?: string;
    error?: string;
}

const integrationsRoutes = new Hono();

integrationsRoutes.get("/openrouter/start", async (c) => {
    const flow = await createOAuthFlow("openrouter");
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

    const flow = await getOAuthFlow(state);
    if (!flow || flow.provider !== "openrouter") {
        return c.text("Invalid flow", 400);
    }

    if (flow.status !== "pending") {
        return c.text("Flow already completed", 400);
    }

    if (flow.expiresAt < dbNow()) {
        await updateOAuthFlowStatus(flow.state, "error", "Flow expired");
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
            await updateOAuthFlowStatus(flow.state, "error", errorText.slice(0, 500));
            return c.text("OpenRouter exchange failed", 400);
        }

        const data = (await response.json()) as OpenRouterKeyResponse;
        if (!data.key) {
            await updateOAuthFlowStatus(flow.state, "error", data.error ?? "Missing key");
            return c.text("OpenRouter exchange failed", 400);
        }

        await upsertProviderKey("openrouter", data.key);
        await updateOAuthFlowStatus(flow.state, "completed", null);

        return c.html(
            "<html><body><p>OpenRouter connected. You can close this tab.</p></body></html>"
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        await updateOAuthFlowStatus(flow.state, "error", message);
        return c.text("OpenRouter exchange failed", 400);
    }
});

integrationsRoutes.get("/openrouter/status", async (c) => {
    const keyRow = await getProviderKey("openrouter");
    
    const latestFlow = await getLatestOAuthFlow("openrouter");

    return c.json({
        connected: Boolean(keyRow),
        status: latestFlow?.status,
        error: latestFlow?.error ?? undefined,
    });
});

export { integrationsRoutes };
