import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.ts";

export const auth = betterAuth({
  basePath: "auth",
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ["chrome-extension://jlgmohohkncehnolhjmhipkiljihbnbf"],
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
});
