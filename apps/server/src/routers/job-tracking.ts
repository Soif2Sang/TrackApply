import { z } from "zod";
import { db } from "../db";
import {
  jobApplications,
  applicationEvents,
  applicationStatusEnum,
  classificationEnum,
  eventTypeEnum,
} from "../db/schema/job-applications";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { t } from "../lib/trpc";
import { triggerManualSync } from "../jobs/schedule";

function mapClassificationToEventType(
  classification: (typeof classificationEnum)[number]
): (typeof eventTypeEnum)[number] {
  switch (classification) {
    case "RECRUITMENT_ACK":
      return "recruitment_ack";
    case "NEXT_STEP":
      return "next_step";
    case "DISAPPROVAL":
      return "disapproval";
  }
}

function mapClassificationToStatus(
  classification: (typeof classificationEnum)[number]
): (typeof applicationStatusEnum)[number] {
  switch (classification) {
    case "RECRUITMENT_ACK":
      return "acknowledged";
    case "NEXT_STEP":
      return "screening";
    case "DISAPPROVAL":
      return "rejected";
  }
}

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

    const result = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE state IN ('created', 'retry'))::int AS pending,
        COUNT(*) FILTER (WHERE state = 'active')::int AS active,
        COUNT(*) FILTER (WHERE state IN ('created', 'retry', 'active'))::int AS total
      FROM public.job
      WHERE name = 'analyze-content'
        AND data->>'userId' = ${userId}
    `);

    const row = result.rows[0] as
      | { pending?: number; active?: number; total?: number }
      | undefined;

    return {
      pending: Number(row?.pending || 0),
      active: Number(row?.active || 0),
      total: Number(row?.total || 0),
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
          message: `Synced ${result.synced} emails`,
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
      company: z.string().min(1),
      position: z.string().min(1),
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
          company: input.company.trim(),
          position: input.position.trim(),
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
      classification: z.enum(classificationEnum),
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
          eventType: mapClassificationToEventType(input.classification),
        })
        .where(eq(applicationEvents.id, input.eventId));

      const events = await db.query.applicationEvents.findMany({
        where: eq(applicationEvents.applicationId, input.applicationId),
      });

      const latestEvent = events.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

      const newStatus = latestEvent
        ? mapClassificationToStatus(latestEvent.classification)
        : "applied";

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
});

export type JobTrackingRouter = typeof jobTrackingRouter;
