import type { MiddlewareHandler } from "hono";
import { auth } from "../lib/auth.ts";

/**
 * App context with authenticated session variables
 */
export type AppContext = {
    Variables: {
        user: typeof auth.$Infer.Session.user;
        session: typeof auth.$Infer.Session.session;
    };
};

/**
 * Auth middleware - extracts session and rejects if not authenticated
 * Returns 401 Unauthorized if no valid session is found
 */
export const authMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", session.user);
    c.set("session", session.session);
    await next();
};
