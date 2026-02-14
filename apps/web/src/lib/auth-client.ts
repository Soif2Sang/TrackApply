import { createAuthClient } from "better-auth/react";

declare module "better-auth/react" {
  interface Session {
    user: {
      gmailConnected: boolean;
    };
  }
}

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
});
