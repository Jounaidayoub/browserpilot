import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

console.log(` Server starting on port ${env.PORT}`);


serve({ fetch: app.fetch, port: env.PORT });
