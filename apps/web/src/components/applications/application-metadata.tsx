import { formatRelative, formatDateTime } from "@/lib/date-utils";

interface Application {
  source: string | null;
  createdAt: string;
  events: { date: string }[];
}

interface ApplicationMetadataProps {
  application: Application;
}

export function ApplicationMetadata({ application }: ApplicationMetadataProps) {
  const sortedEvents = [...application.events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="pt-6 border-t border-border text-xs text-muted-foreground font-mono">
      <div className="flex items-center gap-6">
        <div>
          <span className="text-muted-foreground/70">Applied:</span>{" "}
          <span
            title={
              sortedEvents.length > 0
                ? formatDateTime(sortedEvents[0].date)
                : formatDateTime(application.createdAt)
            }
          >
            {sortedEvents.length > 0
              ? formatRelative(sortedEvents[0].date)
              : formatRelative(application.createdAt)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground/70">Source:</span>{" "}
          <span className="capitalize">{application.source}</span>
        </div>
      </div>
    </div>
  );
}
