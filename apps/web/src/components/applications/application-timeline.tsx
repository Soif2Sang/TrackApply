import { Mail, Clock, ArrowUpRight, ExternalLink, Check, GitBranch } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  getGmailUrl,
  formatRelative,
  formatDateTime,
  extractName,
} from "@/lib/date-utils";
import {
  CLASSIFICATION_OPTIONS,
  CLASSIFICATION_STYLES,
  CLASSIFICATION_STYLES_ACTIVE,
} from "@/constants/applications";

interface Event {
  id: string;
  from: string;
  subject: string;
  date: string;
  emailId: string | null;
  classification: string;
}

interface ApplicationTimelineProps {
  events: Event[];
  classificationDrafts: Record<string, string>;
  isSaving: boolean;
  onClassificationChange: (eventId: string, classification: string) => void;
  onSaveClassification: (eventId: string, classification?: string) => void;
  onDivergeEvent?: (eventId: string) => void;
  isDiverging?: boolean;
}

const DOT_COLOR: Record<string, string> = {
  RECRUITMENT_ACK: "bg-blue-400",
  NEXT_STEP: "bg-emerald-400",
  DISAPPROVAL: "bg-red-400",
};

const RING_COLOR: Record<string, string> = {
  RECRUITMENT_ACK: "border-blue-400/40",
  NEXT_STEP: "border-emerald-400/40",
  DISAPPROVAL: "border-red-400/40",
};

export function ApplicationTimeline({
  events,
  classificationDrafts,
  isSaving,
  onClassificationChange,
  onSaveClassification,
  onDivergeEvent,
  isDiverging,
}: ApplicationTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedEvents.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/30 flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Mail className="h-8 w-8 mb-3 opacity-40" />
        <p className="text-sm">No emails found</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/30 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-foreground">Email Timeline</h2>
        <span className="text-xs text-muted-foreground">
          {sortedEvents.length} emails
        </span>
      </div>

      <div className="space-y-0">
        {sortedEvents.map((event, index) => {
          const currentClassification =
            classificationDrafts[event.id] || event.classification;
          const isLast = index === sortedEvents.length - 1;
          const dotColor = DOT_COLOR[currentClassification] ?? "bg-muted-foreground";
          const ringColor = RING_COLOR[currentClassification] ?? "border-border";

          return (
            <div key={event.id} className="relative pl-8 pb-8 last:pb-0">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-[11px] top-[20px] bottom-0 w-px bg-border" />
              )}

              {/* Timeline dot */}
              <div className={cn(
                "absolute left-0 top-[6px] h-[22px] w-[22px] rounded-full border-2 bg-card flex items-center justify-center transition-colors",
                ringColor
              )}>
                <div className={cn("h-2 w-2 rounded-full transition-colors", dotColor)} />
              </div>

              <div className="flex flex-col gap-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {extractName(event.from)}
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span
                        className="text-xs font-mono"
                        title={formatDateTime(event.date)}
                      >
                        {formatRelative(event.date)}
                      </span>
                    </div>
                  </div>

                  {/* Classification selector */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {CLASSIFICATION_OPTIONS.map((classification) => {
                        const isActive = currentClassification === classification;
                        return (
                          <button
                            key={classification}
                            type="button"
                            onClick={() => {
                              onClassificationChange(event.id, classification);
                              setTimeout(
                                () => onSaveClassification(event.id, classification),
                                0
                              );
                            }}
                            disabled={isSaving}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-mono font-medium transition-all cursor-pointer",
                              isActive
                                ? CLASSIFICATION_STYLES_ACTIVE[classification]
                                : CLASSIFICATION_STYLES[classification]
                            )}
                          >
                            {isActive ? (
                              <Check className="h-2.5 w-2.5" />
                            ) : null}
                            {classification.replace("_", " ")}
                          </button>
                        );
                      })}
                      {onDivergeEvent && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onDivergeEvent(event.id)}
                              disabled={isDiverging || isSaving}
                              className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 px-2 py-1 text-[10px] font-mono font-medium transition-all cursor-pointer disabled:opacity-50"
                            >
                              <GitBranch className="h-2.5 w-2.5" />
                              Diverge
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-64 text-center leading-relaxed">
                            The pipeline sometimes groups emails from different
                            jobs under one application. Diverge moves this email
                            into a brand-new, separate application.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {event.subject}
                  </p>
                  {event.emailId && (
                    <a
                      href={getGmailUrl(event.emailId) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Open in Gmail"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
