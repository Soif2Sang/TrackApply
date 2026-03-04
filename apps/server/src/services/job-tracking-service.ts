import { db } from "../db";
import type { Logger } from "../lib/logger";
import {
  jobApplications,
  applicationEvents,
  ignoredEmails,
  eventClassificationEnum,
  applicationStatusEnum,
} from "../db/schema/job-applications";
import { eq, and } from "drizzle-orm";

export interface ProcessEmailInput {
  emailId: string;
  threadId?: string;
  messageId?: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  snippet?: string;
  classification: (typeof eventClassificationEnum)[number];
  position?: string | null;
  company?: string | null;
  jobId?: string | null;
  confidence?: string;
  rawPayload?: Record<string, unknown>;
}

export interface ProcessEmailResult {
  success: boolean;
  applicationId: string;
  isNewApplication: boolean;
  status: string;
  skipped?: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Status ordering — higher index = more advanced in the hiring process.
// ---------------------------------------------------------------------------
const STATUS_RANK: Record<(typeof applicationStatusEnum)[number], number> = {
  applied:      0,
  acknowledged: 1,
  screening:    2,
  interview:    3,
  technical:    4,
  offer:        5,
  rejected:     6,
  withdrawn:    7,
};

// ---------------------------------------------------------------------------
// Exported helper: derive the application status from all its events by
// returning the single highest-ranked status seen across the event list.
// No sequential replay or positional guessing — the event classification IS
// the status, so we just take the MAX.
// ---------------------------------------------------------------------------
export function replayEventsToStatus(
  events: Array<{ classification: (typeof eventClassificationEnum)[number] }>
): (typeof applicationStatusEnum)[number] {
  if (events.length === 0) return "applied";

  let best: (typeof applicationStatusEnum)[number] = "applied";

  for (const event of events) {
    if (STATUS_RANK[event.classification] > STATUS_RANK[best]) {
      best = event.classification;
    }
  }

  return best;
}

// ---------------------------------------------------------------------------
// Text normalisation for fuzzy matching.
// ---------------------------------------------------------------------------
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

// Dice-coefficient similarity between two normalised strings (word-level).
// Returns a value in [0, 1].
function diceSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.split(" "));
  const tokensB = new Set(b.split(" "));
  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }
  return (2 * intersection) / (tokensA.size + tokensB.size);
}

// Thresholds — adjust if matching proves too loose / too strict in practice.
const COMPANY_EXACT_THRESHOLD  = 1.0;
const COMPANY_FUZZY_THRESHOLD  = 0.8;
const POSITION_FUZZY_THRESHOLD = 0.6;

// ---------------------------------------------------------------------------
// Application matching — priority order:
//   1. threadId  (most reliable Gmail signal)
//   2. jobId     (explicit reference number)
//   3. Exact company + position match
//   4. High-similarity fuzzy company + position match
// ---------------------------------------------------------------------------
export async function findMatchingApplication(
  userId: string,
  threadId?: string | null,
  company?: string | null,
  position?: string | null,
  jobId?: string | null
) {
  // Strategy 1: thread-based match — any event in the same Gmail thread
  // belongs to the same application by definition.
  if (threadId) {
    const eventInThread = await db.query.applicationEvents.findFirst({
      where: eq(applicationEvents.threadId, threadId),
      with: { application: true },
    });
    if (eventInThread?.application?.userId === userId) {
      return eventInThread.application;
    }
  }

  // Strategy 2: explicit job reference number.
  if (jobId) {
    const matchByJobId = await db.query.jobApplications.findFirst({
      where: and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.jobId, jobId)
      ),
    });
    if (matchByJobId) return matchByJobId;
  }

  // Strategies 3 & 4: text-based matching.
  // If we have a jobId but Strategy 2 found nothing, this is definitively a new
  // application — skip fuzzy matching entirely to avoid cross-contamination
  // (e.g. two Amazon positions with different jobIds but similar titles).
  if (jobId) return null;

  if (!company) return null;

  const allApplications = await db.query.jobApplications.findMany({
    where: eq(jobApplications.userId, userId),
  });

  const normalizedCompany  = normalizeText(company);
  const normalizedPosition = normalizeText(position ?? "");
  const isUnknownPosition  = !position;

  let bestMatch: (typeof allApplications)[number] | null = null;
  let bestScore = -1;

  for (const app of allApplications) {
    const appCompany  = normalizeText(app.company ?? "");
    const appPosition = normalizeText(app.position ?? "");

    const companySimilarity = diceSimilarity(appCompany, normalizedCompany);

    // Company must be at least fuzzy-similar to continue.
    if (companySimilarity < COMPANY_FUZZY_THRESHOLD) continue;

    const isAppPositionUnknown = !app.position;
    const positionSimilarity =
      isUnknownPosition || isAppPositionUnknown
        ? 1 // treat unknown on either side as a wildcard
        : diceSimilarity(appPosition, normalizedPosition);

    if (positionSimilarity < POSITION_FUZZY_THRESHOLD) continue;

    // Prefer exact company match; secondary sort by position similarity.
    const score =
      (companySimilarity >= COMPANY_EXACT_THRESHOLD ? 1 : 0) * 10 +
      companySimilarity +
      positionSimilarity;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = app;
    }
  }

  return bestMatch;
}

// ---------------------------------------------------------------------------
// Deduplication helpers.
// ---------------------------------------------------------------------------
async function eventExists(userId: string, emailId: string): Promise<boolean> {
  const existing = await db.query.applicationEvents.findFirst({
    where: eq(applicationEvents.emailId, emailId),
    with: { application: true },
  });
  // Only count as duplicate if the event belongs to the same user.
  return !!existing && existing.application?.userId === userId;
}

async function isEmailIgnored(userId: string, emailId: string): Promise<boolean> {
  const ignored = await db.query.ignoredEmails.findFirst({
    where: and(
      eq(ignoredEmails.userId, userId),
      eq(ignoredEmails.emailId, emailId)
    ),
  });
  return !!ignored;
}

// ---------------------------------------------------------------------------
// Main entry point.
// ---------------------------------------------------------------------------
export async function processRecruitmentEmail(
  userId: string,
  input: ProcessEmailInput,
  logger: Logger
): Promise<ProcessEmailResult> {
  const log = logger.scope("job-tracking");

  try {
    log.info(`start emailId=${input.emailId} userId=${userId} company="${input.company}" position="${input.position}"`);

    // 1. Ignore-list check.
    if (await isEmailIgnored(userId, input.emailId)) {
      log.info(`skip reason=ignored emailId=${input.emailId}`);
      return {
        success: true,
        applicationId: "",
        isNewApplication: false,
        status: "",
        skipped: true,
        message: `Email ${input.emailId} is in the ignore list — skipping`,
      };
    }

    // 2. Deduplication check — must happen before any insert.
    if (await eventExists(userId, input.emailId)) {
      log.info(`skip reason=duplicate emailId=${input.emailId}`);
      const existingEvent = await db.query.applicationEvents.findFirst({
        where: eq(applicationEvents.emailId, input.emailId),
        with: { application: true },
      });
      return {
        success: true,
        applicationId: existingEvent?.application?.id || "",
        isNewApplication: false,
        status: existingEvent?.application?.currentStatus || "",
        skipped: true,
        message: `Event already exists for ${input.position} at ${input.company} — skipping duplicate`,
      };
    }

    // 3. Find or create the matching application.
    let application = await findMatchingApplication(
      userId,
      input.threadId,
      input.company,
      input.position,
      input.jobId
    );

    log.info(`match applicationId=${application ? application.id : "none"}`);

    const isNewApplication = !application;

    if (!application) {
      log.info(`create-application company="${input.company}" position="${input.position}"`);
      const [newApp] = await db
        .insert(jobApplications)
        .values({
          userId,
          company:       input.company,
          position:      input.position,
          jobId:         input.jobId,
          currentStatus: "applied",
          source:        "email",
        })
        .returning();

      application = newApp;
      log.info(`created applicationId=${application.id}`);
    } else {
      log.info(`reuse applicationId=${application.id}`);
    }

    // 4. Insert the new event.
    await db.insert(applicationEvents).values({
      applicationId:  application.id,
      classification: input.classification,
      emailId:        input.emailId,
      threadId:       input.threadId  || null,
      messageId:      input.messageId || null,
      subject:        input.subject,
      from:           input.from,
      to:             input.to,
      date:           input.date,
      confidence:     input.confidence || null,
      rawPayload:     input.rawPayload || (input as unknown as Record<string, unknown>),
    });

    // 5. Replay all events (including the one just inserted) to derive status.
    const allEvents = await db.query.applicationEvents.findMany({
      where: eq(applicationEvents.applicationId, application.id),
    });

    const recalculatedStatus = replayEventsToStatus(allEvents);

    // 6. Persist the recalculated status.
    await db
      .update(jobApplications)
      .set({ currentStatus: recalculatedStatus, updatedAt: new Date() })
      .where(eq(jobApplications.id, application.id));

    log.info(`done applicationId=${application.id} status=${recalculatedStatus} isNew=${isNewApplication}`);

    return {
      success: true,
      applicationId: application.id,
      isNewApplication,
      status: recalculatedStatus,
      message: isNewApplication
        ? `Created new application for ${input.position} at ${input.company}`
        : `Updated existing application for ${input.position} at ${input.company}`,
    };
  } catch (error) {
    log.error(`error emailId=${input.emailId}`, error);
    throw error;
  }
}
