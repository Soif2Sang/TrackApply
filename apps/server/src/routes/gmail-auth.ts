import { Hono } from "hono";
import { google } from "googleapis";
import { db } from "../db";
import { user } from "../db/schema/auth";
import { eq } from "drizzle-orm";
import { startGmailWatch, stopGmailWatch } from "../services/gmail-service";

const gmailAuth = new Hono();

const gmailClientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const gmailRedirectUri = process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(
  gmailClientId,
  gmailClientSecret,
  gmailRedirectUri
);

// Debug log on startup
console.log("Gmail OAuth Configuration:");
console.log("  Client ID:", gmailClientId ? "✓ Set" : "✗ Missing");
console.log("  Client Secret:", gmailClientSecret ? "✓ Set" : "✗ Missing");
console.log("  Redirect URI:", gmailRedirectUri || "✗ Missing");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
];

// Get Gmail connection status
gmailAuth.get("/status", async (c) => {
  const userId = c.req.query("userId");

  if (!userId) {
    return c.json({ error: "Missing userId" }, 400);
  }

  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    connected: Boolean(userRecord.gmailConnected && userRecord.gmailRefreshToken),
    applicationSyncLastCompletedAt: userRecord.applicationSyncLastCompletedAt,
    applicationSyncHistoryEarliestDate: userRecord.applicationSyncHistoryEarliestDate,
  });
});

// Initiate Gmail OAuth flow
gmailAuth.get("/connect", async (c) => {
  const userId = c.req.query("userId");
  
  if (!userId) {
    return c.json({ error: "Missing userId" }, 400);
  }

  // Generate OAuth URL with user ID in state
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: userId, // Pass userId in state to retrieve after callback
    prompt: "consent", // Force consent to get refresh token
    redirect_uri: gmailRedirectUri, // Explicitly set redirect_uri
  });

  console.log(`📧 Gmail OAuth URL generated for user ${userId}`);
  console.log(`   Redirect URI: ${gmailRedirectUri}`);

  return c.redirect(authUrl);
});

// Handle OAuth callback
gmailAuth.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state"); // This is the userId
  const error = c.req.query("error");

  if (error) {
    console.error("OAuth error:", error);
    return c.redirect(`${process.env.CORS_ORIGIN}/?error=gmail_auth_failed`);
  }

  if (!code || !state) {
    return c.redirect(`${process.env.CORS_ORIGIN}/?error=missing_params`);
  }

  const userId = state;

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      console.error("No refresh token received");
      return c.redirect(`${process.env.CORS_ORIGIN}/?error=no_refresh_token`);
    }

    // Store tokens in database
    await db
      .update(user)
      .set({
        gmailRefreshToken: tokens.refresh_token,
        gmailAccessToken: tokens.access_token || null,
        gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        gmailConnected: true,
      })
      .where(eq(user.id, userId));

    console.log(`✅ Gmail connected successfully for user ${userId}`);
    
    // Start Gmail watch for push notifications
    try {
      await startGmailWatch(userId);
    } catch (watchError) {
      console.error(`⚠️ Failed to start Gmail watch for user ${userId}:`, watchError);
      // Don't fail the connection if watch fails, just log it
    }
    
    // Redirect back to app with success
    return c.redirect(`${process.env.CORS_ORIGIN}/?gmail_connected=true`);
  } catch (error) {
    console.error("Error exchanging OAuth code:", error);
    return c.redirect(`${process.env.CORS_ORIGIN}/?error=token_exchange_failed`);
  }
});

// Disconnect Gmail
gmailAuth.post("/disconnect", async (c) => {
  const userId = c.req.query("userId");
  
  if (!userId) {
    return c.json({ error: "Missing userId" }, 400);
  }

  try {
    // Stop Gmail watch first
    try {
      await stopGmailWatch(userId);
    } catch (stopError) {
      console.warn(`⚠️ Failed to stop Gmail watch for user ${userId}:`, stopError);
      // Continue with disconnect even if stop fails
    }

    // Remove tokens from database
    await db
      .update(user)
      .set({
        gmailRefreshToken: null,
        gmailAccessToken: null,
        gmailTokenExpiry: null,
        gmailConnected: false,
        gmailWatchExpiration: null,
        gmailWatchHistoryId: null,
      })
      .where(eq(user.id, userId));

    console.log(`✅ Gmail disconnected for user ${userId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Gmail:", error);
    return c.json({ error: "Failed to disconnect Gmail" }, 500);
  }
});

export default gmailAuth;
