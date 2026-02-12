import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as authSchema from "../db/schema/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...authSchema,
    },
  }),
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
  emailAndPassword: {
    enabled: true,
    // To enable password reset, implement sendResetPassword with your email service
    // sendResetPassword: async ({ user, url, token }, request) => {
    //   // Send email with reset link to user.email
    //   // The url contains the reset token
    //   console.log("Password reset requested for", user.email, "- URL:", url);
    // },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
