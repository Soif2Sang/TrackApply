import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  applied: {
    label: "Applied",
    className: "bg-muted text-foreground",
  },
  interview: {
    label: "Interview",
    className: "bg-accent/15 text-accent",
  },
  offer: {
    label: "Offer",
    className: "bg-accent/15 text-accent",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/15 text-destructive",
  },
  ghosted: {
    label: "Ghosted",
    className: "bg-muted text-muted-foreground",
  },
  unknown: {
    label: "Unknown",
    className: "bg-muted text-muted-foreground",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
