import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Calendar, Building2, Briefcase, ChevronRight } from "lucide-react";

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

export function JobApplicationsTable() {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  
  const { data: applications, isLoading } = useQuery(trpc.jobTracking.getApplications.queryOptions());
  const { data: selectedApplication } = useQuery({
    ...trpc.jobTracking.getApplicationById.queryOptions({ id: selectedAppId! }),
    enabled: !!selectedAppId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/50">
        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No job applications yet</h3>
        <p className="text-muted-foreground">
          Your applications will appear here once you start receiving emails
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app: typeof applications[0]) => (
              <TableRow
                key={app.id}
                className="cursor-pointer hover:bg-muted/60"
                onClick={() => setSelectedAppId(app.id)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {app.company}
                  </div>
                </TableCell>
                <TableCell>{app.position}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColors[app.currentStatus] || "bg-gray-100"}
                  >
                    {app.currentStatus.replace("_", " ").toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {app.latestEvent ? formatDate(app.latestEvent.createdAt) : formatDate(app.createdAt)}
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedAppId} onOpenChange={() => setSelectedAppId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedApplication?.company || "Loading..."}
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedApplication?.position || "Loading application details..."}
              {selectedApplication?.jobId && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (ID: {selectedApplication.jobId})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication ? (
            <div className="space-y-6 mt-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Current Status:</span>
                <Badge
                  variant="outline"
                  className={statusColors[selectedApplication.currentStatus] || "bg-gray-100"}
                >
                  {selectedApplication.currentStatus.replace("_", " ").toUpperCase()}
                </Badge>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Timeline ({selectedApplication.events.length} emails)
                </h3>
                <div className="space-y-3">
                  {selectedApplication.events.map((event: typeof selectedApplication.events[0]) => (
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
                          <p className="font-medium text-sm truncate">{event.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            From: {event.from}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(event.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground border-t pt-4">
                <p>Applied: {formatDateTime(selectedApplication.createdAt)}</p>
                <p>Last Updated: {formatDateTime(selectedApplication.updatedAt)}</p>
                <p>Source: {selectedApplication.source}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2 mt-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
