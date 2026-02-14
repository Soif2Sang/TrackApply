import type { Job } from "pg-boss";
import { classifyEmail } from "../../services/email-classifier";
import { processRecruitmentEmail } from "../../services/job-tracking-service";
import { getLabelForClassification, sendJob, JOB_NAMES } from "../pgboss";

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

  console.log(`[${job.id}] Analyzing content: "${emailData.subject}"`);

  try {
    const classifyStart = Date.now();
    const classification = await classifyEmail({
      subject: emailData.subject,
      body: emailData.body,
      from: emailData.from,
      snippet: emailData.snippet,
    });
    const classifyMs = Date.now() - classifyStart;

    console.log(`[${job.id}] Classification: ${classification.classification} (${classification.confidence})`);
    console.log(`[${job.id}] PERF analyze-content: classify=${classifyMs}ms`);

    if (classification.classification === "OTHER") {
      const duration = Date.now() - startTime;
      console.log(`[${job.id}] PERF analyze-content: total=${duration}ms (skipped)`);
      console.log(`[${job.id}] Skipping non-recruitment email`);
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
      classification: classification.classification,
      position: classification.position,
      company: classification.company,
      jobId: classification.jobId,
      confidence: classification.confidence,
    });
    const processMs = Date.now() - processStart;

    console.log(`[${job.id}] Processed: ${result.message}`);
    console.log(`[${job.id}] PERF analyze-content: processRecruitment=${processMs}ms`);

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
        const enqueueLabelMs = Date.now() - enqueueLabelStart;
        console.log(`[${job.id}] PERF analyze-content: enqueueLabel=${enqueueLabelMs}ms`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[${job.id}] PERF analyze-content: total=${duration}ms`);
    console.log(`[${job.id}] Analysis completed in ${duration}ms`);

    return {
      success: true,
      classification: classification.classification,
      company: classification.company,
      position: classification.position,
      skipped: result.skipped,
    };
  } catch (error) {
    console.error(`[${job.id}] Error analyzing content:`, error);
    throw error;
  }
}
