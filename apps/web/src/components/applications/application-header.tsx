import { Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { STATUS_OPTIONS, STATUS_STYLES, STATUS_STYLES_ACTIVE } from "@/constants/applications";

interface ApplicationHeaderProps {
  company: string;
  position: string;
  jobId: string | null;
  currentStatus: string;
  editingStatus: boolean;
  isPending: boolean;
  onToggleStatus: () => void;
  onStatusSelect: (status: string) => void;
}

export function ApplicationHeader({
  company,
  position,
  jobId,
  currentStatus,
  editingStatus,
  isPending,
  onToggleStatus,
  onStatusSelect,
}: ApplicationHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-6 border-b border-border">
      <div className="flex items-center gap-3">
        <h1 className="text-foreground text-xl font-medium tracking-tight">
          {company}
        </h1>
        <button
          type="button"
          onClick={onToggleStatus}
          className="flex items-center gap-1.5 group cursor-pointer"
          aria-label="Edit status"
        >
          <StatusBadge status={currentStatus} />
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
      <p className="text-muted-foreground text-sm font-mono">
        {position}
        {jobId && <span className="ml-2">• {jobId}</span>}
      </p>

      {editingStatus && (
        <div className="flex flex-col gap-2 pt-2">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            Override status
          </span>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => {
              const isActive = currentStatus === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => onStatusSelect(s.value)}
                  disabled={isPending}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-mono font-medium transition-all cursor-pointer",
                    isActive ? STATUS_STYLES_ACTIVE[s.value] : STATUS_STYLES[s.value]
                  )}
                >
                  {isActive && <Check className="h-3 w-3" />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
