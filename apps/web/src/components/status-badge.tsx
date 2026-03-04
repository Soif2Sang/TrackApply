// Status badge config with dot style (v0 design)
export const statusConfig: Record<
  string,
  { label: string; dotClass: string; bgClass: string; textClass: string }
> = {
  applied: {
    label: "Applied",
    dotClass: "bg-blue-400",
    bgClass: "bg-blue-400/10 border-blue-400/20",
    textClass: "text-blue-400",
  },
  acknowledged: {
    label: "Acknowledged",
    dotClass: "bg-sky-400",
    bgClass: "bg-sky-400/10 border-sky-400/20",
    textClass: "text-sky-400",
  },
  screening: {
    label: "Screening",
    dotClass: "bg-amber-400",
    bgClass: "bg-amber-400/10 border-amber-400/20",
    textClass: "text-amber-400",
  },
  interview: {
    label: "Interview",
    dotClass: "bg-violet-400",
    bgClass: "bg-violet-400/10 border-violet-400/20",
    textClass: "text-violet-400",
  },
  technical: {
    label: "Technical",
    dotClass: "bg-cyan-400",
    bgClass: "bg-cyan-400/10 border-cyan-400/20",
    textClass: "text-cyan-400",
  },
  offer: {
    label: "Offer",
    dotClass: "bg-emerald-400",
    bgClass: "bg-emerald-400/10 border-emerald-400/20",
    textClass: "text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    dotClass: "bg-rose-400",
    bgClass: "bg-rose-400/10 border-rose-400/20",
    textClass: "text-rose-400",
  },
  withdrawn: {
    label: "Withdrawn",
    dotClass: "bg-gray-400",
    bgClass: "bg-gray-400/10 border-gray-400/20",
    textClass: "text-gray-400",
  },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    dotClass: "bg-gray-400",
    bgClass: "bg-gray-400/10 border-gray-400/20",
    textClass: "text-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bgClass} ${config.textClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}
