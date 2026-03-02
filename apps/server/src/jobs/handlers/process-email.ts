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
  const log = (msg: string) => console.log(`[process-email:${job.id}] ${msg}`);
  const analyzeRetryLimit = parseInt(process.env.ANALYZE_RETRY_LIMIT || "5", 10);
  const analyzeRetryDelay = parseInt(process.env.ANALYZE_RETRY_DELAY_SECONDS || "30", 10);

  log(`start emailId=${emailId} userId=${userId}`);

  try {
    const getMessageStart = Date.now();
    const response = await getMessage(userId, emailId);
    const message = response.data;
    const getMessageMs = Date.now() - getMessageStart;

    const extractStart = Date.now();
    const emailData = extractEmailData(message);
    const extractMs = Date.now() - extractStart;

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

    const totalMs = Date.now() - startTime;
    log(`done subject="${emailData.subject}" from="${emailData.from}" perf=gmail.get:${getMessageMs}ms,extract:${extractMs}ms,enqueue:${enqueueMs}ms,total:${totalMs}ms`);

    return {
      success: true,
      emailId,
      subject: emailData.subject,
    };
  } catch (error) {
    const totalMs = Date.now() - startTime;
    console.error(`[process-email:${job.id}] error emailId=${emailId} totalMs=${totalMs}`, error);
    throw error;
  }
}