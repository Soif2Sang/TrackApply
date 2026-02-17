import { Inbox } from "lucide-react";

interface EmptyStateProps {
  connected: boolean;
}

export function EmptyState({ connected }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-muted p-4 mb-6">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-foreground font-medium text-lg mb-2">
        {connected ? "No applications found" : "Connect your Gmail"}
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
        {connected
          ? "Hit Sync Emails to scan your inbox for job application correspondence. Use the date filter to narrow the search."
          : "Connect your Gmail account to automatically detect and track your job applications from your inbox."}
      </p>
    </div>
  );
}
