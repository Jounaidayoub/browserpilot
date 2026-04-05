import { Hono } from "hono";
import { chatRoutes } from "./chat.ts";
import { integrationsRoutes } from "./integrations.ts";

/**
 * Configures all routes on the provided Hono app
 */
export function configureRoutes(app: Hono): void {
    //health check
    app.get("/api/health", (c) => c.json({ status: "ok" }));
    app.route("/api/chat", chatRoutes);
    app.route("/api/integrations", integrationsRoutes);
}

export { chatRoutes, integrationsRoutes };
