import { ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StatusBadge, statusConfig } from "@/components/status-badge";
import { STATUS_OPTIONS } from "@/constants/applications";

interface ApplicationHeaderProps {
  company: string;
  position: string;
  jobId: string | null;
  currentStatus: string;
  isPending: boolean;
  onBack: () => void;
  onStatusSelect: (status: string) => void;
}

export function ApplicationHeader({
  company,
  position,
  jobId,
  currentStatus,
  isPending,
  onBack,
  onStatusSelect,
}: ApplicationHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="w-fit flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to applications
      </button>

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {company}
        </h1>

        <Select
          value={currentStatus}
          disabled={isPending}
          onValueChange={onStatusSelect}
        >
          <SelectTrigger className="border-0 shadow-none p-0 h-auto bg-transparent focus:ring-0 focus-visible:ring-0 gap-1.5 [&>svg]:hidden">
            <SelectValue>
              <StatusBadge status={currentStatus} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              <SelectLabel>Override status</SelectLabel>
              {STATUS_OPTIONS.map((s) => {
                const config = statusConfig[s.value];
                return (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", config?.dotClass ?? "bg-muted-foreground")} />
                      {s.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <p className="text-base text-muted-foreground">
        {position}
        {jobId && <span className="ml-2 text-muted-foreground/60">· {jobId}</span>}
      </p>
    </div>
  );
}