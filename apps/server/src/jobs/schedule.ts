import { schedule } from "node-cron";
import { db } from "../db";
import { gmailConnection, user } from "../db/schema/auth";
import { eq } from "drizzle-orm";
import { listConnectedUserIds, listMessages, setPollCheckpoint } from "../services/gmail-service";
import { boss, JOB_NAMES } from "./pgboss";

export function startCronJobs() {
  console.log("[scheduler] starting cron jobs");

  // Poll all connected inboxes every 5 minutes
  schedule("*/5 * * * *", async () => {
    console.log("[scheduler] poll start");
    
    try {
      const userIds = await listConnectedUserIds();
      console.log(`[scheduler] poll connectedUsers=${userIds.length}`);

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
          console.log(`[scheduler] poll done userId=${userId} synced=${result.synced}`);
          await setPollCheckpoint(userId, {
            lastPolledAt: now,
            lastPollStatus: `ok:${result.synced}`,
          });
        } catch (error) {
          console.error(`[scheduler] poll error userId=${userId}`, error);
          await setPollCheckpoint(userId, {
            lastPolledAt: new Date(),
            lastPollStatus: "error",
          });
        }
      }

      console.log("[scheduler] poll complete");
    } catch (error) {
      console.error("[scheduler] poll fatal error", error);
    }
  });

  console.log("[scheduler] cron jobs started");
}

// Sync emails for a specific user from a specific date
export async function syncUserEmailsFromDate(userId: string, fromDate: Date) {
  console.log(`[sync] start userId=${userId} fromDate=${fromDate.toISOString().split("T")[0]}`);

  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  const connection = await db.query.gmailConnection.findFirst({
    where: eq(gmailConnection.userId, userId),
  });

  if (!userRecord || !connection?.gmailRefreshToken) {
    console.log(`[sync] skip reason=no_gmail_connection userId=${userId}`);
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

    // Collect all message IDs across all pages first
    const allMessageIds: string[] = [];

    do {
      const messages = await listMessages(userId, query, {
        pageToken: nextPageToken,
        maxResults: pageSize,
      });
      const messageList = messages.data.messages || [];
      page++;

      console.log(`[sync] page=${page} found=${messageList.length} userId=${userId}`);

      for (const msg of messageList) {
        if (!msg.id) continue;
        allMessageIds.push(msg.id);

        if (maxTotal > 0 && allMessageIds.length >= maxTotal) {
          console.log(`[sync] max total reached maxTotal=${maxTotal} stopping pagination`);
          nextPageToken = undefined;
          break;
        }
      }

      if (maxTotal > 0 && allMessageIds.length >= maxTotal) {
        break;
      }

      nextPageToken = messages.data.nextPageToken || undefined;
    } while (nextPageToken);

    // Gmail IDs are monotonically increasing integers — sort ascending to process oldest first
    allMessageIds.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    console.log(`[sync] enqueue count=${allMessageIds.length} pages=${page} order=oldest-first userId=${userId}`);

    for (const emailId of allMessageIds) {
      await boss.send(JOB_NAMES.PROCESS_EMAIL, {
        userId,
        emailId,
      });
      queued++;
    }

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

    console.log(`[sync] done queued=${queued} pages=${page} userId=${userId}`);
    return { synced: queued };
  } catch (error) {
    console.error(`[sync] error userId=${userId}`, error);
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