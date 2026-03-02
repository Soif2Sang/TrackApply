import type { Job } from "pg-boss";
import { classifyEmail } from "../../services/email-classifier";
import { processRecruitmentEmail } from "../../services/job-tracking-service";
import { getLabelForClassification, sendJob, JOB_NAMES } from "../pgboss";
import type { EventClassification } from "../../services/email-classifier";

export interface AnalyzeContentPayload {
  userId: string;
  emailData: {
    emailId: string;
    threadId: string;
    messageId?: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    body: string;
    snippet?: string;
  };
}

export async function analyzeContent(jobs: Job<AnalyzeContentPayload>[]) {
  const job = jobs[0];
  const startTime = Date.now();
  const { userId, emailData } = job.data;
  const log = (msg: string) => console.log(`[analyze-content:${job.id}] ${msg}`);

  log(`start emailId=${emailData.emailId} subject="${emailData.subject}" userId=${userId}`);

  try {
    const classifyStart = Date.now();
    const classification = await classifyEmail({
      subject: emailData.subject,
      body: emailData.body,
      from: emailData.from,
      snippet: emailData.snippet,
    });
    const classifyMs = Date.now() - classifyStart;

    if (classification.classification === "OTHER") {
      const totalMs = Date.now() - startTime;
      log(`skip reason=not_recruitment classification=OTHER perf=classify:${classifyMs}ms,total:${totalMs}ms`);
      return {
        skipped: true,
        reason: "not_recruitment",
        classification: classification.classification,
      };
    }

    const processStart = Date.now();
    const result = await processRecruitmentEmail(userId, {
      emailId: emailData.emailId,
      threadId: emailData.threadId,
      messageId: emailData.messageId,
      subject: emailData.subject,
      from: emailData.from,
      to: emailData.to,
      date: emailData.date,
      body: emailData.body,
      snippet: emailData.snippet,
      classification: classification.classification as EventClassification,
      position: classification.position,
      company: classification.company,
      jobId: classification.jobId,
      confidence: classification.confidence,
    });
    const processMs = Date.now() - processStart;

    let enqueueLabelMs = 0;
    if (!result.skipped) {
      const labelIds = getLabelForClassification(
        classification.classification,
        classification.confidence
      );

      if (labelIds.length > 0) {
        const enqueueLabelStart = Date.now();
        await sendJob(JOB_NAMES.LABEL_EMAIL, {
          userId,
          threadId: emailData.threadId,
          labelIds,
        }, {
          retryLimit: 3,
          expireInSeconds: 120,
        });
        enqueueLabelMs = Date.now() - enqueueLabelStart;
      }
    }

    const totalMs = Date.now() - startTime;
    log(
      `done classification=${classification.classification} confidence=${classification.confidence}` +
      ` company="${classification.company}" position="${classification.position}"` +
      ` skipped=${result.skipped}` +
      ` perf=classify:${classifyMs}ms,process:${processMs}ms,enqueueLabel:${enqueueLabelMs}ms,total:${totalMs}ms`
    );

    return {
      success: true,
      classification: classification.classification,
      company: classification.company,
      position: classification.position,
      skipped: result.skipped,
    };
  } catch (error) {
    const totalMs = Date.now() - startTime;
    console.error(`[analyze-content:${job.id}] error emailId=${emailData.emailId} totalMs=${totalMs}ms`, error);
    throw error;
  }
}