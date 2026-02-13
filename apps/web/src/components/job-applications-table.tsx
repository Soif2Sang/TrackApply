import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Briefcase, ChevronRight, Search, Calendar } from "lucide-react";

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

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function JobApplicationsTable() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: applications, isLoading } = useQuery(trpc.jobTracking.getApplications.queryOptions());

  // Filter applications based on search query
  const filteredApplications = applications?.filter((app) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const companyMatch = app.company.toLowerCase().includes(query);
    const positionMatch = app.position.toLowerCase().includes(query);
    const statusMatch = app.currentStatus.toLowerCase().includes(query);
    
    return companyMatch || positionMatch || statusMatch;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by company, position, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredApplications?.length || 0} of {applications.length} applications
        </p>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Applied
                </div>
              </TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications?.map((app) => (
              <TableRow
                key={app.id}
                className="cursor-pointer hover:bg-muted/60"
                onClick={() => navigate({ to: "/applications/$id", params: { id: app.id } })}
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
                  {formatDate(app.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {app.latestEvent ? formatDate(app.latestEvent.createdAt) : formatDate(app.createdAt)}
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
            {filteredApplications?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No applications match your search
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
