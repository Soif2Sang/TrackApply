import { db } from "../db";
import {
  jobApplications,
  applicationEvents,
  classificationEnum,
  eventTypeEnum,
  applicationStatusEnum,
} from "../db/schema/job-applications";
import { eq, and, sql } from "drizzle-orm";

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

// Normalize company and position for fuzzy matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

// Find matching application using intelligent logic
async function findMatchingApplication(
  userId: string,
  company: string,
  position: string,
  jobId?: string | null
) {
  const normalizedCompany = normalizeText(company);
  const normalizedPosition = normalizeText(position);

  // Strategy 1: Exact match by job_id if provided
  if (jobId) {
    const matchByJobId = await db.query.jobApplications.findFirst({
      where: and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.jobId, jobId)
      ),
    });
    if (matchByJobId) return matchByJobId;
  }

  // Strategy 2: Match by exact company + position (normalized)
  const isUnknownCompany = !company || company === "Unknown Company";
  if (!isUnknownCompany) {
    const allApplications = await db.query.jobApplications.findMany({
      where: eq(jobApplications.userId, userId),
    });

    for (const app of allApplications) {
      const appCompany = normalizeText(app.company);
      const appPosition = app.position ? normalizeText(app.position) : "";

      const companyMatch =
        appCompany === normalizedCompany ||
        appCompany.includes(normalizedCompany) ||
        normalizedCompany.includes(appCompany);

      const isUnknownPosition = !position || position === "Unknown Position";
      const isAppPositionUnknown = !app.position || app.position === "Unknown Position";
      const positionMatch =
        isUnknownPosition ||
        isAppPositionUnknown ||
        appPosition === normalizedPosition ||
        appPosition.includes(normalizedPosition) ||
        normalizedPosition.includes(appPosition);

      if (companyMatch && positionMatch) {
        return app;
      }
    }
  }

  return null;
}

// Map classification to application status based on current status
function determineNewStatus(
  classification: (typeof classificationEnum)[number],
  currentStatus?: (typeof applicationStatusEnum)[number]
): (typeof applicationStatusEnum)[number] {
  switch (classification) {
    case "RECRUITMENT_ACK":
      return "acknowledged";

    case "NEXT_STEP":
      if (currentStatus === "applied" || currentStatus === "acknowledged") {
        return "screening";
      } else if (currentStatus === "screening") {
        return "interview";
      } else if (currentStatus === "interview") {
        return "technical";
      } else if (currentStatus === "technical") {
        return "offer";
      }
      return "screening";

    case "DISAPPROVAL":
      return "rejected";

    default:
      return currentStatus || "applied";
  }
}

// Recalculate status based on most recent event by email date
async function recalculateStatusFromEvents(
  applicationId: string
): Promise<(typeof applicationStatusEnum)[number]> {
  const events = await db.query.applicationEvents.findMany({
    where: eq(applicationEvents.applicationId, applicationId),
    orderBy: (events, { desc }) => [desc(events.date)],
  });

  if (events.length === 0) {
    return "applied";
  }

  const mostRecentEvent = events[0];
  return determineNewStatus(mostRecentEvent.classification);
}

// Check if event already exists (deduplication)
async function eventExists(emailId: string): Promise<boolean> {
  const existingEvent = await db.query.applicationEvents.findFirst({
    where: eq(applicationEvents.emailId, emailId),
  });
  return !!existingEvent;
}

// Main function to process recruitment email
export async function processRecruitmentEmail(
  userId: string,
  input: ProcessEmailInput
): Promise<ProcessEmailResult> {
  try {
    // Find existing application or prepare to create new one
    let application = await findMatchingApplication(
      userId,
      input.company || "Unknown Company",
      input.position || "Unknown Position",
      input.jobId
    );

    const isNewApplication = !application;

    if (!application) {
      // Create new application
      const [newApp] = await db
        .insert(jobApplications)
        .values({
          userId,
          company: input.company || "Unknown Company",
          position: input.position || "Unknown Position",
          jobId: input.jobId || null,
          currentStatus: "applied",
          source: "email",
        })
        .returning();

      application = newApp;
    }

    // Check if event already exists (deduplication)
    if (await eventExists(input.emailId)) {
      return {
        success: true,
        applicationId: application.id,
        isNewApplication,
        status: application.currentStatus,
        skipped: true,
        message: `Event already exists for ${input.position} at ${input.company} - skipping duplicate`,
      };
    }

    // Create event record
    const eventType = input.classification.toLowerCase().replace("_", "_") as (typeof eventTypeEnum)[number];

    await db.insert(applicationEvents).values({
      applicationId: application.id,
      eventType,
      classification: input.classification,
      emailId: input.emailId,
      threadId: input.threadId || null,
      messageId: input.messageId || null,
      subject: input.subject,
      from: input.from,
      to: input.to,
      date: input.date,
      confidence: input.confidence || null,
      rawPayload: input.rawPayload || (input as unknown as Record<string, unknown>),
    });

    // Recalculate status based on the most recent email date
    const recalculatedStatus = await recalculateStatusFromEvents(application.id);

    // Update application status
    await db
      .update(jobApplications)
      .set({
        currentStatus: recalculatedStatus,
        updatedAt: new Date(),
      })
      .where(eq(jobApplications.id, application.id));

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
    console.error("Error processing recruitment email:", error);
    throw error;
  }
}
