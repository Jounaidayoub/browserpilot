import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  basePath: "auth",
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ["chrome-extension://onlephlmhdpaaafgbicaieamdaadabln"],
  database: new Database("./sqlite.db"),
});
