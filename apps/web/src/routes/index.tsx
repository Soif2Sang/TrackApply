import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { useQueryState } from "nuqs";
import { authClient } from "@/lib/auth-client";
import { JobApplicationsTable } from "@/components/job-applications-table";
import { GmailConnection } from "@/components/gmail-connection";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { SignInPage } from "@/components/auth/sign-in-page";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SearchBar } from "@/components/dashboard/search-bar";
import { StatusFilters } from "@/components/dashboard/status-filters";
import { AddApplicationDialog } from "@/components/applications/add-application-dialog";
import { useApplicationFilters } from "@/hooks/use-application-filters";
import { useCreateApplication } from "@/hooks/use-create-application";

export const Route = createFileRoute("/")({
  component: HomeComponent,
  validateSearch: (search: Record<string, unknown>) =>
    z.object({
      q: z.string().optional(),
    }).parse(search),
});

function HomeComponent() {
  const [searchQueryFromUrl, setSearchQueryFromUrl] = useQueryState("q");
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const { data: applications } = useQuery(
    trpc.jobTracking.getApplications.queryOptions()
  );

  const {
    searchQuery,
    setSearchQuery,
    activeStatuses,
    toggleStatus,
    clearFilters,
    hasFilters,
    statusCounts,
    filteredCount,
  } = useApplicationFilters(applications, {
    searchQuery: searchQueryFromUrl ?? "",
    onSearchQueryChange: (nextQuery) => {
      void setSearchQueryFromUrl(nextQuery.trim().length > 0 ? nextQuery : null);
    },
  });

  const createApplication = useCreateApplication();

  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin + "/",
      });
    } catch (error) {
      toast.error(
        "Failed to sign in with Google: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <SignInPage
        onSignIn={handleGoogleSignIn}
        isLoading={isSessionLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Subtle background glow — same as landing page */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/40 via-background to-transparent z-0" />

      <DashboardHeader onSignOut={handleSignOut} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-8 pb-16 flex flex-col gap-6">
        {/* Gmail connection */}
        <div className="rounded-2xl border border-border/60 bg-card/60 shadow-sm overflow-hidden backdrop-blur-sm">
          <GmailConnection />
        </div>

        {/* Toolbar: search + sync + add */}
        <div className="flex flex-col gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={clearFilters}
            hasFilters={hasFilters}
            onAddClick={() => createApplication.setShowDialog(true)}
          />
          <StatusFilters
            activeStatuses={activeStatuses}
            onToggleStatus={toggleStatus}
            onClearAll={clearFilters}
            statusCounts={statusCounts}
            totalCount={applications?.length || 0}
            filteredCount={filteredCount}
            hasFilters={hasFilters}
          />
        </div>

        {/* Applications table */}
        <JobApplicationsTable
          searchQuery={searchQuery}
          statusFilter={Array.from(activeStatuses)}
        />
      </div>

      <AddApplicationDialog
        open={createApplication.showDialog}
        onOpenChange={createApplication.setShowDialog}
        formData={createApplication.formData}
        setters={createApplication.setters}
        isSubmitting={createApplication.isSubmitting}
        isValid={createApplication.isValid}
        onSubmit={createApplication.handleSubmit}
      />
    </div>
  );
}
