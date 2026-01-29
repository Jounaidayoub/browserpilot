import { Hono } from "hono";
import { auth } from "../lib/auth";

const authRoutes = new Hono();

/**
 * Auth routes - handled by better-auth
 * Supports both GET and POST methods for various auth operations
 */
authRoutes.on(["POST", "GET"], "/*", (c) => auth.handler(c.req.raw));

export { authRoutes };
