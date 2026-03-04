export const ALL_STATUSES = [
  "applied",
  "acknowledged",
  "screening",
  "interview",
  "technical",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof ALL_STATUSES)[number];

export const SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "company-website", label: "Company Website" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
] as const;

export type SourceOption = (typeof SOURCE_OPTIONS)[number];

// Status display options
export const STATUS_OPTIONS = [
  { value: "applied", label: "Applied" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "technical", label: "Technical" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

export const STATUS_STYLES: Record<string, string> = {
  applied: "border-border/40 text-foreground hover:bg-muted",
  acknowledged: "border-sky-500/30 text-sky-400 hover:bg-sky-500/10",
  screening: "border-amber-500/30 text-amber-400 hover:bg-amber-500/10",
  interview: "border-violet-500/30 text-violet-400 hover:bg-violet-500/10",
  technical: "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10",
  offer: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10",
  rejected: "border-rose-500/30 text-rose-400 hover:bg-rose-500/10",
  withdrawn: "border-muted-foreground/30 text-muted-foreground hover:bg-muted",
};

export const STATUS_STYLES_ACTIVE: Record<string, string> = {
  applied: "bg-foreground/15 border-foreground/60 text-foreground",
  acknowledged: "bg-sky-500/20 border-sky-500/60 text-sky-400",
  screening: "bg-amber-500/20 border-amber-500/60 text-amber-400",
  interview: "bg-violet-500/20 border-violet-500/60 text-violet-400",
  technical: "bg-cyan-500/20 border-cyan-500/60 text-cyan-400",
  offer: "bg-emerald-500/20 border-emerald-500/60 text-emerald-400",
  rejected: "bg-rose-500/20 border-rose-500/60 text-rose-400",
  withdrawn: "bg-muted border-muted-foreground/60 text-muted-foreground",
};

// The subset of statuses that an email event can carry.
// "applied" and "withdrawn" are user-initiated and never come from an email.
export const EVENT_CLASSIFICATION_OPTIONS = [
  "acknowledged",
  "screening",
  "interview",
  "technical",
  "offer",
  "rejected",
] as const;

export type EventClassification = (typeof EVENT_CLASSIFICATION_OPTIONS)[number];
