"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, ArrowUpRight, Clock, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobApplication } from "@/lib/gmail";

type Status = JobApplication["status"];

const ALL_STATUSES: { value: Status; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "ghosted", label: "Ghosted" },
];

const statusStyles: Record<string, string> = {
  applied: "border-foreground/20 text-foreground hover:bg-foreground/10",
  interview: "border-accent/30 text-accent hover:bg-accent/10",
  offer: "border-accent/30 text-accent hover:bg-accent/10",
  rejected: "border-destructive/30 text-destructive hover:bg-destructive/10",
  ghosted: "border-muted-foreground/30 text-muted-foreground hover:bg-muted",
};

const statusStylesActive: Record<string, string> = {
  applied: "bg-foreground/10 border-foreground/40 text-foreground",
  interview: "bg-accent/15 border-accent/50 text-accent",
  offer: "bg-accent/15 border-accent/50 text-accent",
  rejected: "bg-destructive/15 border-destructive/50 text-destructive",
  ghosted: "bg-muted border-muted-foreground/40 text-muted-foreground",
};

interface EmailThreadSheetProps {
  application: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (applicationId: string, newStatus: Status) => void;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function extractName(from: string): string {
  const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
  if (nameMatch) return nameMatch[1].trim();
  const emailMatch = from.match(/([^@]+)@/);
  if (emailMatch) return emailMatch[1];
  return from;
}

export function EmailThreadSheet({
  application,
  open,
  onOpenChange,
  onStatusChange,
}: EmailThreadSheetProps) {
  const [editing, setEditing] = useState(false);

  if (!application) return null;

  const threadEmails = application.emails;

  const handleStatusSelect = (newStatus: Status) => {
    onStatusChange?.(application.id, newStatus);
    setEditing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg border-border bg-background"
      >
        <SheetHeader className="gap-1 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-foreground text-base font-medium">
              {application.company}
            </SheetTitle>
            <button
              type="button"
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-1.5 group cursor-pointer"
              aria-label="Edit status"
            >
              <StatusBadge status={application.status} />
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
          <SheetDescription className="text-muted-foreground text-sm font-mono">
            {application.position}
          </SheetDescription>

          {/* Status override picker */}
          {editing && (
            <div className="flex flex-col gap-2 pt-4">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                Override status
              </span>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((s) => {
                  const isActive = application.status === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => handleStatusSelect(s.value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-mono font-medium transition-all cursor-pointer",
                        isActive
                          ? statusStylesActive[s.value]
                          : statusStyles[s.value]
                      )}
                    >
                      {isActive && <Check className="h-3 w-3" />}
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-6 pr-2">
          {threadEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Mail className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm">No emails found in this thread</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {threadEmails.map((email, index) => (
                <div
                  key={email.id}
                  className="relative pl-6 pb-6 last:pb-0"
                >
                  {/* Timeline line */}
                  {index < threadEmails.length - 1 && (
                    <div className="absolute left-[7px] top-[18px] bottom-0 w-px bg-border" />
                  )}

                  {/* Timeline dot */}
                  <div className="absolute left-0 top-[6px] h-[14px] w-[14px] rounded-full border-2 border-border bg-background flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {extractName(email.from)}
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs font-mono">
                        {formatDate(email.date)}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-foreground/80 mt-0.5">
                      {email.subject}
                    </p>

                    <p className="text-xs text-muted-foreground leading-relaxed mt-1 bg-muted/50 rounded-md p-3">
                      {email.snippet}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
