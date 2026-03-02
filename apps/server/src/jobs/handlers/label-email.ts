import type { Job } from "pg-boss";
import { modifyLabels } from "../../services/gmail-service";
import { Logger } from "../../lib/logger";

export interface LabelEmailPayload {
  userId: string;
  threadId: string;
  labelIds: string[];
}

export async function labelEmail(jobs: Job<LabelEmailPayload>[]) {
  const job = jobs[0];
  const startTime = Date.now();
  const { userId, threadId, labelIds } = job.data;
  const logger = new Logger("label-email", job.id);

  logger.info(`start threadId=${threadId} labels=[${labelIds.join(",")}] userId=${userId}`);

  try {
    const modifyStart = Date.now();
    await modifyLabels(userId, threadId, labelIds);
    const modifyMs = Date.now() - modifyStart;

    const totalMs = Date.now() - startTime;
    logger.info(`done threadId=${threadId} perf=gmail.modify:${modifyMs}ms,total:${totalMs}ms`);
    logger.flush();

    return {
      success: true,
      threadId,
      labelIds,
    };
  } catch (error) {
    const totalMs = Date.now() - startTime;
    logger.error(`error threadId=${threadId} totalMs=${totalMs}ms`, error);
    logger.flush();
    throw error;
  }
}