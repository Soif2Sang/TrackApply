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
  acknowledged: "border-blue-500/30 text-blue-400 hover:bg-blue-500/10",
  screening: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10",
  interview: "border-purple-500/30 text-purple-400 hover:bg-purple-500/10",
  technical: "border-orange-500/30 text-orange-400 hover:bg-orange-500/10",
  offer: "border-green-500/30 text-green-400 hover:bg-green-500/10",
  rejected: "border-red-500/30 text-red-400 hover:bg-red-500/10",
  withdrawn: "border-muted-foreground/30 text-muted-foreground hover:bg-muted",
};

export const STATUS_STYLES_ACTIVE: Record<string, string> = {
  applied: "bg-foreground/15 border-foreground/60 text-foreground",
  acknowledged: "bg-blue-500/20 border-blue-500/60 text-blue-400",
  screening: "bg-emerald-500/20 border-emerald-500/60 text-emerald-400",
  interview: "bg-purple-500/20 border-purple-500/60 text-purple-400",
  technical: "bg-orange-500/20 border-orange-500/60 text-orange-400",
  offer: "bg-green-500/20 border-green-500/60 text-green-400",
  rejected: "bg-red-500/20 border-red-500/60 text-red-400",
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
