import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, 
  Calendar, 
  ChevronLeft,
  Briefcase,
  ExternalLink,
  Clock,
  Pencil,
  Check,
  LogOut,
  Loader2,
  ArrowUpRight
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "applied", label: "Applied" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "technical", label: "Technical" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const statusStyles: Record<string, string> = {
  applied: "border-border/40 text-foreground hover:bg-muted",
  acknowledged: "border-blue-500/30 text-blue-400 hover:bg-blue-500/10",
  screening: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10",
  interview: "border-purple-500/30 text-purple-400 hover:bg-purple-500/10",
  technical: "border-orange-500/30 text-orange-400 hover:bg-orange-500/10",
  offer: "border-green-500/30 text-green-400 hover:bg-green-500/10",
  rejected: "border-red-500/30 text-red-400 hover:bg-red-500/10",
  withdrawn: "border-muted-foreground/30 text-muted-foreground hover:bg-muted",
};

const statusStylesActive: Record<string, string> = {
  applied: "bg-foreground/15 border-foreground/60 text-foreground",
  acknowledged: "bg-blue-500/20 border-blue-500/60 text-blue-400",
  screening: "bg-emerald-500/20 border-emerald-500/60 text-emerald-400",
  interview: "bg-purple-500/20 border-purple-500/60 text-purple-400",
  technical: "bg-orange-500/20 border-orange-500/60 text-orange-400",
  offer: "bg-green-500/20 border-green-500/60 text-green-400",
  rejected: "bg-red-500/20 border-red-500/60 text-red-400",
  withdrawn: "bg-muted border-muted-foreground/60 text-muted-foreground",
};

const classificationOptions = [
  "RECRUITMENT_ACK",
  "NEXT_STEP",
  "DISAPPROVAL",
];

const classificationStyles: Record<string, string> = {
  RECRUITMENT_ACK: "border-blue-500/30 text-blue-400 hover:bg-blue-500/10",
  NEXT_STEP: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10",
  DISAPPROVAL: "border-red-500/30 text-red-400 hover:bg-red-500/10",
};

const classificationStylesActive: Record<string, string> = {
  RECRUITMENT_ACK: "bg-blue-500/20 border-blue-500/60 text-blue-400",
  NEXT_STEP: "bg-emerald-500/20 border-emerald-500/60 text-emerald-400",
  DISAPPROVAL: "bg-red-500/20 border-red-500/60 text-red-400",
};

function getGmailUrl(emailId: string | null): string | null {
  if (!emailId) return null;
  return `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(emailId)}`;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function extractName(from: string): string {
  const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
  if (nameMatch) return nameMatch[1].trim();
  const emailMatch = from.match(/([^@]+)@/);
  if (emailMatch) return emailMatch[1];
  return from;
}

export const Route = createFileRoute("/applications/$id")({
  component: ApplicationDetailPage,
});

function ApplicationDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [editingStatus, setEditingStatus] = useState(false);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [jobId, setJobId] = useState("");
  const [currentStatus, setCurrentStatus] = useState("applied");
  const [eventClassificationDrafts, setEventClassificationDrafts] = useState<Record<string, string>>({});
  const [savingEventId, setSavingEventId] = useState<string | null>(null);

  const { data: application, isLoading } = useQuery(
    trpc.jobTracking.getApplicationById.queryOptions({ id })
  );

  useEffect(() => {
    if (!application) return;
    setCompany(application.company);
    setPosition(application.position);
    setJobId(application.jobId || "");
    setCurrentStatus(application.currentStatus);

    const draftMap: Record<string, string> = {};
    for (const event of application.events) {
      draftMap[event.id] = event.classification;
    }
    setEventClassificationDrafts(draftMap);
  }, [application]);

  const updateApplicationMutation = useMutation({
    ...trpc.jobTracking.updateApplication.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplicationById.queryKey({ id }),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplications.queryKey(),
      });
      toast.success("Application updated");
    },
    onError: (error) => {
      toast.error("Failed to update application", {
        description: error.message,
      });
    },
  });

  const updateEventClassificationMutation = useMutation({
    ...trpc.jobTracking.updateEventClassification.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplicationById.queryKey({ id }),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplications.queryKey(),
      });
      toast.success("Classification updated");
    },
    onError: (error) => {
      toast.error("Failed to update classification", {
        description: error.message,
      });
    },
    onSettled: () => {
      setSavingEventId(null);
    },
  });

  const handleSaveApplication = () => {
    if (!application) return;

    updateApplicationMutation.mutate({
      id: application.id,
      company,
      position,
      jobId,
      currentStatus: currentStatus as
        | "applied"
        | "acknowledged"
        | "screening"
        | "interview"
        | "technical"
        | "offer"
        | "rejected"
        | "withdrawn",
    });
  };

  const handleStatusSelect = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setEditingStatus(false);
    
    if (application) {
      updateApplicationMutation.mutate({
        id: application.id,
        company,
        position,
        jobId,
        currentStatus: newStatus as
          | "applied"
          | "acknowledged"
          | "screening"
          | "interview"
          | "technical"
          | "offer"
          | "rejected"
          | "withdrawn",
      });
    }
  };

  const handleSaveEventClassification = (eventId: string) => {
    if (!application) return;
    const nextClassification = eventClassificationDrafts[eventId];
    if (!nextClassification) return;

    setSavingEventId(eventId);
    updateEventClassificationMutation.mutate({
      applicationId: application.id,
      eventId,
      classification: nextClassification as "RECRUITMENT_ACK" | "NEXT_STEP" | "DISAPPROVAL",
    });
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  // Sort events by date (oldest first for timeline)
  const sortedEvents = application?.events 
    ? [...application.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="space-y-4 mt-8">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Application not found</p>
            <Button className="mt-4" onClick={() => navigate({ to: "/" })}>
              Go Back Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col gap-8 mb-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate({ to: "/" })}
                className="text-muted-foreground hover:text-foreground h-9 gap-2 font-mono text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 gap-2 font-mono text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect
              </Button>
            </div>
          </div>

          {/* Application Header */}
          <div className="flex flex-col gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-xl font-medium tracking-tight">
                {application.company}
              </h1>
              <button
                type="button"
                onClick={() => setEditingStatus(!editingStatus)}
                className="flex items-center gap-1.5 group cursor-pointer"
                aria-label="Edit status"
              >
                <StatusBadge status={application.currentStatus} />
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
            <p className="text-muted-foreground text-sm font-mono">
              {application.position}
              {application.jobId && <span className="ml-2">• {application.jobId}</span>}
            </p>

            {/* Status override picker */}
            {editingStatus && (
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  Override status
                </span>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => {
                    const isActive = currentStatus === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => handleStatusSelect(s.value)}
                        disabled={updateApplicationMutation.isPending}
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
          </div>
        </header>

        {/* Edit Form */}
        <div className="rounded-lg border border-border bg-card p-6 mb-8">
          <h2 className="text-sm font-medium text-foreground mb-4">Edit Application</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Company
              </Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="h-8 bg-secondary border-border text-foreground text-xs font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Position
              </Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="h-8 bg-secondary border-border text-foreground text-xs font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobId" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Job ID
              </Label>
              <Input
                id="jobId"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="h-8 bg-secondary border-border text-foreground text-xs font-mono"
              />
            </div>
          </div>

          <div className="mt-4">
            <Button 
              onClick={handleSaveApplication} 
              disabled={updateApplicationMutation.isPending}
              size="sm"
              className="gap-2 bg-foreground text-background hover:bg-foreground/90"
            >
              {updateApplicationMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Application"
              )}
            </Button>
          </div>
        </div>

        {/* Email Timeline */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">
              Email Timeline
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              {sortedEvents.length} emails
            </span>
          </div>

          {sortedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-border rounded-lg bg-card">
              <Mail className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm font-mono">No emails found</p>
            </div>
          ) : (
            <div className="space-y-0">
              {sortedEvents.map((event, index) => {
                const currentClassification = eventClassificationDrafts[event.id] || event.classification;
                const isLast = index === sortedEvents.length - 1;
                
                return (
                  <div
                    key={event.id}
                    className="relative pl-8 pb-8 last:pb-0"
                  >
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-[11px] top-[20px] bottom-0 w-px bg-border" />
                    )}

                    {/* Timeline dot */}
                    <div className="absolute left-0 top-[6px] h-[22px] w-[22px] rounded-full border-2 border-border bg-card flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
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
                            <span className="text-xs font-mono" title={formatDateTime(event.date)}>
                              {formatRelative(event.date)}
                            </span>
                          </div>
                        </div>

                        {/* Classification selector */}
                        <div className="flex items-center gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            {classificationOptions.map((classification) => {
                              const isActive = currentClassification === classification;
                              return (
                                <button
                                  key={classification}
                                  type="button"
                                  onClick={() => {
                                    setEventClassificationDrafts((prev) => ({
                                      ...prev,
                                      [event.id]: classification,
                                    }));
                                    // Auto-save on click
                                    setTimeout(() => handleSaveEventClassification(event.id), 0);
                                  }}
                                  disabled={savingEventId === event.id}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-mono font-medium transition-all cursor-pointer",
                                    isActive
                                      ? classificationStylesActive[classification]
                                      : classificationStyles[classification]
                                  )}
                                >
                                  {savingEventId === event.id && isActive ? (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                  ) : isActive ? (
                                    <Check className="h-2.5 w-2.5" />
                                  ) : null}
                                  {classification.replace("_", " ")}
                                </button>
                              );
                            })}
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
                            href={getGmailUrl(event.emailId) || '#'}
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
          )}
        </div>

        {/* Footer metadata */}
        <div className="pt-6 border-t border-border text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-muted-foreground/70">Applied:</span>{" "}
              <span title={application.events.length > 0 ? formatDateTime(sortedEvents[0].date) : formatDateTime(application.createdAt)}>
                {application.events.length > 0 
                  ? formatRelative(sortedEvents[0].date)
                  : formatRelative(application.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground/70">Source:</span>{" "}
              <span className="capitalize">{application.source}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
