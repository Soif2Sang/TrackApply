import { createFileRoute } from "@tanstack/react-router";
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
});

function HomeComponent() {
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
  } = useApplicationFilters(applications);

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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex flex-col gap-8 mb-10">
          <DashboardHeader onSignOut={handleSignOut} />

          <section aria-label="Gmail connection">
            <GmailConnection />
          </section>

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
        </header>

        <section aria-label="Applications list">
          <JobApplicationsTable
            searchQuery={searchQuery}
            statusFilter={Array.from(activeStatuses)}
          />
        </section>
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
