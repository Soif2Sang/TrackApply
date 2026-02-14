import type { Job } from "pg-boss";
import { getMessage, extractEmailData } from "../../services/gmail-service";
import { sendJob, JOB_NAMES } from "../pgboss";

export interface ProcessEmailPayload {
  userId: string;
  emailId: string;
  historyId?: string;
}

export async function processEmail(jobs: Job<ProcessEmailPayload>[]) {
  const job = jobs[0];
  const startTime = Date.now();
  const { userId, emailId } = job.data;
  const analyzeRetryLimit = parseInt(process.env.ANALYZE_RETRY_LIMIT || "5", 10);
  const analyzeRetryDelay = parseInt(process.env.ANALYZE_RETRY_DELAY_SECONDS || "30", 10);

  console.log(`[${job.id}] Processing email ${emailId} for user ${userId}`);

  try {
    const getMessageStart = Date.now();
    const response = await getMessage(userId, emailId);
    const message = response.data;
    const getMessageMs = Date.now() - getMessageStart;

    const extractStart = Date.now();
    const emailData = extractEmailData(message);
    const extractMs = Date.now() - extractStart;

    console.log(`[${job.id}] Extracted email: "${emailData.subject}" from ${emailData.from}`);
    console.log(`[${job.id}] PERF process-email: gmail.get=${getMessageMs}ms extract=${extractMs}ms`);

    const enqueueStart = Date.now();
    await sendJob(JOB_NAMES.ANALYZE_CONTENT, {
      userId,
      emailData,
    }, {
      retryLimit: analyzeRetryLimit,
      retryDelay: analyzeRetryDelay,
      expireInSeconds: 60,
    });
    const enqueueMs = Date.now() - enqueueStart;

    const duration = Date.now() - startTime;
    console.log(`[${job.id}] PERF process-email: enqueueAnalyze=${enqueueMs}ms total=${duration}ms`);
    console.log(`[${job.id}] Email processed in ${duration}ms`);

    return {
      success: true,
      emailId,
      subject: emailData.subject,
    };
  } catch (error) {
    console.error(`[${job.id}] Error processing email:`, error);
    throw error; // Will trigger retry
  }
}
