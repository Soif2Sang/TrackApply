import { z } from "zod";
import { db } from "../db";
import {
  jobApplications,
  applicationEvents,
  apiKeys,
  classificationEnum,
  eventTypeEnum,
  applicationStatusEnum,
} from "../db/schema/job-applications";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { t } from "../lib/trpc";
import crypto from "crypto";

// Validation schema for n8n webhook payload
const n8nWebhookPayload = z.object({
  // Email metadata
  email_id: z.string(),
  thread_id: z.string().optional(),
  message_id: z.string().optional(),
  subject: z.string(),
  from: z.string(),
  to: z.string(),
  date: z.string(),
  snippet: z.string().optional(),

  // Classification results from Gemini/n8n
  classification: z.enum(classificationEnum),
  position: z.string(),
  company: z.string(),
  job_id: z.string().optional(),
  confidence: z.string().optional(),

  // Timestamp
  processed_at: z.string(),
});

// API Key authentication middleware
const apiKeyProcedure = t.procedure.use(async ({ ctx, next }) => {
  const authHeader = ctx.req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing or invalid API key",
    });
  }

  const apiKey = authHeader.slice(7); // Remove "Bearer "
  
  // Hash the provided key to compare
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

  // Find active API key
  const keyRecord = await db.query.apiKeys.findFirst({
    where: and(
      eq(apiKeys.keyHash, keyHash),
      eq(apiKeys.isActive, true),
      sql`${apiKeys.expiresAt} IS NULL OR ${apiKeys.expiresAt} > NOW()`
    ),
    with: {
      user: true,
    },
  });

  if (!keyRecord) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired API key",
    });
  }

  // Update last used timestamp
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyRecord.id));

  return next({
    ctx: {
      ...ctx,
      apiKey: keyRecord,
      user: keyRecord.user,
    },
  });
});

// Map classification to application status based on current status
function determineNewStatus(
  classification: (typeof classificationEnum)[number],
  currentStatus?: (typeof applicationStatusEnum)[number]
): (typeof applicationStatusEnum)[number] {
  switch (classification) {
    case "RECRUITMENT_ACK":
      // Acknowledgment means we've applied
      return "acknowledged";

    case "NEXT_STEP":
      // Progress through stages
      if (currentStatus === "applied" || currentStatus === "acknowledged") {
        return "screening";
      } else if (currentStatus === "screening") {
        return "interview";
      } else if (currentStatus === "interview") {
        return "technical";
      } else if (currentStatus === "technical") {
        return "offer";
      }
      // Default progression if unknown
      return "screening";

    case "DISAPPROVAL":
      return "rejected";

    default:
      return currentStatus || "applied";
  }
}

// Normalize company and position for fuzzy matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // Remove special characters
    .replace(/\s+/g, " "); // Normalize whitespace
}

// Find matching application using intelligent logic
async function findMatchingApplication(
  userId: string,
  company: string,
  position: string,
  jobId?: string
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
  const allApplications = await db.query.jobApplications.findMany({
    where: eq(jobApplications.userId, userId),
  });

  for (const app of allApplications) {
    const appCompany = normalizeText(app.company);
    const appPosition = normalizeText(app.position);

    // Check for company match (exact or very similar)
    const companyMatch = 
      appCompany === normalizedCompany ||
      appCompany.includes(normalizedCompany) ||
      normalizedCompany.includes(appCompany);

    // Check for position match
    const positionMatch =
      appPosition === normalizedPosition ||
      appPosition.includes(normalizedPosition) ||
      normalizedPosition.includes(appPosition);

    if (companyMatch && positionMatch) {
      return app;
    }
  }

  return null;
}

export const jobTrackingRouter = t.router({
  // Webhook endpoint for n8n
  receiveEmail: apiKeyProcedure
    .input(n8nWebhookPayload)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      try {
        // Find existing application or create new one
        let application = await findMatchingApplication(
          userId,
          input.company,
          input.position,
          input.job_id
        );

        const isNewApplication = !application;

        if (!application) {
          // Create new application
          const [newApp] = await db
            .insert(jobApplications)
            .values({
              userId,
              company: input.company,
              position: input.position,
              jobId: input.job_id || null,
              currentStatus: determineNewStatus(input.classification),
              source: "email",
            })
            .returning();

          application = newApp;
        } else {
          // Update existing application status
          const newStatus = determineNewStatus(
            input.classification,
            application.currentStatus
          );

          await db
            .update(jobApplications)
            .set({
              currentStatus: newStatus,
              updatedAt: new Date(),
            })
            .where(eq(jobApplications.id, application.id));
        }

        // Create event record
        const eventType = input.classification.toLowerCase().replace("_", "_") as (typeof eventTypeEnum)[number];

        await db.insert(applicationEvents).values({
          applicationId: application.id,
          eventType,
          classification: input.classification,
          emailId: input.email_id,
          threadId: input.thread_id || null,
          messageId: input.message_id || null,
          subject: input.subject,
          from: input.from,
          to: input.to,
          date: input.date,
          snippet: input.snippet || null,
          confidence: input.confidence || null,
          rawPayload: input as unknown as Record<string, unknown>,
        });

        return {
          success: true,
          applicationId: application.id,
          isNewApplication,
          status: application.currentStatus,
          message: isNewApplication
            ? `Created new application for ${input.position} at ${input.company}`
            : `Updated existing application for ${input.position} at ${input.company}`,
        };
      } catch (error) {
        console.error("Error processing email webhook:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process email",
          cause: error,
        });
      }
    }),

  // Create a new API key
  createApiKey: t.procedure
    .use(({ ctx, next }) => {
      // Require session authentication
      if (!ctx.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }
      return next({ ctx });
    })
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session!.user.id;

      // Generate a secure random API key
      const apiKey = crypto.randomBytes(32).toString("hex");
      const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
      const keyPrefix = apiKey.slice(0, 8);

      await db.insert(apiKeys).values({
        name: input.name,
        keyHash,
        keyPrefix,
        userId,
      });

      // Return the full key (only shown once!)
      return {
        apiKey,
        prefix: keyPrefix,
        message: "Store this API key securely - it will not be shown again!",
      };
    }),

  // List user's API keys
  listApiKeys: t.procedure
    .use(({ ctx, next }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }
      return next({ ctx });
    })
    .query(async ({ ctx }) => {
      const userId = ctx.session!.user.id;

      const keys = await db.query.apiKeys.findMany({
        where: eq(apiKeys.userId, userId),
        orderBy: (keys, { desc }) => [desc(keys.createdAt)],
      });

      return keys.map((key) => ({
        id: key.id,
        name: key.name,
        prefix: key.keyPrefix,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
      }));
    }),

  // Revoke an API key
  revokeApiKey: t.procedure
    .use(({ ctx, next }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }
      return next({ ctx });
    })
    .input(z.object({ keyId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session!.user.id;

      const key = await db.query.apiKeys.findFirst({
        where: and(eq(apiKeys.id, input.keyId), eq(apiKeys.userId, userId)),
      });

      if (!key) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      await db
        .update(apiKeys)
        .set({ isActive: false })
        .where(eq(apiKeys.id, input.keyId));

      return { success: true };
    }),

  // Get all applications for the current user
  getApplications: t.procedure
    .use(({ ctx, next }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }
      return next({ ctx });
    })
    .query(async ({ ctx }) => {
      const userId = ctx.session!.user.id;

      const applications = await db.query.jobApplications.findMany({
        where: eq(jobApplications.userId, userId),
        orderBy: (apps, { desc }) => [desc(apps.updatedAt)],
        with: {
          events: {
            orderBy: (events, { desc }) => [desc(events.createdAt)],
            limit: 1,
          },
        },
      });

      return applications.map((app) => ({
        id: app.id,
        company: app.company,
        position: app.position,
        jobId: app.jobId,
        currentStatus: app.currentStatus,
        source: app.source,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        latestEvent: app.events[0] || null,
      }));
    }),

  // Get a single application with all events
  getApplicationById: t.procedure
    .use(({ ctx, next }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }
      return next({ ctx });
    })
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session!.user.id;

      const application = await db.query.jobApplications.findFirst({
        where: and(
          eq(jobApplications.id, input.id),
          eq(jobApplications.userId, userId)
        ),
        with: {
          events: {
            orderBy: (events, { desc }) => [desc(events.createdAt)],
          },
          notes: {
            orderBy: (notes, { desc }) => [desc(notes.createdAt)],
          },
        },
      });

      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      return application;
    }),
});

export type JobTrackingRouter = typeof jobTrackingRouter;
