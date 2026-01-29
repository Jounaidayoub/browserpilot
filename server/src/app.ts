import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware, type AppContext } from "./middleware/index.ts";
import { configureRoutes } from "./routes/index.ts";

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
  app.use("/api/*", authMiddleware); //protected routes

  configureRoutes(app);

  return app;
}
