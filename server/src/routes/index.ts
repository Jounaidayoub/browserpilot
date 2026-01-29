import { Hono } from "hono";
import type { AppContext } from "../middleware/index.ts";
import { chatRoutes } from "./chat.ts";
import { authRoutes } from "./auth.ts";
import { integrationsRoutes } from "./integrations.ts";

/**
 * Configures all routes on the provided Hono app
 */
export function configureRoutes(app: Hono<AppContext>): void {
    app.route("/auth", authRoutes);
    app.route("/api/chat", chatRoutes);
    app.route("/api/integrations", integrationsRoutes);
}

export { chatRoutes, authRoutes, integrationsRoutes };
