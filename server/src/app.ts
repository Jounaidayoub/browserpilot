import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware, type AppContext } from "./middleware/index.ts";
import { authRoutes } from "./routes/auth.ts";
import { chatRoutes } from "./routes/chat.ts";

export type { AppContext };

/**
 * Creates and configures the Hono application
 * 
 * Route structure:
 * - /auth/* = public (login, signup, etc)
 * - /api/*  = private (requires auth)
 */
export function createApp(): Hono<AppContext> {
    const app = new Hono<AppContext>();

    // Global middleware
    app.use("*", logger());
    app.use("*", cors());
    app.use("/api/*", authMiddleware);//protected routes

    app.route("/auth", authRoutes);

    app.route("/api/chat", chatRoutes);

    return app;
}
