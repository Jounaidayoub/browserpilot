import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ["chrome-extension://onlephlmhdpaaafgbicaieamdaadabln"],
  database: new Database("./sqlite.db"),
});
    