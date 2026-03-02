import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import type { ApplicationStatus } from "@/constants/applications";

export function useApplicationMutations(
  applicationId: string,
  onNavigateHome: () => void,
  onNavigateToApplication: (id: string) => void
) {
  const queryClient = useQueryClient();

  const updateApplicationMutation = useMutation({
    ...trpc.jobTracking.updateApplication.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplicationById.queryKey({ id: applicationId }),
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

  const deleteApplicationMutation = useMutation({
    ...trpc.jobTracking.deleteApplication.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplications.queryKey(),
      });
      toast.success("Application deleted");
      onNavigateHome();
    },
    onError: (error) => {
      toast.error("Failed to delete application", {
        description: error.message,
      });
    },
  });

  const mergeApplicationsMutation = useMutation({
    ...trpc.jobTracking.mergeApplications.mutationOptions(),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplications.queryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplicationById.queryKey({ id: data.targetApplicationId }),
      });
      toast.success("Applications merged successfully", {
        description: `Moved ${data.eventsMoved} events to the target application`,
      });
      onNavigateHome();
    },
    onError: (error) => {
      toast.error("Failed to merge applications", {
        description: error.message,
      });
    },
  });

  const updateEventClassificationMutation = useMutation({
    ...trpc.jobTracking.updateEventClassification.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplicationById.queryKey({ id: applicationId }),
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
  });

  const divergeEventMutation = useMutation({
    ...trpc.jobTracking.divergeEvent.mutationOptions(),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplications.queryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplicationById.queryKey({ id: applicationId }),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplicationById.queryKey({ id: data.newApplicationId }),
      });
      toast.success("Event diverged to new application", {
        description: "The email has been moved to a new application.",
      });
      onNavigateToApplication(data.newApplicationId);
    },
    onError: (error) => {
      toast.error("Failed to diverge event", {
        description: error.message,
      });
    },
  });

  const isPending =
    updateApplicationMutation.isPending ||
    deleteApplicationMutation.isPending ||
    mergeApplicationsMutation.isPending ||
    updateEventClassificationMutation.isPending ||
    divergeEventMutation.isPending;

  return {
    updateApplication: updateApplicationMutation.mutate,
    deleteApplication: deleteApplicationMutation.mutate,
    mergeApplications: mergeApplicationsMutation.mutate,
    updateEventClassification: updateEventClassificationMutation.mutate,
    divergeEvent: divergeEventMutation.mutate,
    isPending,
    updateApplicationPending: updateApplicationMutation.isPending,
    deleteApplicationPending: deleteApplicationMutation.isPending,
    mergeApplicationsPending: mergeApplicationsMutation.isPending,
    updateEventClassificationPending: updateEventClassificationMutation.isPending,
    divergeEventPending: divergeEventMutation.isPending,
  };
}
