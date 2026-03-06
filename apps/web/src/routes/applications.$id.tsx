import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronLeft,
  Building2,
  Briefcase,
  Calendar,
  Mail,
  Clock,
  ExternalLink,
  MapPin,
  DollarSign,
  LinkIcon,
  MoreHorizontal,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Users,
  Code,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/applications/$id")({
  component: ApplicationDetailPage,
});

// Mock data - bypassing auth and database
const MOCK_APPLICATION = {
  id: "mock-1",
  company: "Vercel",
  position: "Senior Frontend Engineer",
  jobId: "VER-2024-001",
  location: "San Francisco, CA (Remote)",
  salary: "$180,000 - $220,000",
  jobUrl: "https://vercel.com/careers",
  source: "LinkedIn",
  currentStatus: "interview",
  createdAt: "2024-01-15T10:30:00Z",
  events: [
    {
      id: "evt-1",
      type: "applied",
      title: "Application Submitted",
      description: "You applied for this position through LinkedIn Easy Apply",
      date: "2024-01-15T10:30:00Z",
      from: "no-reply@linkedin.com",
      subject: "Application received - Senior Frontend Engineer at Vercel",
      emailId: "email-1",
      classification: "applied",
    },
    {
      id: "evt-2",
      type: "acknowledged",
      title: "Application Acknowledged",
      description: "Thank you for your interest in Vercel. We've received your application.",
      date: "2024-01-16T14:22:00Z",
      from: "careers@vercel.com",
      subject: "Thank you for applying to Vercel",
      emailId: "email-2",
      classification: "acknowledged",
    },
    {
      id: "evt-3",
      type: "screening",
      title: "Recruiter Screen Scheduled",
      description: "We'd love to learn more about you. Please find a time that works for a 30-minute call.",
      date: "2024-01-22T09:15:00Z",
      from: "Sarah Chen <sarah.chen@vercel.com>",
      subject: "Vercel Interview - Recruiter Screening",
      emailId: "email-3",
      classification: "screening",
    },
    {
      id: "evt-4",
      type: "interview",
      title: "Technical Interview",
      description: "Following your great conversation with Sarah, we'd like to invite you to a technical interview.",
      date: "2024-01-29T11:00:00Z",
      from: "Sarah Chen <sarah.chen@vercel.com>",
      subject: "Next Steps - Technical Interview at Vercel",
      emailId: "email-4",
      classification: "interview",
    },
  ],
};

const EVENT_ICONS: Record<string, React.ElementType> = {
  applied: Send,
  acknowledged: CheckCircle2,
  screening: Users,
  interview: Users,
  technical: Code,
  offer: Award,
  rejected: XCircle,
};

const EVENT_COLORS: Record<string, { dot: string; bg: string; border: string; text: string }> = {
  applied: {
    dot: "bg-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    text: "text-blue-600",
  },
  acknowledged: {
    dot: "bg-sky-500",
    bg: "bg-sky-500/5",
    border: "border-sky-500/20",
    text: "text-sky-600",
  },
  screening: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-600",
  },
  interview: {
    dot: "bg-violet-500",
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
    text: "text-violet-600",
  },
  technical: {
    dot: "bg-cyan-500",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/20",
    text: "text-cyan-600",
  },
  offer: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    text: "text-emerald-600",
  },
  rejected: {
    dot: "bg-rose-500",
    bg: "bg-rose-500/5",
    border: "border-rose-500/20",
    text: "text-rose-600",
  },
};

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  acknowledged: "Acknowledged",
  screening: "Screening",
  interview: "Interview",
  technical: "Technical",
  offer: "Offer",
  rejected: "Rejected",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getDaysAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function ApplicationDetailPage() {
  const navigate = useNavigate();
  const application = MOCK_APPLICATION;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to applications
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Company Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-5">
              {/* Company Logo Placeholder */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground text-background">
                <Building2 className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {application.company}
                  </h1>
                  <StatusPill status={application.currentStatus} />
                </div>

                <p className="text-lg text-muted-foreground">
                  {application.position}
                </p>

                <div className="flex items-center gap-4 pt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {application.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    {application.salary}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content - Timeline */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Activity Timeline
                </h2>
                <span className="text-xs text-muted-foreground">
                  {application.events.length} events
                </span>
              </div>

              <div className="space-y-0">
                {application.events.map((event, index) => {
                  const colors = EVENT_COLORS[event.classification] || EVENT_COLORS.applied;
                  const Icon = EVENT_ICONS[event.classification] || Mail;
                  const isLast = index === application.events.length - 1;

                  return (
                    <div key={event.id} className="relative pb-8 last:pb-0">
                      {/* Connector Line */}
                      {!isLast && (
                        <div className="absolute left-5 top-12 h-[calc(100%-32px)] w-px bg-border" />
                      )}

                      <div className="flex gap-4">
                        {/* Icon */}
                        <div
                          className={cn(
                            "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                            colors.bg,
                            colors.border
                          )}
                        >
                          <Icon className={cn("h-4 w-4", colors.text)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-medium text-foreground">
                                {event.title}
                              </h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {event.description}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-medium text-foreground">
                                {formatDate(event.date)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTime(event.date)}
                              </p>
                            </div>
                          </div>

                          {/* Email Card */}
                          <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {event.subject}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  From: {event.from}
                                </p>
                              </div>
                              <a
                                href="#"
                                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                                title="Open in Gmail"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Details Card */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Details
              </h2>

              <div className="space-y-4">
                <DetailRow
                  icon={Briefcase}
                  label="Job ID"
                  value={application.jobId}
                />
                <DetailRow
                  icon={Calendar}
                  label="Applied"
                  value={formatDate(application.createdAt)}
                  subValue={getDaysAgo(application.createdAt)}
                />
                <DetailRow
                  icon={LinkIcon}
                  label="Source"
                  value={application.source}
                />
                <DetailRow
                  icon={Mail}
                  label="Last Activity"
                  value={formatDate(application.events[application.events.length - 1].date)}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </h2>

              <div className="space-y-2">
                <ActionButton icon={ExternalLink} label="View Job Posting" />
                <ActionButton icon={Edit3} label="Edit Application" />
                <ActionButton
                  icon={Trash2}
                  label="Delete Application"
                  variant="destructive"
                />
              </div>
            </div>

            {/* Status Legend */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Status Legend
              </h2>

              <div className="space-y-2.5">
                {Object.entries(EVENT_COLORS).map(([status, colors]) => (
                  <div key={status} className="flex items-center gap-2.5">
                    <div className={cn("h-2 w-2 rounded-full", colors.dot)} />
                    <span className="text-sm text-muted-foreground capitalize">
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors = EVENT_COLORS[status] || EVENT_COLORS.applied;
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        colors.bg,
        colors.border,
        colors.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {label}
    </span>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  variant?: "default" | "destructive";
}) {
  const variantClasses = {
    default:
      "text-foreground hover:bg-muted",
    destructive:
      "text-rose-600 hover:bg-rose-500/10",
  };

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        variantClasses[variant]
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
