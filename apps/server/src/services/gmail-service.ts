import { google } from "googleapis";
import { db } from "../db";
import { user } from "../db/schema/auth";
import { eq } from "drizzle-orm";

const gmailClientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const gmailRedirectUri = process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(
  gmailClientId,
  gmailClientSecret,
  gmailRedirectUri
);

// Label IDs mapping (to be configured based on user's Gmail labels)
export const LABEL_IDS = {
  RECRUITMENT_ACK: process.env.LABEL_RECRUITMENT_ACK || "Label_RECRUITMENT_ACK",
  NEXT_STEP: process.env.LABEL_NEXT_STEP || "Label_NEXT_STEP",
  DISAPPROVAL: process.env.LABEL_DISAPPROVAL || "Label_DISAPPROVAL",
  LOW_CONFIDENCE: process.env.LABEL_LOW_CONFIDENCE || "Label_LOW_CONFIDENCE",
};

function getLabelNameFromRef(labelRef: string): string {
  return labelRef.startsWith("Label_") ? labelRef.replace(/^Label_/, "") : labelRef;
}

async function resolveLabelIds(
  gmail: any,
  labelRefs: string[]
): Promise<string[]> {
  const labelsResponse = await gmail.users.labels.list({ userId: "me" });
  const existingLabels = labelsResponse.data.labels || [];

  const resolvedLabelIds: string[] = [];

  for (const labelRef of labelRefs) {
    const normalizedName = getLabelNameFromRef(labelRef);

    const existing =
      existingLabels.find((label: any) => label.id === labelRef) ||
      existingLabels.find((label: any) => label.name === labelRef) ||
      existingLabels.find((label: any) => label.name === normalizedName);

    if (existing?.id) {
      resolvedLabelIds.push(existing.id);
      continue;
    }

    const created = await gmail.users.labels.create({
      userId: "me",
      requestBody: {
        name: normalizedName,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      },
    });

    if (created.data.id) {
      resolvedLabelIds.push(created.data.id);
      existingLabels.push(created.data);
      console.log(`✅ Created Gmail label "${normalizedName}" (${created.data.id})`);
    }
  }

  return resolvedLabelIds;
}

export function getLabelForClassification(
  classification: string,
  confidence?: string
): string[] {
  const labels: string[] = [];
  
  switch (classification) {
    case "RECRUITMENT_ACK":
      labels.push(LABEL_IDS.RECRUITMENT_ACK);
      break;
    case "NEXT_STEP":
      labels.push(LABEL_IDS.NEXT_STEP);
      break;
    case "DISAPPROVAL":
      labels.push(LABEL_IDS.DISAPPROVAL);
      break;
  }
  
  if (confidence === "low") {
    labels.push(LABEL_IDS.LOW_CONFIDENCE);
  }
  
  return labels;
}

async function refreshAccessToken(userId: string): Promise<string | null> {
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord?.gmailRefreshToken) {
    return null;
  }

  try {
    oauth2Client.setCredentials({
      refresh_token: userRecord.gmailRefreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update tokens in database
    await db
      .update(user)
      .set({
        gmailAccessToken: credentials.access_token,
        gmailTokenExpiry: credentials.expiry_date 
          ? new Date(credentials.expiry_date) 
          : null,
      })
      .where(eq(user.id, userId));

    return credentials.access_token || null;
  } catch (error) {
    console.error("Error refreshing Gmail token:", error);
    return null;
  }
}

export async function getGmailClient(userId: string) {
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord?.gmailRefreshToken) {
    throw new Error("User has not connected Gmail");
  }

  let accessToken = userRecord.gmailAccessToken;
  const tokenExpiry = userRecord.gmailTokenExpiry;

  // Check if token needs refresh
  if (!accessToken || !tokenExpiry || tokenExpiry < new Date()) {
    accessToken = await refreshAccessToken(userId);
    if (!accessToken) {
      throw new Error("Failed to refresh Gmail token");
    }
  }

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: userRecord.gmailRefreshToken,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function getMessage(userId: string, messageId: string) {
  const gmail = await getGmailClient(userId);
  return gmail.users.messages.get({
    userId: "me",
    id: messageId,
  });
}

export async function modifyLabels(
  userId: string,
  threadId: string,
  labelIds: string[]
) {
  const gmail = await getGmailClient(userId);
  const resolvedLabelIds = await resolveLabelIds(gmail, labelIds);

  if (resolvedLabelIds.length === 0) {
    console.warn(`⚠️ No valid labels resolved for thread ${threadId}`);
    return null;
  }

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      return await gmail.users.threads.modify({
        userId: "me",
        id: threadId,
        requestBody: {
          addLabelIds: resolvedLabelIds,
        },
      });
    } catch (error: any) {
      attempt++;
      const status = error?.code || error?.status || error?.response?.status;
      const isRetryable = Number(status) >= 500;

      if (!isRetryable || attempt >= maxAttempts) {
        throw error;
      }

      const delayMs = 500 * attempt;
      console.warn(
        `⚠️ Gmail modifyLabels failed with ${status}, retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
}

export async function listMessages(
  userId: string,
  query: string,
  options?: {
    pageToken?: string;
    maxResults?: number;
  }
) {
  const gmail = await getGmailClient(userId);
  return gmail.users.messages.list({
    userId: "me",
    q: query,
    pageToken: options?.pageToken,
    maxResults: options?.maxResults,
  });
}

// Start Gmail watch for push notifications
export async function startGmailWatch(userId: string) {
  const gmail = await getGmailClient(userId);
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  
  if (!projectId) {
    console.error("❌ GOOGLE_CLOUD_PROJECT_ID not set");
    throw new Error("GOOGLE_CLOUD_PROJECT_ID not configured");
  }

  const topicName = `projects/${projectId}/topics/gmail-notifications`;

  try {
    const response = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: topicName,
        labelIds: ["INBOX"],
        labelFilterAction: "include",
      },
    });

    console.log(`✅ Gmail watch started for user ${userId}`);
    console.log(`   History ID: ${response.data.historyId}`);
    console.log(`   Expiration: ${response.data.expiration ? new Date(parseInt(response.data.expiration)).toISOString() : 'N/A'}`);

    // Store watch expiration in database
    await db
      .update(user)
      .set({
        gmailWatchExpiration: response.data.expiration 
          ? new Date(parseInt(response.data.expiration)) 
          : null,
        gmailWatchHistoryId: response.data.historyId?.toString() || null,
      })
      .where(eq(user.id, userId));

    return {
      historyId: response.data.historyId,
      expiration: response.data.expiration,
    };
  } catch (error: any) {
    console.error(`❌ Failed to start Gmail watch for user ${userId}:`, error.message);
    throw error;
  }
}

// Stop Gmail watch (call when disconnecting)
export async function stopGmailWatch(userId: string) {
  const gmail = await getGmailClient(userId);

  try {
    await gmail.users.stop({
      userId: "me",
    });

    console.log(`✅ Gmail watch stopped for user ${userId}`);

    // Clear watch data from database
    await db
      .update(user)
      .set({
        gmailWatchExpiration: null,
        gmailWatchHistoryId: null,
      })
      .where(eq(user.id, userId));
  } catch (error: any) {
    console.error(`❌ Failed to stop Gmail watch for user ${userId}:`, error.message);
    // Don't throw - we still want to disconnect even if stop fails
  }
}

// Helper to extract email data from Gmail message
export function extractEmailData(message: any) {
  const headers = message.payload?.headers || [];
  
  const getHeader = (name: string) => {
    const header = headers.find((h: any) => h.name === name);
    return header?.value || "";
  };

  // Extract body
  let body = "";
  const parts = message.payload?.parts || [];
  
  function decodeBody(parts: any[], mimeType: string = "text/plain"): string {
    for (const part of parts) {
      if (part.mimeType === mimeType && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      if (part.parts) {
        const decoded = decodeBody(part.parts, mimeType);
        if (decoded) return decoded;
      }
    }
    return "";
  }

  body = decodeBody(parts, "text/plain") || decodeBody(parts, "text/html");

  // If no body found in parts, check the main payload
  if (!body && message.payload?.body?.data) {
    body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
  }

  // Extract email addresses
  function extractEmailAddress(emailObject: any): string {
    if (!emailObject) return "";
    if (typeof emailObject === "string") return emailObject;
    if (emailObject.text) return emailObject.text;
    if (emailObject.value && Array.isArray(emailObject.value)) {
      const first = emailObject.value[0];
      if (first?.name && first?.address) {
        return `"${first.name}" <${first.address}>`;
      }
      return first?.address || "";
    }
    return String(emailObject);
  }

  return {
    emailId: message.id,
    threadId: message.threadId,
    messageId: getHeader("Message-ID"),
    subject: getHeader("Subject"),
    from: extractEmailAddress(getHeader("From")),
    to: extractEmailAddress(getHeader("To")),
    date: getHeader("Date"),
    body,
    snippet: message.snippet,
  };
}
