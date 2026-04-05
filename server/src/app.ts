import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { configureRoutes } from "./routes/index.ts";

/**
 * Creates and configures the Hono application
 *
 * Route structure:
 * - /api/*  = public
 */
export function createApp(): Hono {
  const app = new Hono();

  // Global middleware
  app.use("*", logger());
  app.use("*", cors());

  configureRoutes(app);

  return app;
}
