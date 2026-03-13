import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useApplication } from "@/hooks/use-application";
import { useApplicationMutations } from "@/hooks/use-application-mutations";
import { useMergeTargets } from "@/hooks/use-merge-targets";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ApplicationHeader } from "@/components/applications/application-header";
import { ApplicationForm } from "@/components/applications/application-form";
import { ApplicationTimeline } from "@/components/applications/application-timeline";
import { ApplicationMetadata } from "@/components/applications/application-metadata";
import { DeleteDialog } from "@/components/applications/delete-dialog";
import { MergeDialog } from "@/components/applications/merge-dialog";
import { LoadingState, NotFoundState } from "@/components/applications/application-states";
import type { ApplicationStatus } from "@/constants/applications";

export const Route = createFileRoute("/applications/$id")({
  component: ApplicationDetailPage,
});

function ApplicationDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [ignoreEmails, setIgnoreEmails] = useState(false);

  const {
    application,
    isLoading,
    state,
    updateEventClassification,
  } = useApplication(id);

  const mutations = useApplicationMutations(
    id,
    () => navigate({ to: "/" }),
    (newId: string) => navigate({ to: `/applications/${newId}` })
  );
  const mergeTargets = useMergeTargets(id);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const handleSaveApplication = (values: { company: string | null; position: string | null; jobId: string }) => {
    if (!application) return;
    mutations.updateApplication({
      id: application.id,
      company: values.company,
      position: values.position,
      jobId: values.jobId,
      currentStatus: state.currentStatus as ApplicationStatus,
    });
  };

  const handleStatusSelect = (newStatus: string) => {
    if (application) {
      mutations.updateApplication({
        id: application.id,
        company: application.company,
        position: application.position,
        jobId: application.jobId || "",
        currentStatus: newStatus as ApplicationStatus,
      });
    }
  };

  const handleSaveEventClassification = (eventId: string, classification?: string) => {
    if (!application) return;
    const nextClassification = classification || state.eventClassificationDrafts[eventId];
    if (!nextClassification) return;

    mutations.updateEventClassification({
      applicationId: application.id,
      eventId,
      classification: nextClassification as "acknowledged" | "screening" | "interview" | "technical" | "offer" | "rejected",
    });
  };

  const handleMergeIntoCurrentApplication = (absorbedApplicationIds: string[]) => {
    if (!application) return;
    const keptApplicationId = application.id;

    mutations.mergeApplications({
      absorbedApplicationIds,
      keptApplicationId,
    });
  };

  const handleDiverge = (eventId: string) => {
    if (!application) return;
    mutations.divergeEvent({
      sourceApplicationId: application.id,
      eventId,
    });
  };

  if (isLoading) {
    return <LoadingState onBack={() => navigate({ to: "/" })} />;
  }

  if (!application) {
    return <NotFoundState onBack={() => navigate({ to: "/" })} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/40 via-background to-transparent z-0" />

      <DashboardHeader onSignOut={handleSignOut} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-8 pb-16 flex flex-col gap-6">
        <ApplicationHeader
          company={application.company}
          position={application.position}
          jobId={application.jobId}
          currentStatus={state.currentStatus}
          isPending={mutations.updateApplicationPending}
          onBack={() => navigate({ to: "/" })}
          onStatusSelect={handleStatusSelect}
        />

        <ApplicationForm
          initialValues={{
            company: application.company ?? null,
            position: application.position ?? null,
            jobId: application.jobId || "",
          }}
          onSave={handleSaveApplication}
          onMerge={() => setShowMergeDialog(true)}
          onDelete={() => setShowDeleteDialog(true)}
          isSavePending={mutations.updateApplicationPending}
          isMergePending={mutations.mergeApplicationsPending}
          isDeletePending={mutations.deleteApplicationPending}
        />

        <ApplicationTimeline
          events={application.events}
          classificationDrafts={state.eventClassificationDrafts}
          isSaving={mutations.updateEventClassificationPending}
          onClassificationChange={updateEventClassification}
          onSaveClassification={handleSaveEventClassification}
          onDivergeEvent={handleDiverge}
          isDiverging={mutations.divergeEventPending}
        />

        <ApplicationMetadata application={application} />
      </div>

      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) setIgnoreEmails(false);
        }}
        onConfirm={() => mutations.deleteApplication({ id: application.id, ignoreEmails })}
        company={application.company}
        isPending={mutations.deleteApplicationPending}
        ignoreEmails={ignoreEmails}
        onIgnoreEmailsChange={setIgnoreEmails}
      />

      <MergeDialog
        open={showMergeDialog}
        onOpenChange={setShowMergeDialog}
        onConfirm={handleMergeIntoCurrentApplication}
        absorbedApplicationCandidates={mergeTargets.filteredTargets}
        searchQuery={mergeTargets.searchQuery}
        onSearchChange={mergeTargets.setSearchQuery}
        currentCompany={application.company}
        currentPosition={application.position}
        isPending={mutations.mergeApplicationsPending}
        hasTargets={mergeTargets.hasTargets}
      />
    </div>
  );
}
