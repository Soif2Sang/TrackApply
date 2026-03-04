import { Briefcase, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

interface StatCardsProps {
  total: number;
  screening: number;
  acknowledged: number;
  rejected: number;
}

const stats = [
  {
    key: "total",
    label: "Total Applications",
    icon: Briefcase,
    iconClass: "text-foreground",
  },
  {
    key: "screening",
    label: "Screening",
    icon: Loader2,
    iconClass: "text-amber-400",
  },
  {
    key: "acknowledged",
    label: "Acknowledged",
    icon: CheckCircle2,
    iconClass: "text-sky-400",
  },
  {
    key: "rejected",
    label: "Rejected",
    icon: XCircle,
    iconClass: "text-rose-400",
  },
] as const;

export function StatCards({ total, screening, acknowledged, rejected }: StatCardsProps) {
  const values = { total, screening, acknowledged, rejected };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.key}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${stat.iconClass} ${stat.key === 'screening' ? 'animate-spin' : ''}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{values[stat.key]}</p>
          </div>
        );
      })}
    </div>
  );
}

export function StatCardsWithData() {
  const { data: applications } = useQuery(trpc.jobTracking.getApplications.queryOptions());

  if (!applications) return null;

  const total = applications.length;
  const screening = applications.filter(app => 
    ['screening', 'interview', 'technical', 'offer'].includes(app.currentStatus)
  ).length;
  const acknowledged = applications.filter(app => 
    app.currentStatus === 'acknowledged'
  ).length;
  const rejected = applications.filter(app => 
    app.currentStatus === 'rejected'
  ).length;

  return <StatCards total={total} screening={screening} acknowledged={acknowledged} rejected={rejected} />;
}
