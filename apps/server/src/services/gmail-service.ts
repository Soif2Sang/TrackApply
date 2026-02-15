import { google } from "googleapis";
import { db } from "../db";
import { gmailConnection, user } from "../db/schema/auth";
import { eq } from "drizzle-orm";
import { decrypt, encrypt } from "./encryption-service";

const defaultRedirectUri = process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;

type GmailProjectConfigInput = {
  googleProjectId: string;
  googleClientId: string;
  googleClientSecret: string;
};

function maybeDecrypt(value: string | null): string | null {
  if (!value) return null;

  try {
    return decrypt(value);
  } catch {
    return value;
  }
}

async function getConnection(userId: string) {
  return db.query.gmailConnection.findFirst({
    where: eq(gmailConnection.userId, userId),
  });
}

async function ensureConnectionRow(userId: string) {
  const existing = await getConnection(userId);
  if (existing) return existing;

  await db.insert(gmailConnection).values({
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return getConnection(userId);
}

function getUserOauthClient(connection: {
  googleClientId: string | null;
  googleClientSecret: string | null;
}) {
  const clientId = maybeDecrypt(connection.googleClientId);
  const clientSecret = maybeDecrypt(connection.googleClientSecret);

  if (!clientId || !clientSecret || !defaultRedirectUri) {
    throw new Error("Gmail project is not fully configured");
  }

  return new google.auth.OAuth2(clientId, clientSecret, defaultRedirectUri);
}

export async function upsertGmailProjectConfig(userId: string, input: GmailProjectConfigInput) {
  const now = new Date();
  await ensureConnectionRow(userId);

  await db
    .update(gmailConnection)
    .set({
      googleProjectId: encrypt(input.googleProjectId),
      googleClientId: encrypt(input.googleClientId),
      googleClientSecret: encrypt(input.googleClientSecret),
      updatedAt: now,
    })
    .where(eq(gmailConnection.userId, userId));

  return getGmailConnectionStatus(userId);
}

export async function getGmailConnectionStatus(userId: string) {
  const [userRecord, connection] = await Promise.all([
    db.query.user.findFirst({ where: eq(user.id, userId) }),
    getConnection(userId),
  ]);

  if (!userRecord) {
    return null;
  }

  const configured = Boolean(
    connection?.googleProjectId &&
      connection?.googleClientId &&
      connection?.googleClientSecret
  );

  const connected = Boolean(connection?.gmailRefreshToken);

  return {
    configured,
    connected,
    applicationSyncLastCompletedAt: userRecord.applicationSyncLastCompletedAt,
    applicationSyncHistoryEarliestDate: userRecord.applicationSyncHistoryEarliestDate,
    lastPolledAt: userRecord.lastPolledAt ?? null,
    lastPollStatus: userRecord.lastPollStatus ?? null,
  };
}

export async function disconnectGmail(userId: string) {
  const now = new Date();

  await ensureConnectionRow(userId);
  await db
    .update(gmailConnection)
    .set({
      gmailRefreshToken: null,
      gmailAccessToken: null,
      gmailTokenExpiry: null,
      connectedAt: null,
      updatedAt: now,
    })
    .where(eq(gmailConnection.userId, userId));
}

export async function setPollCheckpoint(
  userId: string,
  input: { lastPolledAt: Date; lastPollStatus: string }
) {
  await db
    .update(user)
    .set({
      lastPolledAt: input.lastPolledAt,
      lastPollStatus: input.lastPollStatus,
    })
    .where(eq(user.id, userId));
}

export async function listConnectedUserIds(): Promise<string[]> {
  const rows = await db.query.gmailConnection.findMany();
  return rows
    .filter((row) => Boolean(row.gmailRefreshToken))
    .map((row) => row.userId);
}

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
  const connection = await getConnection(userId);

  if (!connection?.gmailRefreshToken) {
    return null;
  }

  try {
    const oauth2Client = getUserOauthClient(connection);
    const refreshToken = maybeDecrypt(connection.gmailRefreshToken);
    if (!refreshToken) {
      return null;
    }

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update tokens in database
    await db
      .update(gmailConnection)
      .set({
        gmailAccessToken: credentials.access_token ? encrypt(credentials.access_token) : null,
        gmailTokenExpiry: credentials.expiry_date 
          ? new Date(credentials.expiry_date) 
          : null,
        updatedAt: new Date(),
      })
      .where(eq(gmailConnection.userId, userId));

    return credentials.access_token || null;
  } catch (error) {
    console.error("Error refreshing Gmail token:", error);
    return null;
  }
}

export async function getGmailClient(userId: string) {
  const connection = await getConnection(userId);

  if (!connection?.gmailRefreshToken) {
    throw new Error("User has not connected Gmail");
  }

  const oauth2Client = getUserOauthClient(connection);

  let accessToken = maybeDecrypt(connection.gmailAccessToken);
  const refreshToken = maybeDecrypt(connection.gmailRefreshToken);
  const tokenExpiry = connection.gmailTokenExpiry;

  if (!refreshToken) {
    throw new Error("User has not connected Gmail");
  }

  // Check if token needs refresh
  if (!accessToken || !tokenExpiry || tokenExpiry < new Date()) {
    accessToken = await refreshAccessToken(userId);
    if (!accessToken) {
      throw new Error("Failed to refresh Gmail token");
    }
  }

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function createUserGmailAuthUrl(userId: string, scopes: string[]) {
  const connection = await getConnection(userId);
  if (!connection) {
    throw new Error("Gmail project is not configured");
  }

  const oauth2Client = getUserOauthClient(connection);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: userId,
    prompt: "consent",
    redirect_uri: defaultRedirectUri,
  });
}

export async function exchangeCodeForUserTokens(userId: string, code: string) {
  const connection = await getConnection(userId);
  if (!connection) {
    throw new Error("Gmail project is not configured");
  }

  const oauth2Client = getUserOauthClient(connection);
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error("No refresh token received");
  }

  await db
    .update(gmailConnection)
    .set({
      gmailRefreshToken: encrypt(tokens.refresh_token),
      gmailAccessToken: tokens.access_token ? encrypt(tokens.access_token) : null,
      gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      connectedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(gmailConnection.userId, userId));
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
