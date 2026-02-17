import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import type { ApplicationStatus } from "@/constants/applications";

export function useCreateApplication() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showDialog, setShowDialog] = useState(false);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [jobId, setJobId] = useState("");
  const [source, setSource] = useState("manual");
  const [status, setStatus] = useState<ApplicationStatus>("applied");
  const [appliedDate, setAppliedDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );

  const createMutation = useMutation({
    ...trpc.jobTracking.createApplication.mutationOptions(),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.getApplications.queryKey(),
      });
      toast.success("Application created successfully");
      resetForm();
      setShowDialog(false);
      navigate({ to: "/applications/$id", params: { id: data.applicationId } });
    },
    onError: (error) => {
      toast.error("Failed to create application", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setCompany("");
    setPosition("");
    setJobId("");
    setSource("manual");
    setStatus("applied");
    setAppliedDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = () => {
    if (!company.trim() || !position.trim()) {
      toast.error("Company and position are required");
      return;
    }

    createMutation.mutate({
      company: company.trim(),
      position: position.trim(),
      jobId: jobId.trim() || null,
      source,
      currentStatus: status,
      appliedDate: appliedDate
        ? new Date(appliedDate).toISOString()
        : new Date().toISOString(),
    });
  };

  const isValid = company.trim().length > 0 && position.trim().length > 0;

  return {
    showDialog,
    setShowDialog,
    formData: {
      company,
      position,
      jobId,
      source,
      status,
      appliedDate,
    },
    setters: {
      setCompany,
      setPosition,
      setJobId,
      setSource,
      setStatus,
      setAppliedDate,
    },
    isSubmitting: createMutation.isPending,
    isValid,
    handleSubmit,
  };
}
