import { db } from "../db";
import {
  jobApplications,
  applicationEvents,
  ignoredEmails,
  classificationEnum,
  eventTypeEnum,
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
  classification: (typeof classificationEnum)[number];
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
// A status can never move to a lower rank via replay.
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

function isMoreAdvanced(
  candidate: (typeof applicationStatusEnum)[number],
  current: (typeof applicationStatusEnum)[number]
): boolean {
  // "rejected" and "withdrawn" are terminal — never overwrite them.
  if (current === "rejected" || current === "withdrawn") return false;
  return STATUS_RANK[candidate] > STATUS_RANK[current];
}

// ---------------------------------------------------------------------------
// Map a single classification + current status → next status.
// Always called as part of a chronological replay, never in isolation.
// ---------------------------------------------------------------------------
function classificationToNextStatus(
  classification: (typeof classificationEnum)[number],
  currentStatus: (typeof applicationStatusEnum)[number]
): (typeof applicationStatusEnum)[number] {
  switch (classification) {
    case "RECRUITMENT_ACK":
      // Only move to "acknowledged" if we haven't progressed further yet.
      return isMoreAdvanced("acknowledged", currentStatus) ? "acknowledged" : currentStatus;

    case "NEXT_STEP": {
      // Advance exactly one step from the current position.
      const progressionMap: Partial<Record<(typeof applicationStatusEnum)[number], (typeof applicationStatusEnum)[number]>> = {
        applied:      "screening",
        acknowledged: "screening",
        screening:    "interview",
        interview:    "technical",
        technical:    "offer",
      };
      const next = progressionMap[currentStatus];
      return next ?? currentStatus;
    }

    case "DISAPPROVAL":
      return isMoreAdvanced("rejected", currentStatus) ? "rejected" : currentStatus;

    default:
      return currentStatus;
  }
}

// ---------------------------------------------------------------------------
// Exported helper: replay all events for an application in chronological
// order and derive the correct current status from scratch.
// Safe to call after any mutation (insert, update, merge, diverge).
// ---------------------------------------------------------------------------
export function replayEventsToStatus(
  events: Array<{ classification: (typeof classificationEnum)[number]; date: string }>
): (typeof applicationStatusEnum)[number] {
  if (events.length === 0) return "applied";

  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let status: (typeof applicationStatusEnum)[number] = "applied";
  for (const event of sorted) {
    status = classificationToNextStatus(event.classification, status);
  }
  return status;
}

// ---------------------------------------------------------------------------
// Map classification → eventType (replaces the previous silent no-op).
// ---------------------------------------------------------------------------
export function classificationToEventType(
  classification: (typeof classificationEnum)[number]
): (typeof eventTypeEnum)[number] {
  switch (classification) {
    case "RECRUITMENT_ACK": return "recruitment_ack";
    case "NEXT_STEP":       return "next_step";
    case "DISAPPROVAL":     return "disapproval";
  }
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
async function findMatchingApplication(
  userId: string,
  threadId: string | undefined | null,
  company: string,
  position: string,
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
  const isUnknownCompany = !company || company === "Unknown Company";
  if (isUnknownCompany) return null;

  const allApplications = await db.query.jobApplications.findMany({
    where: eq(jobApplications.userId, userId),
  });

  const normalizedCompany  = normalizeText(company);
  const normalizedPosition = normalizeText(position);
  const isUnknownPosition  = !position || position === "Unknown Position";

  let bestMatch: (typeof allApplications)[number] | null = null;
  let bestScore = -1;

  for (const app of allApplications) {
    const appCompany  = normalizeText(app.company);
    const appPosition = normalizeText(app.position ?? "");

    const companySimilarity = diceSimilarity(appCompany, normalizedCompany);

    // Company must be at least fuzzy-similar to continue.
    if (companySimilarity < COMPANY_FUZZY_THRESHOLD) continue;

    const isAppPositionUnknown = !app.position || app.position === "Unknown Position";
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
async function eventExists(emailId: string): Promise<boolean> {
  const existing = await db.query.applicationEvents.findFirst({
    where: eq(applicationEvents.emailId, emailId),
  });
  return !!existing;
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
  input: ProcessEmailInput
): Promise<ProcessEmailResult> {
  try {
    console.log(`[PROCESS-EMAIL] Processing email ${input.emailId} for user ${userId}`);
    console.log(`[PROCESS-EMAIL] Company: ${input.company}, Position: ${input.position}`);

    // 1. Ignore-list check.
    if (await isEmailIgnored(userId, input.emailId)) {
      console.log(`[PROCESS-EMAIL] Email ${input.emailId} is ignored — skipping`);
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
    if (await eventExists(input.emailId)) {
      console.log(`[PROCESS-EMAIL] Event already exists for email ${input.emailId} — skipping`);
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
      input.company || "Unknown Company",
      input.position || "Unknown Position",
      input.jobId
    );

    console.log(`[PROCESS-EMAIL] Found matching application: ${application ? application.id : "NONE"}`);

    const isNewApplication = !application;

    if (!application) {
      console.log(`[PROCESS-EMAIL] Creating new application for ${input.position} at ${input.company}`);
      const [newApp] = await db
        .insert(jobApplications)
        .values({
          userId,
          company:       input.company  || "Unknown Company",
          position:      input.position || "Unknown Position",
          jobId:         input.jobId    || null,
          currentStatus: "applied",
          source:        "email",
        })
        .returning();

      application = newApp;
      console.log(`[PROCESS-EMAIL] Created new application: ${application.id}`);
    } else {
      console.log(`[PROCESS-EMAIL] Using existing application: ${application.id}`);
    }

    // 4. Insert the new event.
    await db.insert(applicationEvents).values({
      applicationId: application.id,
      eventType:     classificationToEventType(input.classification),
      classification: input.classification,
      emailId:       input.emailId,
      threadId:      input.threadId  || null,
      messageId:     input.messageId || null,
      subject:       input.subject,
      from:          input.from,
      to:            input.to,
      date:          input.date,
      confidence:    input.confidence || null,
      rawPayload:    input.rawPayload || (input as unknown as Record<string, unknown>),
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

    console.log(`[PROCESS-EMAIL] Status set to "${recalculatedStatus}" for application ${application.id}`);

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
    console.error("[PROCESS-EMAIL] Error processing recruitment email:", error);
    throw error;
  }
}