import { Hono } from "hono";
import type { AppContext } from "../middleware/index.ts";
import { chatRoutes } from "./chat.ts";
import { authRoutes } from "./auth.ts";

/**
 * Configures all routes on the provided Hono app
 */
export function configureRoutes(app: Hono<AppContext>): void {
    app.route("/api/auth", authRoutes);
    app.route("/chat", chatRoutes);
}

export { chatRoutes, authRoutes };
