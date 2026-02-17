import { Hono } from "hono";
import { db } from "../db";
import { user } from "../db/schema/auth";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth";
import {
  createUserGmailAuthUrl,
  disconnectGmail,
  exchangeCodeForUserTokens,
  getGmailConnectionStatus,
  upsertGmailProjectConfig,
} from "../services/gmail-service";

const gmailAuth = new Hono();

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
];

const redirectBase = process.env.CORS_ORIGIN || "";

async function getAuthenticatedUserId(c: any): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  return session?.user?.id ?? null;
}

// Get Gmail connection status
gmailAuth.get("/status", async (c) => {
  const userId = await getAuthenticatedUserId(c);

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  const status = await getGmailConnectionStatus(userId);
  return c.json(status || { error: "User not found" }, status ? 200 : 404);
});

gmailAuth.post("/configure", async (c) => {
  const userId = await getAuthenticatedUserId(c);

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const googleClientId = body?.googleClientId?.trim();
  const googleClientSecret = body?.googleClientSecret?.trim();

  if (!googleClientId || !googleClientSecret) {
    return c.json({ error: "Missing OAuth credentials" }, 400);
  }

  await upsertGmailProjectConfig(userId, {
    googleClientId,
    googleClientSecret,
  });

  const status = await getGmailConnectionStatus(userId);
  return c.json({ success: true, ...status });
});

// Initiate Gmail OAuth flow
gmailAuth.get("/connect", async (c) => {
  const userId = await getAuthenticatedUserId(c);
  
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const authUrl = await createUserGmailAuthUrl(userId, SCOPES);
    return c.redirect(authUrl);
  } catch {
    return c.redirect(`${redirectBase}/?error=missing_project_config`);
  }
});

// Handle OAuth callback
gmailAuth.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");
  const sessionUserId = await getAuthenticatedUserId(c);

  if (!sessionUserId) {
    return c.redirect(`${redirectBase}/?error=unauthorized`);
  }

  if (error) {
    console.error("OAuth error:", error);
    return c.redirect(`${redirectBase}/?error=gmail_auth_failed`);
  }

  if (!code || !state) {
    return c.redirect(`${redirectBase}/?error=missing_params`);
  }

  const userId = state;

  if (userId !== sessionUserId) {
    return c.redirect(`${redirectBase}/?error=invalid_state`);
  }

  try {
    await exchangeCodeForUserTokens(userId, code);

    console.log(`✅ Gmail connected successfully for user ${userId}`);

    // Redirect back to app with success
    return c.redirect(`${redirectBase}/?gmail_connected=true`);
  } catch (error) {
    console.error("Error exchanging OAuth code:", error);
    return c.redirect(`${redirectBase}/?error=token_exchange_failed`);
  }
});

// Disconnect Gmail
gmailAuth.post("/disconnect", async (c) => {
  const userId = await getAuthenticatedUserId(c);
  
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    await disconnectGmail(userId);

    console.log(`✅ Gmail disconnected for user ${userId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Gmail:", error);
    return c.json({ error: "Failed to disconnect Gmail" }, 500);
  }
});

export default gmailAuth;
