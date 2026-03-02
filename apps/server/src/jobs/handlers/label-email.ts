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
  const log = (msg: string) => console.log(`[label-email:${job.id}] ${msg}`);

  log(`start threadId=${threadId} labels=[${labelIds.join(",")}] userId=${userId}`);

  try {
    const modifyStart = Date.now();
    await modifyLabels(userId, threadId, labelIds);
    const modifyMs = Date.now() - modifyStart;

    const totalMs = Date.now() - startTime;
    log(`done threadId=${threadId} perf=gmail.modify:${modifyMs}ms,total:${totalMs}ms`);

    return {
      success: true,
      threadId,
      labelIds,
    };
  } catch (error) {
    const totalMs = Date.now() - startTime;
    console.error(`[label-email:${job.id}] error threadId=${threadId} totalMs=${totalMs}ms`, error);
    throw error;
  }
}