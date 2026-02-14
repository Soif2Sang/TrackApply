import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { JobApplicationsTable } from "@/components/job-applications-table";
import { EmailSyncButton } from "@/components/email-sync-button";
import { GmailConnection } from "@/components/gmail-connection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, LogOut, Loader2, Zap, Search, X } from "lucide-react";
import { toast } from "sonner";
import { StatsBar } from "@/components/stats-bar";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const ALL_STATUSES = ["applied", "acknowledged", "screening", "interview", "technical", "offer", "rejected", "withdrawn"] as const;

function HomeComponent() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const { data: applications } = useQuery(trpc.jobTracking.getApplications.queryOptions());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(new Set());

  const statusCounts = useMemo(() => {
    if (!applications) return {} as Record<string, number>;
    return ALL_STATUSES.reduce((acc, status) => {
      acc[status] = applications.filter((app) => app.currentStatus === status).length;
      return acc;
    }, {} as Record<string, number>);
  }, [applications]);

  const toggleStatus = (status: string) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveStatuses(new Set());
  };

  const hasFilters = searchQuery.length > 0 || activeStatuses.size > 0;

  const handleGoogleSignIn = async () => {
    try {
      console.log("Starting Google sign-in...");
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin + "/",
      });
      console.log("Sign-in result:", result);
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Failed to sign in with Google: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6 border border-border">
              <Briefcase className="h-8 w-8 text-foreground" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">JobPulse</h1>
            <p className="text-muted-foreground">
              Automatically track your job applications from email responses
            </p>
          </div>
          
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium text-foreground">
                1
              </div>
              <p>Connect your Gmail account via n8n workflow</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium text-foreground">
                2
              </div>
              <p>AI automatically classifies emails (RECRUITMENT_ACK, NEXT_STEP, DISAPPROVAL)</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium text-foreground">
                3
              </div>
              <p>Track all your applications in one dashboard</p>
            </div>
          </div>

          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleGoogleSignIn();
            }}
            className="w-full"
            size="lg"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>
          
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-mono">
              <Zap className="h-3 w-3" />
              <span>
                Uses Gmail API read-only access. No emails are stored on any server.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex flex-col gap-8 mb-10">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-foreground text-xl font-medium tracking-tight">
                  JobPulse
                </h1>
                <span className="flex items-center gap-1.5 text-accent text-xs font-mono">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </span>
                  Connected
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Track job applications from your Gmail inbox
              </p>
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

          <section aria-label="Gmail connection">
            <GmailConnection />
          </section>

          <div className="flex items-center justify-between">
            <StatsBar applications={applications || []} />
            <EmailSyncButton />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search company or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 bg-secondary border-border text-foreground text-xs font-mono placeholder:text-muted-foreground/60"
                  aria-label="Search applications"
                />
              </div>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground font-mono gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {ALL_STATUSES.map((status) => {
                const isActive = activeStatuses.has(status);
                const count = statusCounts[status] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono transition-colors",
                      isActive
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    aria-label={`Filter by ${status}`}
                    aria-pressed={isActive}
                  >
                    <span className="capitalize">{status}</span>
                    <span
                      className={cn(
                        "tabular-nums",
                        isActive ? "text-background/70" : "text-muted-foreground/50"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {hasFilters && (
              <span className="text-xs text-muted-foreground font-mono">
                {applications ? applications.filter((app) => {
                  const matchesSearch = !searchQuery || 
                    app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.position.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesStatus = activeStatuses.size === 0 || activeStatuses.has(app.currentStatus);
                  return matchesSearch && matchesStatus;
                }).length : 0} of {applications?.length || 0} applications
              </span>
            )}
          </div>
        </header>

        <section aria-label="Applications list">
          <JobApplicationsTable searchQuery={searchQuery} statusFilter={Array.from(activeStatuses)} />
        </section>
      </div>
    </div>
  );
}
