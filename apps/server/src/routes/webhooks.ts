import { Hono } from "hono";
import { boss, JOB_NAMES } from "../jobs/pgboss";
import { z } from "zod";

const webhooks = new Hono();

// Pub/Sub push notification schema
const pubsubMessageSchema = z.object({
  message: z.object({
    data: z.string(), // base64 encoded
    messageId: z.string(),
    publishTime: z.string(),
  }),
  subscription: z.string(),
});

// Decoded Gmail notification schema
const gmailNotificationSchema = z.object({
  emailAddress: z.string(),
  historyId: z.number(),
});

// GET endpoint for Pub/Sub verification
webhooks.get("/gmail", (c) => {
  // Pub/Sub verifies the endpoint exists before sending push notifications
  return c.text("OK");
});

// POST endpoint for Gmail push notifications
webhooks.post("/gmail", async (c) => {
  try {
    // Verify secret token (passed by Pub/Sub in query string or header)
    const queryToken = c.req.query("token");
    const headerToken = c.req.header("Authorization")?.replace("Bearer ", "");
    const token = queryToken || headerToken;
    
    if (token !== process.env.PUBSUB_VERIFICATION_TOKEN) {
      console.error("❌ Invalid webhook token");
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    
    // Validate Pub/Sub message structure
    const parsed = pubsubMessageSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Invalid Pub/Sub message format:", parsed.error);
      return c.json({ error: "Invalid message format" }, 400);
    }

    // Decode base64 message data
    const messageData = JSON.parse(
      Buffer.from(parsed.data.message.data, "base64").toString("utf-8")
    );

    // Validate Gmail notification
    const notification = gmailNotificationSchema.safeParse(messageData);
    if (!notification.success) {
      console.error("Invalid Gmail notification format:", notification.error);
      return c.json({ error: "Invalid notification format" }, 400);
    }

    const { emailAddress, historyId } = notification.data;

    console.log(`📧 Received Gmail notification for ${emailAddress}, historyId: ${historyId}`);

    // Extract user ID from email address
    // In a multi-user setup, you'd map emailAddress to userId
    // For now, we'll need to find the user by email
    const { db } = await import("../db");
    const { user } = await import("../db/schema/auth");
    const { eq } = await import("drizzle-orm");

    const userRecord = await db.query.user.findFirst({
      where: eq(user.email, emailAddress),
    });

    if (!userRecord) {
      console.error(`❌ User not found for email: ${emailAddress}`);
      return c.json({ error: "User not found" }, 404);
    }

    // Enqueue job to process the notification
    // Note: Gmail push only tells us there's new mail, not which messages
    // We'd need to use history.list to get the actual message IDs
    // For simplicity, we'll trigger a sync for this user
    const { syncUserEmails } = await import("../jobs/schedule");
    
    // Sync last 1 day of emails (recent activity)
    await syncUserEmails(userRecord.id, 1);

    return c.json({ 
      success: true, 
      message: "Notification processed",
      userId: userRecord.id,
    });
  } catch (error) {
    console.error("❌ Error processing Gmail webhook:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Optional: Endpoint to manually trigger email sync (for testing)
webhooks.post("/sync/:userId", async (c) => {
  const userId = c.req.param("userId");
  const days = parseInt(c.req.query("days") || "7");

  try {
    const { syncUserEmails } = await import("../jobs/schedule");
    const result = await syncUserEmails(userId, days);
    
    return c.json({
      success: true,
      synced: result.synced,
    });
  } catch (error) {
    console.error("❌ Error triggering sync:", error);
    return c.json({ error: "Failed to trigger sync" }, 500);
  }
});

export default webhooks;
