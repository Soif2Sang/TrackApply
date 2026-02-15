import { schedule } from "node-cron";
import { db } from "../db";
import { gmailConnection, user } from "../db/schema/auth";
import { eq } from "drizzle-orm";
import { listConnectedUserIds, listMessages, setPollCheckpoint } from "../services/gmail-service";
import { boss, JOB_NAMES } from "./pgboss";

export function startCronJobs() {
  console.log("🕐 Starting cron jobs...");

  // Poll all connected inboxes every 5 minutes
  schedule("*/5 * * * *", async () => {
    console.log("🔄 Starting 5-minute inbox polling...");
    
    try {
      const userIds = await listConnectedUserIds();
      console.log(`📧 Found ${userIds.length} connected Gmail account(s)`);

      for (const userId of userIds) {
        try {
          const userRecord = await db.query.user.findFirst({
            where: eq(user.id, userId),
          });

          const now = new Date();
          const since = userRecord?.lastPolledAt
            ? new Date(userRecord.lastPolledAt.getTime() - 2 * 60 * 1000)
            : new Date(now.getTime() - 10 * 60 * 1000);

          const result = await syncUserEmailsFromDate(userId, since);
          await setPollCheckpoint(userId, {
            lastPolledAt: now,
            lastPollStatus: `ok:${result.synced}`,
          });
        } catch (error) {
          console.error(`❌ Error polling user ${userId}:`, error);
          await setPollCheckpoint(userId, {
            lastPolledAt: new Date(),
            lastPollStatus: "error",
          });
        }
      }

      console.log("✅ 5-minute inbox polling completed");
    } catch (error) {
      console.error("❌ Error in inbox polling cron:", error);
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

  const connection = await db.query.gmailConnection.findFirst({
    where: eq(gmailConnection.userId, userId),
  });

  if (!userRecord || !connection?.gmailRefreshToken) {
    console.log(`⚠️ User ${userId} has not connected Gmail`);
    return { synced: 0 };
  }

  const query = `after:${Math.floor(fromDate.getTime() / 1000)}`;
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
