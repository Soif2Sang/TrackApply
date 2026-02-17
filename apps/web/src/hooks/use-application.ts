import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

interface ApplicationState {
  currentStatus: string;
  eventClassificationDrafts: Record<string, string>;
}

export function useApplication(applicationId: string) {
  const [state, setState] = useState<ApplicationState>({
    currentStatus: "applied",
    eventClassificationDrafts: {},
  });
  const [editingStatus, setEditingStatus] = useState(false);

  const { data: application, isLoading } = useQuery(
    trpc.jobTracking.getApplicationById.queryOptions({ id: applicationId })
  );

  useEffect(() => {
    if (!application) return;

    const draftMap: Record<string, string> = {};
    for (const event of application.events) {
      draftMap[event.id] = event.classification;
    }

    setState({
      currentStatus: application.currentStatus,
      eventClassificationDrafts: draftMap,
    });
  }, [application]);

  const updateEventClassification = (eventId: string, classification: string) => {
    setState((prev) => ({
      ...prev,
      eventClassificationDrafts: {
        ...prev.eventClassificationDrafts,
        [eventId]: classification,
      },
    }));
  };

  return {
    application,
    isLoading,
    state,
    editingStatus,
    setEditingStatus,
    updateEventClassification,
  };
}
