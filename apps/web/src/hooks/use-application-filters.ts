import { useState, useMemo } from "react";

interface Application {
  id: string;
  company: string;
  position: string;
  jobId: string | null;
  currentStatus: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  appliedAt: string;
  lastUpdateAt: string;
}

export function useApplicationFilters(applications: Application[] | undefined) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(new Set());

  const statusCounts = useMemo(() => {
    if (!applications) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    applications.forEach((app) => {
      counts[app.currentStatus] = (counts[app.currentStatus] || 0) + 1;
    });
    return counts;
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

  const filteredCount = useMemo(() => {
    if (!applications) return 0;
    return applications.filter((app) => {
      const matchesSearch =
        !searchQuery ||
        app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        activeStatuses.size === 0 || activeStatuses.has(app.currentStatus);
      return matchesSearch && matchesStatus;
    }).length;
  }, [applications, searchQuery, activeStatuses]);

  return {
    searchQuery,
    setSearchQuery,
    activeStatuses,
    setActiveStatuses,
    statusCounts,
    toggleStatus,
    clearFilters,
    hasFilters,
    filteredCount,
  };
}
