import type { Job } from "pg-boss";
import { modifyLabels } from "../../services/gmail-service";

export interface LabelEmailPayload {
  userId: string;
  threadId: string;
  labelIds: string[];
}

export async function labelEmail(jobs: Job<LabelEmailPayload>[]) {
  const job = jobs[0];
  const startTime = Date.now();
  const { userId, threadId, labelIds } = job.data;

  console.log(`[${job.id}] Applying labels to thread ${threadId}: ${labelIds.join(", ")}`);

  try {
    const modifyStart = Date.now();
    await modifyLabels(userId, threadId, labelIds);
    const modifyMs = Date.now() - modifyStart;

    const duration = Date.now() - startTime;
    console.log(`[${job.id}] PERF label-email: gmail.modify=${modifyMs}ms total=${duration}ms`);
    console.log(`[${job.id}] Labels applied in ${duration}ms`);

    return {
      success: true,
      threadId,
      labelIds,
    };
  } catch (error) {
    console.error(`[${job.id}] Error applying labels:`, error);
    throw error;
  }
}
