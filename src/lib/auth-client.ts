import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:8080/auth", // Auth routes are at /auth
});

export const { signIn, signUp, useSession, signOut } = authClient;
