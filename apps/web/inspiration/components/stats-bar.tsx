import type { JobApplication } from "@/lib/gmail";

interface StatsBarProps {
  applications: JobApplication[];
}

export function StatsBar({ applications }: StatsBarProps) {
  const total = applications.length;
  const applied = applications.filter((a) => a.status === "applied").length;
  const interviews = applications.filter(
    (a) => a.status === "interview"
  ).length;
  const offers = applications.filter((a) => a.status === "offer").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  const stats = [
    { label: "Total", value: total },
    { label: "Applied", value: applied },
    { label: "Interviews", value: interviews },
    { label: "Offers", value: offers },
    { label: "Rejected", value: rejected },
  ];

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            {stat.label}
          </span>
          <span className="text-sm font-mono text-foreground tabular-nums">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
