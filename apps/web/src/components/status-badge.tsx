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
    dotClass: "bg-blue-400",
    bgClass: "bg-blue-400/10 border-blue-400/20",
    textClass: "text-blue-400",
  },
  screening: {
    label: "Screening",
    dotClass: "bg-emerald-400",
    bgClass: "bg-emerald-400/10 border-emerald-400/20",
    textClass: "text-emerald-400",
  },
  interview: {
    label: "Interview",
    dotClass: "bg-indigo-400",
    bgClass: "bg-indigo-400/10 border-indigo-400/20",
    textClass: "text-indigo-400",
  },
  technical: {
    label: "Technical",
    dotClass: "bg-orange-400",
    bgClass: "bg-orange-400/10 border-orange-400/20",
    textClass: "text-orange-400",
  },
  offer: {
    label: "Offer",
    dotClass: "bg-green-400",
    bgClass: "bg-green-400/10 border-green-400/20",
    textClass: "text-green-400",
  },
  rejected: {
    label: "Rejected",
    dotClass: "bg-red-400",
    bgClass: "bg-red-400/10 border-red-400/20",
    textClass: "text-red-400",
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
