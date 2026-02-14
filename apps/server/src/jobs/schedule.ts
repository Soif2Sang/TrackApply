import { schedule } from "node-cron";
import { db } from "../db";
import { user } from "../db/schema/auth";
import { eq, lt } from "drizzle-orm";
import { listMessages, startGmailWatch } from "../services/gmail-service";
import { boss, JOB_NAMES } from "./pgboss";

// Cron job to sync old emails for all users with Gmail connected
// Runs every day at 2:00 AM
export function startCronJobs() {
  console.log("🕐 Starting cron jobs...");

  // Daily sync of recent emails
  schedule("0 2 * * *", async () => {
    console.log("🔄 Starting daily email sync...");
    
    try {
      // Get all users with Gmail connected
      const users = await db.query.user.findMany({
        where: eq(user.gmailConnected, true),
      });

      console.log(`📧 Found ${users.length} users with Gmail connected`);

      for (const u of users) {
        try {
          await syncUserEmails(u.id);
        } catch (error) {
          console.error(`❌ Error syncing emails for user ${u.id}:`, error);
          // Continue with next user
        }
      }

      console.log("✅ Daily email sync completed");
    } catch (error) {
      console.error("❌ Error in daily sync cron:", error);
    }
  });

  // Daily watch renewal - renew watches expiring within next 24 hours
  schedule("0 3 * * *", async () => {
    console.log("🔄 Starting Gmail watch renewal...");
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get all users with Gmail connected and watch expiring soon
      const users = await db.query.user.findMany({
        where: eq(user.gmailConnected, true),
      });

      const usersToRenew = users.filter(u => {
        if (!u.gmailWatchExpiration) return true; // No watch, need to create one
        return u.gmailWatchExpiration < tomorrow; // Expires within 24h
      });

      console.log(`📧 Found ${usersToRenew.length} users needing watch renewal`);

      for (const u of usersToRenew) {
        try {
          await startGmailWatch(u.id);
          console.log(`✅ Renewed Gmail watch for user ${u.id}`);
        } catch (error) {
          console.error(`❌ Error renewing watch for user ${u.id}:`, error);
          // Continue with next user
        }
      }

      console.log("✅ Gmail watch renewal completed");
    } catch (error) {
      console.error("❌ Error in watch renewal cron:", error);
    }
  });

  console.log("✅ Cron jobs started");
}

// Sync emails for a specific user from a specific date
export async function syncUserEmailsFromDate(userId: string, fromDate: Date) {
  console.log(`📧 Syncing emails for user ${userId} from ${fromDate.toISOString().split("T")[0]}`);

  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord?.gmailConnected) {
    console.log(`⚠️ User ${userId} has not connected Gmail`);
    return { synced: 0 };
  }

  const query = `after:${fromDate.toISOString().split("T")[0]}`;
  const pageSize = parseInt(process.env.EMAIL_SYNC_PAGE_SIZE || "100", 10);
  const maxTotal = parseInt(process.env.EMAIL_SYNC_MAX_TOTAL || "0", 10);

  try {
    let nextPageToken: string | undefined = undefined;
    let page = 0;
    let queued = 0;

    // Mark sync as started
    await db
      .update(user)
      .set({ 
        applicationSyncLastStartedAt: new Date(),
      })
      .where(eq(user.id, userId));

    do {
      const messages = await listMessages(userId, query, {
        pageToken: nextPageToken,
        maxResults: pageSize,
      });
      const messageList = messages.data.messages || [];
      page++;

      console.log(`📨 Page ${page}: found ${messageList.length} messages for user ${userId}`);

      for (const msg of messageList) {
        if (!msg.id) continue;

        await boss.send(JOB_NAMES.PROCESS_EMAIL, {
          userId,
          emailId: msg.id,
        });
        queued++;

        if (maxTotal > 0 && queued >= maxTotal) {
          console.log(`⚠️ Reached EMAIL_SYNC_MAX_TOTAL=${maxTotal}, stopping pagination`);
          nextPageToken = undefined;
          break;
        }
      }

      if (maxTotal > 0 && queued >= maxTotal) {
        break;
      }

      nextPageToken = messages.data.nextPageToken || undefined;
    } while (nextPageToken);

    // Update sync timestamps and total count
    const now = new Date();
    const earliestDate = userRecord.applicationSyncHistoryEarliestDate 
      ? (fromDate < userRecord.applicationSyncHistoryEarliestDate ? fromDate : userRecord.applicationSyncHistoryEarliestDate)
      : fromDate;
    
    await db
      .update(user)
      .set({ 
        applicationSyncLastCompletedAt: now,
        applicationSyncHistoryEarliestDate: earliestDate,
      })
      .where(eq(user.id, userId));

    console.log(`✅ Queued ${queued} emails for processing across ${page} page(s)`);
    return { synced: queued };
  } catch (error) {
    console.error(`❌ Error listing messages for user ${userId}:`, error);
    throw error;
  }
}

// Sync emails for a specific user (backward compatibility)
export async function syncUserEmails(userId: string, daysBack: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  return syncUserEmailsFromDate(userId, since);
}

// Manual sync endpoint with date support
export async function triggerManualSync(userId: string, fromDate?: Date) {
  if (fromDate) {
    return syncUserEmailsFromDate(userId, fromDate);
  }
  return syncUserEmails(userId);
}
