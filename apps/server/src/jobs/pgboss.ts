import { PgBoss } from "pg-boss";
import type { Job } from "pg-boss";

// Re-export types for convenience
export type { Job };
import { processEmail } from "./handlers/process-email";
import { analyzeContent } from "./handlers/analyze-content";
import { labelEmail } from "./handlers/label-email";
import { getLabelForClassification as _getLabelForClassification } from "../services/gmail-service";

export { _getLabelForClassification as getLabelForClassification };

export const PG_BOSS_SCHEMA = "pgboss";

// Initialize PgBoss with database connection
export const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL || "",
  schema: PG_BOSS_SCHEMA,
});

// Job names
export const JOB_NAMES = {
  PROCESS_EMAIL: "process-email",
  ANALYZE_CONTENT: "analyze-content",
  LABEL_EMAIL: "label-email",
  SYNC_USER_EMAILS: "sync-user-emails",
} as const;

// Start PgBoss and register workers
export async function startPgBoss() {
  try {
    const processEmailConcurrency = parseInt(process.env.PROCESS_EMAIL_CONCURRENCY || "2", 10);
    const analyzeContentConcurrency = parseInt(process.env.ANALYZE_CONTENT_CONCURRENCY || "2", 10);
    const labelEmailConcurrency = parseInt(process.env.LABEL_EMAIL_CONCURRENCY || "4", 10);

    // Handle PG-Boss errors to prevent unhandled crashes
    boss.on("error", (error) => {
      console.error("[pgboss] error", error);
    });

    await boss.start();
    console.log("[pgboss] started");

    // Create queues before registering workers (required by pg-boss)
    await boss.createQueue(JOB_NAMES.PROCESS_EMAIL);
    await boss.createQueue(JOB_NAMES.ANALYZE_CONTENT);
    await boss.createQueue(JOB_NAMES.LABEL_EMAIL);
    await boss.createQueue(JOB_NAMES.SYNC_USER_EMAILS);
    console.log("[pgboss] queues created");

    // Register job handlers
    boss.work(JOB_NAMES.PROCESS_EMAIL, { localConcurrency: processEmailConcurrency }, processEmail);
    boss.work(JOB_NAMES.ANALYZE_CONTENT, { localConcurrency: analyzeContentConcurrency }, analyzeContent);
    boss.work(JOB_NAMES.LABEL_EMAIL, { localConcurrency: labelEmailConcurrency }, labelEmail);

    console.log(
      `[pgboss] workers registered concurrency=process:${processEmailConcurrency},analyze:${analyzeContentConcurrency},label:${labelEmailConcurrency}`
    );
  } catch (error) {
    console.error("[pgboss] failed to start", error);
    throw error;
  }
}

// Stop PgBoss gracefully
export async function stopPgBoss() {
  try {
    await boss.stop();
    console.log("[pgboss] stopped");
  } catch (error) {
    console.error("[pgboss] error stopping", error);
  }
}

// Helper to send job with retries
export async function sendJob(
  name: string,
  data: any,
  options?: {
    retryLimit?: number;
    retryDelay?: number;
    expireInSeconds?: number;
  }
) {
  const jobOptions: any = {};
  
  if (options?.retryLimit !== undefined) {
    jobOptions.retryLimit = options.retryLimit;
  }
  if (options?.retryDelay !== undefined) {
    jobOptions.retryDelay = options.retryDelay;
  }
  if (options?.expireInSeconds !== undefined) {
    jobOptions.expireInSeconds = options.expireInSeconds;
  }

  return boss.send(name, data, jobOptions);
}
