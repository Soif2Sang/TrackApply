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
import { Building2, Briefcase, ChevronRight, Calendar, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

// Status badge color mapping with better contrast
const statusColors: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200",
  acknowledged: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200",
  screening: "bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200",
  interview: "bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200",
  technical: "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200",
  offer: "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200",
  withdrawn: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200",
};

// Status display names
const statusDisplayNames: Record<string, string> = {
  applied: "Applied",
  acknowledged: "Acknowledged",
  screening: "Screening",
  interview: "Interview",
  technical: "Technical",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
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
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full mt-2" />
          <Skeleton className="h-12 w-full mt-2" />
          <Skeleton className="h-12 w-full mt-2" />
        </div>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-16 border rounded-xl bg-gradient-to-b from-muted/30 to-muted/10">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Briefcase className="h-10 w-10 text-primary/60" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No job applications yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your applications will appear here once you start receiving emails from job applications
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredApplications?.length || 0}</span> of{" "}
            <span className="font-medium text-foreground">{applications.length}</span> applications
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
            <X className="h-3.5 w-3.5 mr-1.5" />
            Clear filters
          </Button>
        </div>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b-2 border-border hover:bg-transparent">
              <TableHead className="w-[28%] py-4 font-semibold text-foreground">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Company
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground/60" />
                    <Input
                      placeholder="Filter..."
                      value={filters.company}
                      onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                      className="h-8 text-xs pl-8 bg-white border-muted-foreground/20 focus:border-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[32%] py-4 font-semibold text-foreground">
                <div className="space-y-2">
                  <div className="text-sm">Position</div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground/60" />
                    <Input
                      placeholder="Filter..."
                      value={filters.position}
                      onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                      className="h-8 text-xs pl-8 bg-white border-muted-foreground/20 focus:border-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[15%] py-4 font-semibold text-foreground">
                <div className="space-y-2">
                  <div className="text-sm">Status</div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground/60" />
                    <Input
                      placeholder="Filter..."
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="h-8 text-xs pl-8 bg-white border-muted-foreground/20 focus:border-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[12%] py-4 font-semibold text-foreground">
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Applied
                </div>
              </TableHead>
              <TableHead className="w-[12%] py-4 font-semibold text-foreground text-sm">
                Last Update
              </TableHead>
              <TableHead className="w-[40px] py-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications?.map((app, index) => (
              <TableRow
                key={app.id}
                className="group cursor-pointer transition-colors hover:bg-muted/40 border-b border-muted last:border-b-0"
                onClick={() => navigate({ to: "/applications/$id", params: { id: app.id } })}
              >
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {app.company}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {app.position}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <Badge
                    variant="outline"
                    className={`${statusColors[app.currentStatus] || "bg-gray-100"} font-medium px-2.5 py-1 text-xs`}
                  >
                    {statusDisplayNames[app.currentStatus] || app.currentStatus}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-muted-foreground text-sm">
                  {formatDate(app.appliedAt)}
                </TableCell>
                <TableCell className="py-4 text-muted-foreground text-sm">
                  {formatDate(app.lastUpdateAt)}
                </TableCell>
                <TableCell className="py-4">
                  <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-all group-hover:translate-x-1" />
                </TableCell>
              </TableRow>
            ))}
            {filteredApplications?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/40" />
                    <p>No applications match your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
