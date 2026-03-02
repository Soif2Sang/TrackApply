import { GoogleGenerativeAI } from "@google/generative-ai";
import { eventClassificationEnum } from "../db/schema/job-applications";
import type { Logger } from "../lib/logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

export type EventClassification = (typeof eventClassificationEnum)[number];

export interface ClassificationResult {
  classification: EventClassification | "OTHER";
  position: string | null;
  company: string | null;
  jobId: string | null;
  confidence: "high" | "medium" | "low";
}

export interface EmailInput {
  subject: string;
  body: string;
  from: string;
  snippet?: string;
}

const CLASSIFICATION_SYSTEM_INSTRUCTION = `Classify this email into ONE of these categories:

CATEGORIES:
1. ACKNOWLEDGED - Simple acknowledgment that the application was received. Does NOT include identity verification emails or verification codes.
2. SCREENING - Invitation to a recruiter call, phone screen, or initial HR conversation.
3. INTERVIEW - Invitation to a formal interview (video, on-site, panel, hiring manager call).
4. TECHNICAL - Invitation to a coding challenge, take-home test, or technical assessment.
5. OFFER - An offer of employment has been extended.
6. REJECTED - Rejection, position filled, or application declined. Any email that clearly states the candidate will not be moving forward.
7. OTHER - Not related to job applications or recruitment.

CLASSIFICATION RULES:
- If the email is a generic acknowledgment with no next step, use ACKNOWLEDGED.
- If the email mentions a recruiter call or phone screen, use SCREENING.
- If the email mentions a formal interview (video call with the team, on-site, panel), use INTERVIEW.
- If the email mentions a coding test, take-home assignment, or technical assessment, use TECHNICAL.
- If the email contains a job offer with compensation or start date details, use OFFER.
- If the email indicates the candidate is no longer being considered, use REJECTED.
- When in doubt between two categories, pick the more advanced one (e.g. INTERVIEW over SCREENING).

EXTRACTION RULES:
- For categories 1-6 (recruitment emails), extract:
  * Position: The job title applied for
  * Company: The company name (or email domain if name is not explicit)
  * Job ID: Any reference number, job code, or requisition ID mentioned
- Return null for any field you cannot find.

OUTPUT FORMAT (JSON only, no markdown, no explanation):
{
  "classification": "ACKNOWLEDGED|SCREENING|INTERVIEW|TECHNICAL|OFFER|REJECTED|OTHER",
  "position": "job title or null",
  "company": "company name or null",
  "job_id": "reference number or null",
  "confidence": "high|medium|low"
}`;

const USER_PROMPT_TEMPLATE = `EMAIL TO ANALYZE:
Subject: {{subject}}
From: {{from}}
{{snippet}}
Body:
{{body}}

RESPOND WITH JSON ONLY`;

const MAX_BODY_LENGTH = 3000;

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

function generatePrompt(input: EmailInput): string {
  const body = stripHtml(input.body).slice(0, MAX_BODY_LENGTH);
  const snippetLine = input.snippet
    ? `Snippet: ${input.snippet}\n`
    : "";

  return USER_PROMPT_TEMPLATE
    .replace("{{subject}}", input.subject)
    .replace("{{from}}", input.from)
    .replace("{{snippet}}", snippetLine)
    .replace("{{body}}", body);
}

// Map the classifier's uppercase output values to the lowercase applicationStatusEnum values.
const CLASSIFIER_OUTPUT_MAP: Record<string, EventClassification> = {
  ACKNOWLEDGED: "acknowledged",
  SCREENING:    "screening",
  INTERVIEW:    "interview",
  TECHNICAL:    "technical",
  OFFER:        "offer",
  REJECTED:     "rejected",
};

const VALID_CLASSIFIER_OUTPUTS = new Set([
  ...Object.keys(CLASSIFIER_OUTPUT_MAP),
  "OTHER",
]);

export async function classifyEmail(input: EmailInput, logger: Logger): Promise<ClassificationResult> {
  const log = logger.scope("classify");

  const startTime = Date.now();
  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: CLASSIFICATION_SYSTEM_INSTRUCTION,
    });

    const prompt = generatePrompt(input);
    const requestStart = Date.now();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const requestMs = Date.now() - requestStart;

    const parseStart = Date.now();
    const text = response.text();

    // Extract the JSON object robustly, ignoring any surrounding markdown or text.
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`No JSON object found in classifier response: ${text}`);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error(`Failed to parse classifier JSON: ${jsonMatch[0]}`);
    }

    const parseMs = Date.now() - parseStart;

    // Validate and normalise classification.
    const rawClassification = String(parsed.classification ?? "").toUpperCase();
    if (!VALID_CLASSIFIER_OUTPUTS.has(rawClassification)) {
      parsed.classification = "OTHER";
    } else {
      parsed.classification = rawClassification;
    }

    // Validate confidence.
    const validConfidence = new Set(["high", "medium", "low"]);
    if (!validConfidence.has(String(parsed.confidence ?? ""))) {
      parsed.confidence = "low";
    }

    const totalMs = Date.now() - startTime;
    log.info(
      `done classification=${parsed.classification} confidence=${parsed.confidence} perf=request:${requestMs}ms,parse:${parseMs}ms,total:${totalMs}ms promptChars=${prompt.length}`
    );

    const classifierOutput = parsed.classification as string;
    const mappedClassification: EventClassification | "OTHER" =
      classifierOutput === "OTHER"
        ? "OTHER"
        : CLASSIFIER_OUTPUT_MAP[classifierOutput];

    return {
      classification: mappedClassification,
      position:       parsed.position,
      company:        parsed.company,
      jobId:          parsed.job_id,
      confidence:     parsed.confidence as "high" | "medium" | "low",
    };
  } catch (error) {
    const totalMs = Date.now() - startTime;
    const status = (error as any)?.status || (error as any)?.code || (error as any)?.response?.status;
    log.error(`error status=${status ?? "unknown"} totalMs=${totalMs}ms`, error);
    throw error;
  }
}