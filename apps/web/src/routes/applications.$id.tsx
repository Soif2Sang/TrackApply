import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useApplication } from "@/hooks/use-application";
import { useApplicationMutations } from "@/hooks/use-application-mutations";
import { useMergeTargets } from "@/hooks/use-merge-targets";
import { PageHeader } from "@/components/applications/page-header";
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
    editingStatus,
    setEditingStatus,
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

  const handleSaveApplication = (values: { company: string; position: string; jobId: string }) => {
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
    setEditingStatus(false);
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
      classification: nextClassification as "RECRUITMENT_ACK" | "NEXT_STEP" | "DISAPPROVAL",
    });
  };

  const handleMerge = (targetId: string) => {
    if (!application) return;
    mutations.mergeApplications({
      sourceApplicationId: application.id,
      targetApplicationId: targetId,
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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex flex-col gap-8 mb-10">
          <PageHeader
            onBack={() => navigate({ to: "/" })}
            onSignOut={handleSignOut}
          />

          <ApplicationHeader
            company={application.company}
            position={application.position}
            jobId={application.jobId}
            currentStatus={state.currentStatus}
            editingStatus={editingStatus}
            isPending={mutations.updateApplicationPending}
            onToggleStatus={() => setEditingStatus(!editingStatus)}
            onStatusSelect={handleStatusSelect}
          />
        </header>

        <ApplicationForm
          initialValues={{
            company: application.company,
            position: application.position,
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
          onConfirm={() => {
            const targetId = mergeTargets.filteredTargets.find(
              (t) => t.id !== id
            )?.id;
            if (targetId) handleMerge(targetId);
          }}
          targets={mergeTargets.filteredTargets}
          searchQuery={mergeTargets.searchQuery}
          onSearchChange={mergeTargets.setSearchQuery}
          currentCompany={application.company}
          currentPosition={application.position}
          isPending={mutations.mergeApplicationsPending}
          hasTargets={mergeTargets.hasTargets}
        />
      </div>
    </div>
  );
}
