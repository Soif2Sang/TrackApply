import { Briefcase, CheckCircle2, MessageSquare, Gift, XCircle } from "lucide-react";

interface Application {
  currentStatus: string;
}

interface StatsBarProps {
  applications: Application[];
}

const STATUS_ORDER = ["applied", "acknowledged", "screening", "interview", "technical", "offer", "rejected", "withdrawn"] as const;

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Briefcase }> = {
  applied: { label: "Applied", icon: Briefcase },
  acknowledged: { label: "Acknowledged", icon: MessageSquare },
  screening: { label: "Screening", icon: MessageSquare },
  interview: { label: "Interviews", icon: CheckCircle2 },
  technical: { label: "Technical", icon: CheckCircle2 },
  offer: { label: "Offers", icon: Gift },
  rejected: { label: "Rejected", icon: XCircle },
  withdrawn: { label: "Withdrawn", icon: XCircle },
};

export function StatsBar({ applications }: StatsBarProps) {
  const total = applications.length;
  
  if (total === 0) return null;

  const statusCounts = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = applications.filter((app) => app.currentStatus === status).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
          Total
        </span>
        <span className="text-sm font-mono text-foreground tabular-nums">
          {total}
        </span>
      </div>
      {STATUS_ORDER.map((status) => {
        const count = statusCounts[status];
        if (count === 0) return null;
        const config = STATUS_CONFIG[status];
        return (
          <div key={status} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              {config.label}
            </span>
            <span className="text-sm font-mono text-foreground tabular-nums">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
