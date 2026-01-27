import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:8080", // Adjust if your server runs elsewhere
});

export const { signIn, signUp, useSession, signOut } = authClient;
