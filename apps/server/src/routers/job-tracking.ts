import { z } from "zod";
import { db } from "../db";
import {
  jobApplications,
  applicationEvents,
  applicationNotes,
  ignoredEmails,
  applicationStatusEnum,
  eventClassificationEnum,
} from "../db/schema/job-applications";
import { user } from "../db/schema/auth";
import { eq, and, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { t } from "../lib/trpc";
import { triggerManualSync } from "../jobs/schedule";
import { PG_BOSS_SCHEMA } from "../jobs/pgboss";
import { replayEventsToStatus } from "../services/job-tracking-service";

// Require authentication middleware
const requireAuth = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({ ctx });
});

export const jobTrackingRouter = t.router({
  getAnalyzeQueueStats: requireAuth.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id;

    // Get user sync metadata
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const syncStartedAt = userRecord.applicationSyncLastStartedAt;

    // Count jobs created during the current sync session
    // If no sync has started yet, count all jobs
    let result;
    try {
      result = await db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE state IN ('created', 'retry'))::int AS pending,
          COUNT(*) FILTER (WHERE state = 'active')::int AS active,
          COUNT(*) FILTER (WHERE state = 'completed')::int AS completed,
          COUNT(*) FILTER (WHERE state = 'failed')::int AS failed
        FROM pgboss.job
        WHERE name = 'process-email'
          AND data->>'userId' = ${userId}
          ${syncStartedAt ? sql`AND created_on >= ${syncStartedAt}` : sql``}
      `);
    } catch (error) {
      console.log("Error fetching job stats:", error);

      const errorCode = (error as { code?: string })?.code;
      if (errorCode === "42P01") {
        return {
          total: 0,
          completed: 0,
          failed: 0,
          processed: 0,
          pending: 0,
          active: 0,
          remaining: 0,
          syncStartedAt: syncStartedAt?.toISOString() || null,
        };
      }

      throw error;
    }

    const row = result.rows[0] as
      | { pending?: number; active?: number; completed?: number; failed?: number }
      | undefined;

    const pending = Number(row?.pending || 0);
    const active = Number(row?.active || 0);
    const completed = Number(row?.completed || 0);
    const failed = Number(row?.failed || 0);
    const processed = completed + failed;
    const remaining = pending + active;
    const total = pending + active + completed + failed;

    return {
      total,
      completed,
      failed,
      processed,
      pending,
      active,
      remaining,
      syncStartedAt: syncStartedAt?.toISOString() || null,
    };
  }),

  // Get all applications for the current user
  getApplications: requireAuth.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id;

    const applications = await db.query.jobApplications.findMany({
      where: eq(jobApplications.userId, userId),
      orderBy: (apps, { desc }) => [desc(apps.updatedAt)],
      with: {
        events: {
          orderBy: (events, { desc }) => [desc(events.date)],
        },
      },
    });

    return applications.map((app) => {
      // Sort events by date to find earliest and latest
      const sortedEvents = [...app.events].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const earliestEvent = sortedEvents[sortedEvents.length - 1];
      const latestEvent = sortedEvents[0];
      
      return {
        id: app.id,
        company: app.company,
        position: app.position,
        jobId: app.jobId,
        currentStatus: app.currentStatus,
        source: app.source,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        // Use earliest email date as "applied" date, fallback to createdAt
        appliedAt: earliestEvent ? new Date(earliestEvent.date) : app.createdAt,
        // Use latest email date as "last update" date
        lastUpdateAt: latestEvent ? new Date(latestEvent.date) : app.updatedAt,
        latestEvent: latestEvent || null,
      };
    });
  }),

  // Get a single application with all events
  getApplicationById: requireAuth
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

  // Trigger manual email sync from a specific date
  triggerSyncFromDate: requireAuth
    .input(z.object({ fromDate: z.string().datetime().optional() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session!.user.id;

      try {
        const fromDate = input.fromDate ? new Date(input.fromDate) : undefined;
        const result = await triggerManualSync(userId, fromDate);
        
        return {
          success: true,
          synced: result.synced,
          message: `Scheduled analysis of ${result.synced} emails.`,
        };
      } catch (error) {
        console.error("Error triggering manual sync:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to trigger sync",
        });
      }
    }),

  updateApplication: requireAuth
    .input(z.object({
      id: z.string().uuid(),
      company: z.string().min(1).nullable().optional(),
      position: z.string().min(1).nullable().optional(),
      jobId: z.string().optional().nullable(),
      currentStatus: z.enum(applicationStatusEnum),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session!.user.id;

      const application = await db.query.jobApplications.findFirst({
        where: and(
          eq(jobApplications.id, input.id),
          eq(jobApplications.userId, userId)
        ),
      });

      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      await db
        .update(jobApplications)
        .set({
          company: input.company?.trim() ?? null,
          position: input.position?.trim() ?? null,
          jobId: input.jobId?.trim() || null,
          currentStatus: input.currentStatus,
          updatedAt: new Date(),
        })
        .where(eq(jobApplications.id, input.id));

      return { success: true };
    }),

  updateEventClassification: requireAuth
    .input(z.object({
      applicationId: z.string().uuid(),
      eventId: z.string().uuid(),
      classification: z.enum(eventClassificationEnum),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session!.user.id;

      const application = await db.query.jobApplications.findFirst({
        where: and(
          eq(jobApplications.id, input.applicationId),
          eq(jobApplications.userId, userId)
        ),
      });

      if (!application) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      const event = await db.query.applicationEvents.findFirst({
        where: and(
          eq(applicationEvents.id, input.eventId),
          eq(applicationEvents.applicationId, input.applicationId)
        ),
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      await db
        .update(applicationEvents)
        .set({
          classification: input.classification,
        })
        .where(eq(applicationEvents.id, input.eventId));

      const events = await db.query.applicationEvents.findMany({
        where: eq(applicationEvents.applicationId, input.applicationId),
      });

      const newStatus = replayEventsToStatus(events);

      await db
        .update(jobApplications)
        .set({
          currentStatus: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(jobApplications.id, input.applicationId));

      return {
        success: true,
        currentStatus: newStatus,
      };
    }),

  deleteApplication: requireAuth
    .input(z.object({ id: z.string().uuid(), ignoreEmails: z.boolean().optional().default(false) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session!.user.id;
      console.log(`[DELETE-APP] Starting deletion for application ${input.id}, user ${userId}, ignoreEmails=${input.ignoreEmails}`);

      try {
        const application = await db.query.jobApplications.findFirst({
          where: and(
            eq(jobApplications.id, input.id),
            eq(jobApplications.userId, userId)
          ),
        });

        if (!application) {
          console.log(`[DELETE-APP] Application ${input.id} not found for user ${userId}`);
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application not found",
          });
        }
        console.log(`[DELETE-APP] Found application: ${application.company} (${application.position})`);

        // If ignoreEmails is true, get all event emailIds and add to ignored list
        if (input.ignoreEmails) {
          console.log(`[DELETE-APP] Fetching events for ignoreEmails`);
          const events = await db.query.applicationEvents.findMany({
            where: eq(applicationEvents.applicationId, input.id),
          });
          console.log(`[DELETE-APP] Found ${events.length} events to ignore`);

          const emailIds = events.map(e => e.emailId).filter(Boolean);
          console.log(`[DELETE-APP] Extracted ${emailIds.length} email IDs from events`);

          if (emailIds.length > 0) {
            console.log(`[DELETE-APP] Inserting ${emailIds.length} ignored emails with IDs:`, emailIds);
            const result = await db.insert(ignoredEmails).values(
              emailIds.map(emailId => ({
                userId,
                emailId: emailId,
              }))
            ).onConflictDoNothing()
            .returning({ id: ignoredEmails.id, emailId: ignoredEmails.emailId });
            console.log(`[DELETE-APP] Ignored emails inserted:`, result);
          }
        }

        // Delete related events first (cascade)
        console.log(`[DELETE-APP] Deleting application events`);
        const eventsResult = await db
          .delete(applicationEvents)
          .where(eq(applicationEvents.applicationId, input.id))
          .returning({ id: applicationEvents.id });
        console.log(`[DELETE-APP] Deleted ${eventsResult.length} application events`);

        // Delete the application
        console.log(`[DELETE-APP] Deleting job application`);
        const appResult = await db
          .delete(jobApplications)
          .where(eq(jobApplications.id, input.id))
          .returning({ id: jobApplications.id });
        console.log(`[DELETE-APP] Deleted job application: ${appResult.length > 0 ? 'success' : 'failed'}`);

        console.log(`[DELETE-APP] Deletion completed successfully`);
        return { success: true };
      } catch (error) {
        console.error(`[DELETE-APP] ERROR during deletion:`, error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete application: ${error instanceof Error ? error.message : 'Unknown error'}`,
          cause: error,
        });
      }
    }),

  mergeApplications: requireAuth
    .input(z.object({
      absorbedApplicationIds: z.array(z.string().uuid()).min(1),
      keptApplicationId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session!.user.id;

      const uniqueAbsorbedApplicationIds = Array.from(new Set(input.absorbedApplicationIds));

      if (uniqueAbsorbedApplicationIds.includes(input.keptApplicationId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot merge an application with itself",
        });
      }

      const keptApplication = await db.query.jobApplications.findFirst({
        where: and(
          eq(jobApplications.id, input.keptApplicationId),
          eq(jobApplications.userId, userId)
        ),
      });

      if (!keptApplication) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kept application not found",
        });
      }

      const absorbedApplications = await db.query.jobApplications.findMany({
        where: and(
          eq(jobApplications.userId, userId),
          inArray(jobApplications.id, uniqueAbsorbedApplicationIds)
        ),
      });

      if (absorbedApplications.length !== uniqueAbsorbedApplicationIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more applications to merge were not found",
        });
      }

      // Move all events from absorbed applications to the kept application.
      const movedEventRows = await db
        .update(applicationEvents)
        .set({ applicationId: input.keptApplicationId })
        .where(inArray(applicationEvents.applicationId, uniqueAbsorbedApplicationIds))
        .returning({ id: applicationEvents.id });

      // Move all notes from absorbed applications to the kept application.
      await db
        .update(applicationNotes)
        .set({ applicationId: input.keptApplicationId })
        .where(inArray(applicationNotes.applicationId, uniqueAbsorbedApplicationIds));

      // Get all events from the kept application to recalculate status.
      const allEvents = await db.query.applicationEvents.findMany({
        where: eq(applicationEvents.applicationId, input.keptApplicationId),
      });

      const newStatus = allEvents.length > 0
        ? replayEventsToStatus(allEvents)
        : keptApplication.currentStatus;

      // Update kept application status.
      await db
        .update(jobApplications)
        .set({
          currentStatus: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(jobApplications.id, input.keptApplicationId));

      // Delete absorbed applications (events and notes are now moved).
      await db
        .delete(jobApplications)
        .where(inArray(jobApplications.id, uniqueAbsorbedApplicationIds));

      return {
        success: true,
        keptApplicationId: input.keptApplicationId,
        mergedApplicationCount: uniqueAbsorbedApplicationIds.length,
        movedEventCount: movedEventRows.length,
      };
    }),

  createApplication: requireAuth
    .input(z.object({
      company: z.string().min(1, "Company is required").nullable().optional(),
      position: z.string().min(1, "Position is required").nullable().optional(),
      jobId: z.string().optional().nullable(),
      source: z.string().default("manual"),
      currentStatus: z.enum(applicationStatusEnum).default("applied"),
      appliedDate: z.string().datetime().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session!.user.id;

      // Create the application
      const [newApplication] = await db
        .insert(jobApplications)
        .values({
          userId,
          company: input.company?.trim() ?? null,
          position: input.position?.trim() ?? null,
          jobId: input.jobId?.trim() || null,
          currentStatus: input.currentStatus,
          source: input.source,
        })
        .returning();

      // Create initial event for tracking
      const eventDate = input.appliedDate || new Date().toISOString();
      await db.insert(applicationEvents).values({
        applicationId: newApplication.id,
        classification: "acknowledged",
        emailId: `manual-${Date.now()}`,
        subject: `Application sent for ${input.position ?? "Unknown Position"} at ${input.company ?? "Unknown Company"}`,
        from: userId,
        to: input.company ?? "",
        date: eventDate,
        confidence: "high",
      });

      return {
        success: true,
        applicationId: newApplication.id,
      };
    }),

  divergeEvent: requireAuth
    .input(z.object({
      sourceApplicationId: z.string().uuid(),
      eventId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session!.user.id;

      // Verify source application exists and belongs to user
      const sourceApp = await db.query.jobApplications.findFirst({
        where: and(
          eq(jobApplications.id, input.sourceApplicationId),
          eq(jobApplications.userId, userId)
        ),
      });

      if (!sourceApp) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Source application not found",
        });
      }

      // Find the event to diverge
      const event = await db.query.applicationEvents.findFirst({
        where: and(
          eq(applicationEvents.id, input.eventId),
          eq(applicationEvents.applicationId, input.sourceApplicationId)
        ),
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Create new application from the event
      // Try to extract company/position from subject, fall back to source app values, or null
      const subjectCompany = event.subject.match(/(?:applying to|at|from)\s+(\S+)/i)?.[1];
      const company = subjectCompany ?? sourceApp.company ?? null;
      const position =
        event.subject.match(/(?:for|as)\s+(\S+)\s+(?:position|role)/i)?.[1] ??
        event.subject.match(/(\S+)\s+(?:position|role)/i)?.[1] ??
        sourceApp.position ??
        null;

      const [newApplication] = await db
        .insert(jobApplications)
        .values({
          userId,
          company: company?.trim() ?? null,
          position: position?.trim() ?? null,
          currentStatus: replayEventsToStatus([event]),
          source: "email",
        })
        .returning();

      // Move the event to the new application
      await db
        .update(applicationEvents)
        .set({ applicationId: newApplication.id })
        .where(eq(applicationEvents.id, input.eventId));

      // Update remaining events on source application to recalculate its status
      const remainingEvents = await db.query.applicationEvents.findMany({
        where: eq(applicationEvents.applicationId, input.sourceApplicationId),
      });

      if (remainingEvents.length > 0) {
        const newSourceStatus = replayEventsToStatus(remainingEvents);
        await db
          .update(jobApplications)
          .set({
            currentStatus: newSourceStatus,
            updatedAt: new Date(),
          })
          .where(eq(jobApplications.id, input.sourceApplicationId));
      }

      return {
        success: true,
        newApplicationId: newApplication.id,
        eventId: input.eventId,
      };
    }),
});

export type JobTrackingRouter = typeof jobTrackingRouter;
