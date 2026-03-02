import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { eq } from "drizzle-orm";
import * as authSchema from "../db/schema/auth";
import { gmailConnection } from "../db/schema/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...authSchema,
    },
  }),
  trustedOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : [],
  emailAndPassword: {
    enabled: false
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      disableSignUp: false,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  session: {
    updateAge: 60 * 60 * 24,
  },
  callbacks: {
    session: async ({ session, user: _userFromDb }: { session: any; user: any }) => {
      console.log("[AUTH] Session callback invoked for user:", session.user.id);
      const connection = await db.query.gmailConnection.findFirst({
        where: eq(gmailConnection.userId, session.user.id),
      });
      const gmailConnected = Boolean(connection?.gmailRefreshToken);
      console.log("[AUTH] DB user gmailConnected:", gmailConnected);
      return {
        ...session,
        user: {
          ...session.user,
          gmailConnected,
        },
      };
    },
  },
});

export type Session = typeof auth.$Infer;
