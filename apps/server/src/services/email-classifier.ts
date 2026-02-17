import { GoogleGenerativeAI } from "@google/generative-ai";
import { classificationEnum } from "../db/schema/job-applications";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

export interface ClassificationResult {
  classification: (typeof classificationEnum)[number] | "OTHER";
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
1. RECRUITMENT_ACK - Simple acknowledgment that application was received. This DOES NOT INCLUDES identity verification emails, verification codes.
2. NEXT_STEP - Invitation to interview, coding challenge, technical assessment, phone screen, or any active next stage in the hiring process. The email indicates that the candidate is moving forward in the process and may include details about the next steps.
3. DISAPPROVAL - Rejection, position filled, or application declined. This includes any email that indicates the candidate will not be moving forward in the hiring process. It may include polite rejections, notifications of filled positions, or any communication that clearly states the application was unsuccessful.
4. OTHER - Not related to job applications/recruitment

EXTRACTION RULES:
- For categories 1-3 (recruitment emails), extract:
  * Position: The job title you applied for
  * Company: The company name
  * Job ID: Any reference number, job code, or requisition ID mentioned

- Return null for any field you cannot find
- Be precise - only extract information explicitly stated in the email

OUTPUT FORMAT (JSON only, no markdown, no explanation):
{
  "classification": "RECRUITMENT_ACK|NEXT_STEP|DISAPPROVAL|OTHER",
  "position": "job title or null",
  "company": "company name or company email domain or null",
  "job_id": "reference number or null",
  "confidence": "high|medium|low"
}`;

const USER_PROMPT_TEMPLATE = `EMAIL TO ANALYZE:
Subject: {{subject}}
From: {{from}}

Body:
{{body}}

RESPOND WITH JSON ONLY`;

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
  return USER_PROMPT_TEMPLATE
    .replace("{{subject}}", input.subject)
    .replace("{{from}}", input.from)
    .replace("{{body}}", stripHtml(input.body))
}

export async function classifyEmail(input: EmailInput): Promise<ClassificationResult> {
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
    
    // Clean up the response (remove markdown code blocks if present)
    const cleanedText = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    
    const parsed = JSON.parse(cleanedText);
    const parseMs = Date.now() - parseStart;
    
    // Validate classification
    const validClassifications = ["RECRUITMENT_ACK", "NEXT_STEP", "DISAPPROVAL", "OTHER"];
    if (!validClassifications.includes(parsed.classification)) {
      parsed.classification = "OTHER";
    }
    
    // Validate confidence
    const validConfidence = ["high", "medium", "low"];
    if (!validConfidence.includes(parsed.confidence)) {
      parsed.confidence = "low";
    }
    
    const totalMs = Date.now() - startTime;
    console.log(
      `[PERF classify-email] model=${GEMINI_MODEL} request=${requestMs}ms parse=${parseMs}ms total=${totalMs}ms promptChars=${prompt.length}`
    );

    return {
      classification: parsed.classification,
      position: parsed.position || null,
      company: parsed.company || null,
      jobId: parsed.job_id || null,
      confidence: parsed.confidence,
    };
  } catch (error) {
    const totalMs = Date.now() - startTime;
    const status = (error as any)?.status || (error as any)?.code || (error as any)?.response?.status;
    console.error(`[PERF classify-email] failed after ${totalMs}ms status=${status ?? "unknown"}`);
    console.error("Error classifying email with Gemini:", error);

    throw error;
  }
}
