import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ChevronRight, Briefcase, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

// Mock applications - bypassing auth and database
const MOCK_APPLICATIONS = [
  {
    id: "mock-1",
    company: "Vercel",
    position: "Senior Frontend Engineer",
    location: "San Francisco, CA",
    status: "interview",
    appliedDate: "2024-01-15",
    lastActivity: "2024-01-29",
  },
  {
    id: "mock-2",
    company: "Stripe",
    position: "Staff Software Engineer",
    location: "Remote",
    status: "screening",
    appliedDate: "2024-01-20",
    lastActivity: "2024-01-25",
  },
  {
    id: "mock-3",
    company: "Linear",
    position: "Product Engineer",
    location: "San Francisco, CA",
    status: "applied",
    appliedDate: "2024-01-28",
    lastActivity: "2024-01-28",
  },
  {
    id: "mock-4",
    company: "Notion",
    position: "Senior Full Stack Engineer",
    location: "New York, NY",
    status: "offer",
    appliedDate: "2024-01-10",
    lastActivity: "2024-02-01",
  },
  {
    id: "mock-5",
    company: "Figma",
    position: "Design Engineer",
    location: "San Francisco, CA",
    status: "rejected",
    appliedDate: "2024-01-05",
    lastActivity: "2024-01-22",
  },
];

const STATUS_COLORS: Record<string, { dot: string; bg: string; border: string; text: string }> = {
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
  });
}

function HomeComponent() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <Briefcase className="h-4 w-4 text-background" />
            </div>
            <span className="text-lg font-semibold tracking-tight">TrackApply</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Demo Mode
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Your Applications
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track and manage your job applications in one place.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={MOCK_APPLICATIONS.length} />
          <StatCard
            label="In Progress"
            value={MOCK_APPLICATIONS.filter(a => !["rejected", "offer"].includes(a.status)).length}
            color="text-blue-600"
          />
          <StatCard
            label="Interviews"
            value={MOCK_APPLICATIONS.filter(a => a.status === "interview").length}
            color="text-violet-600"
          />
          <StatCard
            label="Offers"
            value={MOCK_APPLICATIONS.filter(a => a.status === "offer").length}
            color="text-emerald-600"
          />
        </div>

        {/* Applications List */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Recent Applications
            </h2>
          </div>

          <div className="divide-y divide-border">
            {MOCK_APPLICATIONS.map((app) => {
              const colors = STATUS_COLORS[app.status] || STATUS_COLORS.applied;

              return (
                <Link
                  key={app.id}
                  to="/applications/$id"
                  params={{ id: app.id }}
                  className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                >
                  {/* Company Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Main Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="truncate font-medium text-foreground">
                        {app.company}
                      </h3>
                      <StatusPill status={app.status} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {app.position}
                    </p>
                    <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {app.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Applied {formatDate(app.appliedDate)}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", color || "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.applied;
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
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
