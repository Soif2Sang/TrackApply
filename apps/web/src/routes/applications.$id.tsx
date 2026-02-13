import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, 
  Calendar, 
  Building2, 
  ChevronLeft,
  Briefcase
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Status badge color mapping
const statusColors: Record<string, string> = {
  applied: "bg-blue-100 text-blue-800 border-blue-200",
  acknowledged: "bg-yellow-100 text-yellow-800 border-yellow-200",
  screening: "bg-purple-100 text-purple-800 border-purple-200",
  interview: "bg-indigo-100 text-indigo-800 border-indigo-200",
  technical: "bg-orange-100 text-orange-800 border-orange-200",
  offer: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  withdrawn: "bg-gray-100 text-gray-800 border-gray-200",
};

// Classification badge color mapping
const classificationColors: Record<string, string> = {
  RECRUITMENT_ACK: "bg-blue-100 text-blue-800",
  NEXT_STEP: "bg-green-100 text-green-800",
  DISAPPROVAL: "bg-red-100 text-red-800",
};

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const Route = createFileRoute("/applications/$id")({
  component: ApplicationDetailPage,
});

function ApplicationDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const { data: application, isLoading } = useQuery(
    trpc.jobTracking.getApplicationById.queryOptions({ id })
  );

  // Calculate applied date from earliest event
  const appliedAt = application?.events && application.events.length > 0
    ? new Date(application.events.reduce((earliest, event) => 
        new Date(event.date) < new Date(earliest.date) ? event : earliest
      ).date)
    : application?.createdAt;

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-4 mt-8">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Application not found</p>
            <Button className="mt-4" onClick={() => navigate({ to: "/" })}>
              Go Back Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Application Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                <Building2 className="h-8 w-8 text-primary" />
                {application.company}
              </h1>
              <p className="text-xl text-muted-foreground">
                {application.position}
                {application.jobId && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    (ID: {application.jobId})
                  </span>
                )}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`text-base px-4 py-2 ${statusColors[application.currentStatus] || "bg-gray-100"}`}
            >
              {application.currentStatus.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Timeline ({application.events.length} emails)
          </h2>
          
          <div className="space-y-4">
            {application.events.map((event) => (
              <div
                key={event.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={classificationColors[event.classification] || "bg-gray-100"}
                      >
                        {event.classification.replace("_", " ")}
                      </Badge>
                      {event.confidence && (
                        <span className="text-xs text-muted-foreground">
                          {event.confidence} confidence
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm">{event.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From: {event.from}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateTime(event.date)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-6 text-sm text-muted-foreground border-t pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="font-medium">Applied:</span>
              <p>{formatDateTime(appliedAt || application.createdAt)}</p>
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>
              <p>{formatDateTime(application.updatedAt)}</p>
            </div>
            <div>
              <span className="font-medium">Source:</span>
              <p className="capitalize">{application.source}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
