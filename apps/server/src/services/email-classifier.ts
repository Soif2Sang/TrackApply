import { GoogleGenerativeAI } from "@google/generative-ai";
import { eventClassificationEnum } from "../db/schema/job-applications";
import type { Logger } from "../lib/logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";

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
- REJECTED takes highest priority: if anywhere in the email you see phrases like "decided to progress with other candidates", "will not be moving forward", "we won't be moving forward", "not selected", "not successful", "position has been filled", "decided not to proceed", "unfortunately" combined with a hiring decision, or any equivalent rejection language — classify as REJECTED regardless of how polite the opener is. Many rejection emails open with "Thank you for your application" before delivering the rejection — always read the full body.
- If the email is a generic acknowledgment with no next step and no rejection, use ACKNOWLEDGED.
- If the email mentions a recruiter call or phone screen, use SCREENING.
- If the email mentions a formal interview (video call with the team, on-site, panel), use INTERVIEW.
- If the email mentions a coding test, take-home assignment, or technical assessment, use TECHNICAL.
- If the email contains a job offer with compensation or start date details, use OFFER.
- When in doubt between two categories, pick the more advanced one (e.g. INTERVIEW over SCREENING).

EXTRACTION RULES:
- For categories 1-6 (recruitment emails), extract:
  * Position: The job title applied for
  * Company: The company name (or email domain if name is not explicit)
  * Job ID: The official job/requisition ID assigned by the employer's ATS (Applicant Tracking System) to the specific job posting. Look for labels like "Job ID", "Req ID", "Requisition ID", "Reference number", "(ID: 123456)". These are typically short numeric codes or short alphanumeric ATS references directly tied to the job posting itself.
    IMPORTANT — do NOT extract as job_id:
    - Interview codes or session tokens (e.g. HireVue "Interview Code: Xxx1abc-12abcd", video interview links)
    - Verification codes or OTP codes
    - Application tracking URLs or link tokens
    - Any long random-looking alphanumeric string that is clearly a session/token identifier rather than a job reference
    If you are not confident the value is a genuine job/requisition ID assigned to the role, return null.
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
Body:
{{body}}
RESPOND WITH JSON ONLY`;

// Generous limit — rejection signals often appear late in the email body.
const MAX_BODY_LENGTH = 8000;

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

  return USER_PROMPT_TEMPLATE
    .replace("{{subject}}", input.subject)
    .replace("{{from}}", input.from)
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
      position:       parsed.position as string | null,
      company:        parsed.company as string | null,
      jobId:          parsed.job_id as string | null,
      confidence:     parsed.confidence as "high" | "medium" | "low",
    };
  } catch (error) {
    const totalMs = Date.now() - startTime;
    const status = (error as any)?.status || (error as any)?.code || (error as any)?.response?.status;
    log.error(`error status=${status ?? "unknown"} totalMs=${totalMs}ms`, error);
    throw error;
  }
}
