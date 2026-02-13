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
import { Building2, Briefcase, ChevronRight, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [filters, setFilters] = useState({
    company: "",
    position: "",
    status: "",
  });
  
  const { data: applications, isLoading } = useQuery(trpc.jobTracking.getApplications.queryOptions());

  // Filter applications based on individual column filters
  const filteredApplications = applications?.filter((app) => {
    const companyMatch = !filters.company || 
      app.company.toLowerCase().includes(filters.company.toLowerCase());
    const positionMatch = !filters.position || 
      app.position.toLowerCase().includes(filters.position.toLowerCase());
    const statusMatch = !filters.status || 
      app.currentStatus.toLowerCase().includes(filters.status.toLowerCase());
    
    return companyMatch && positionMatch && statusMatch;
  });

  const hasActiveFilters = filters.company || filters.position || filters.status;

  const clearFilters = () => {
    setFilters({ company: "", position: "", status: "" });
  };

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
      {/* Clear filters button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredApplications?.length || 0} of {applications.length} applications
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">
                <div className="space-y-1">
                  <div>Company</div>
                  <Input
                    placeholder="Filter company..."
                    value={filters.company}
                    onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                    className="h-7 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </TableHead>
              <TableHead className="min-w-[200px]">
                <div className="space-y-1">
                  <div>Position</div>
                  <Input
                    placeholder="Filter position..."
                    value={filters.position}
                    onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                    className="h-7 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </TableHead>
              <TableHead className="min-w-[150px]">
                <div className="space-y-1">
                  <div>Status</div>
                  <Input
                    placeholder="Filter status..."
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="h-7 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Applied
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">Last Update</TableHead>
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
                  {formatDate(app.appliedAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(app.lastUpdateAt)}
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
            {filteredApplications?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No applications match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
