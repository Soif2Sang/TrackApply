import { cn } from "@/lib/utils";
import { ALL_STATUSES } from "@/constants/applications";

interface StatusFiltersProps {
  activeStatuses: Set<string>;
  onToggleStatus: (status: string) => void;
  onClearAll: () => void;
  statusCounts: Record<string, number>;
  totalCount: number;
  filteredCount: number;
  hasFilters: boolean;
}

export function StatusFilters({
  activeStatuses,
  onToggleStatus,
  onClearAll,
  statusCounts,
  totalCount,
  filteredCount,
  hasFilters,
}: StatusFiltersProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={onClearAll}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono transition-colors",
          activeStatuses.size === 0
            ? "bg-foreground text-background"
            : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        aria-label="Show all applications"
        aria-pressed={activeStatuses.size === 0}
      >
        <span className="capitalize">All</span>
        <span
          className={cn(
            "tabular-nums",
            activeStatuses.size === 0
              ? "text-background/70"
              : "text-muted-foreground/50"
          )}
        >
          {totalCount}
        </span>
      </button>

      {ALL_STATUSES.map((status) => {
        const isActive = activeStatuses.has(status);
        const count = statusCounts[status] || 0;
        if (count === 0) return null;

        return (
          <button
            key={status}
            onClick={() => onToggleStatus(status)}
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

      {hasFilters && (
        <span className="text-xs text-muted-foreground font-mono ml-2">
          {filteredCount} of {totalCount} applications
        </span>
      )}
    </div>
  );
}
