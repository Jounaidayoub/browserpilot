import { betterAuth } from "better-auth";
import { getDb } from "./db.ts";

export const auth = betterAuth({
  basePath: "auth",
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ["chrome-extension://onlephlmhdpaaafgbicaieamdaadabln"],
  database: getDb(),
});
