import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export function useMergeTargets(currentApplicationId: string) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allApplications } = useQuery(
    trpc.jobTracking.getApplications.queryOptions()
  );

  const availableTargets = useMemo(() => {
    return allApplications?.filter((app) => app.id !== currentApplicationId) || [];
  }, [allApplications, currentApplicationId]);

  const filteredTargets = useMemo(() => {
    if (!searchQuery) return availableTargets;
    const query = searchQuery.toLowerCase();
    return availableTargets.filter(
      (app) =>
        app.company?.toLowerCase().includes(query) ||
        app.position?.toLowerCase().includes(query)
    );
  }, [availableTargets, searchQuery]);

  return {
    availableTargets,
    filteredTargets,
    searchQuery,
    setSearchQuery,
    hasTargets: availableTargets.length > 0,
  };
}
